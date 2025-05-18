import { supabase } from './supabase';

// Authentication functions
export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  if (error) throw error;
  return data;
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function isAuthenticated() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return false;
  const { user } = session;
  return !!(user && user.email_confirmed_at);
}

// File handling functions
export async function uploadFile(file, noteId, isCollab = false) {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const uniqueName = `${Date.now()}_${safeName}`;
  const path = isCollab ? `collab/${noteId}/${uniqueName}` : `individual/${noteId}/${uniqueName}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from("uploads")
    .upload(path, file, { upsert: true, metadata: { note_id: noteId } });

  if (uploadError) throw uploadError;

  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from("uploads")
    .getPublicUrl(path);

  // Save metadata
  const { error: metadataError } = await supabase
    .from("files")
    .insert([{
      note_id: noteId,
      name: file.name,
      type: file.type,
      size: file.size,
      url: publicUrlData.publicUrl,
      path,
      is_collab: isCollab,
      uploaded_at: new Date().toISOString()
    }]);

  if (metadataError) throw metadataError;

  return publicUrlData.publicUrl;
}

export async function deleteFile(fileId, filePath) {
  // Remove from storage
  if (filePath) {
    const { error: storageError } = await supabase.storage
      .from("uploads")
      .remove([filePath]);
    if (storageError) throw storageError;
  }

  // Remove metadata
  const { error: dbError } = await supabase
    .from("files")
    .delete()
    .eq("id", fileId);
  if (dbError) throw dbError;
}

// Project functions
export async function createProject(title, description = '') {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Create project with creator as user_id
  const { data, error } = await supabase
    .from('projects')
    .insert([{
      title,
      description,
      user_id: user.id
    }])
    .select();

  if (error) throw error;

  // Add creator as admin in project_members
  const project = data[0];
  const { error: memberError } = await supabase
    .from('project_members')
    .insert([{
      project_id: project.id,
      user_id: user.id,
      role: 'admin'
    }]);
  if (memberError) throw memberError;

  return project;
}

export async function joinProject(projectId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Check if already a member
  const { data: existing, error: fetchError } = await supabase
    .from('project_members')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
  if (existing) throw new Error('Already a member of this project');

  // Add user as viewer
  const { error: insertError } = await supabase
    .from('project_members')
    .insert([{
      project_id: projectId,
      user_id: user.id,
      role: 'viewer'
    }]);
  if (insertError) throw insertError;
}

