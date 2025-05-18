import { supabase } from './supabase';
import { sendInvitationEmail } from './emailService';
import { v4 as uuidv4 } from 'uuid';

// Create a new group
export const createGroup = async (name, description = '') => {
  // Get current user's session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) {
    throw new Error('Authentication required');
  }

  // Start a transaction
  try {
    // Create the project
    const { data: group, error: groupError } = await supabase
      .from('projects')
      .insert([{
        title: name,
        description,
        created_by: session.user.id,
        user_id: session.user.id
      }])
      .select()
      .single();

    if (groupError) throw groupError;

    // Add creator as member
    const { error: memberError } = await supabase
      .from('project_members')
      .insert([{
        project_id: group.id,
        user_id: session.user.id,
        status: 'accepted'
      }]);

    if (memberError) throw memberError;

    return group;
  } catch (error) {
    console.error('Error in createGroup:', error);
    throw error;
  }
};

// Send group invitation
export const inviteToGroup = async (groupId, email) => {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      throw new Error('Authentication required');
    }

    // Get group details first
    const { data: group, error: groupError } = await supabase
      .from('projects')
      .select('title')
      .eq('id', groupId)
      .single();

    if (groupError) throw groupError;

    // Check if user already exists in auth.users
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email.toLowerCase())
      .single();

    if (userError && userError.code !== 'PGRST116') {
      console.error('Error checking existing user:', userError);
      throw userError;
    }

    // Check if user is already a member of the group
    if (existingUser?.id) {
      const { data: existingMember } = await supabase
        .from('project_members')
        .select()
        .eq('project_id', groupId)
        .eq('user_id', existingUser.id)
        .single();

      if (existingMember) {
        throw new Error('User is already a member of this group');
      }
    }

    // Check if invitation already exists
    const { data: existing, error: checkError } = await supabase
      .from('projects_invitations')
      .select()
      .eq('project_id', groupId)
      .eq('invited_email', email.toLowerCase())
      .eq('status', 'pending')
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing invitation:', checkError);
      throw checkError;
    }

    if (existing) {
      return { invitation: existing, reused: true };
    }

    // Set expiration to 7 days from now
    const expires_at = new Date();
    expires_at.setDate(expires_at.getDate() + 7);

    // Generate invitation token
    const invitation_token = uuidv4();

    // Create new invitation
    const { data: invitation, error: createError } = await supabase
      .from('projects_invitations')
      .insert([{
        project_id: groupId,
        invited_email: email.toLowerCase(),
        invited_user_id: existingUser?.id || null,
        invited_by: session.user.id,
        status: 'pending',
        expires_at: expires_at.toISOString(),
        invitation_token: invitation_token
      }])
      .select()
      .single();

    if (createError) {
      console.error('Error creating invitation:', createError);
      throw createError;
    }

    // If user exists, create in-app notification
    if (existingUser?.id) {
      const { error: notifyError } = await supabase.from('notifications').insert([{
        user_id: existingUser.id,
        type: 'group_invitation',
        title: 'New Group Invitation',
        message: `${session.user.email} has invited you to join "${group.title}"`,
        data: {
          group_id: groupId,
          group_title: group.title,
          invitation_token: invitation_token
        },
        is_read: false,
        created_at: new Date().toISOString()
      }]);

      if (notifyError) {
        console.error('Error creating notification:', notifyError);
      }

      // Also send a real-time notification
      const notificationChannel = supabase.channel('custom-insert-channel')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications' },
          (payload) => {
            console.log('Change received!', payload);
          }
        )
        .subscribe();

    } else {
      // Send email invitation only for non-existing users
      await sendInvitationEmail({
        toEmail: email,
        fromEmail: session.user.email,
        groupName: group.title,
        invitationToken: invitation_token
      });
    }

    return { invitation, reused: false };
  } catch (error) {
    console.error('Invitation error:', error);
    throw error;
  }
};

// Accept group invitation
export const acceptInvitation = async (token) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  // Begin transaction to accept invitation
  const { error: acceptError } = await supabase
    .rpc('accept_group_invitation', {
      p_token: token,
      p_user_id: user.id
    });

  if (acceptError) throw acceptError;

  // Get the group details to return
  const { data: invitation } = await supabase
    .from('projects_invitations')
    .select('*, projects(*)')
    .eq('invitation_token', token)
    .single();

  return invitation.projects;
};

// Get user's groups
export const getUserGroups = async () => {
  const { data: memberships, error } = await supabase
    .from('project_members')
    .select(`
      project_id,
      projects (
        id,
        title,
        description,
        created_at,
        created_by
      )
    `)
    .eq('status', 'accepted');

  if (error) throw error;

  return memberships.map(m => ({
    ...m.projects
  }));
};

// Get group members
export const getGroupMembers = async (groupId) => {
  const { data: members, error } = await supabase
    .from('project_members')
    .select(`
      user_id,
      joined_at,
      users:user_id (
        id,
        email,
        raw_user_meta_data->'name' as name
      )
    `)
    .eq('project_id', groupId)
    .eq('status', 'accepted');

  if (error) throw error;

  return members.map(m => ({
    id: m.user_id,
    joinedAt: m.joined_at,
    ...m.users
  }));
};

// Get pending invitations for the current user
export const getPendingInvitations = async () => {
  try {
    // Get current user
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError) throw authError;
    if (!session) throw new Error('Authentication required');

    // Get pending invitations
    const { data: invitations, error: invitationsError } = await supabase
      .from('projects_invitations')
      .select('*')
      .eq('invited_email', session.user.email.toLowerCase())
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (invitationsError) throw invitationsError;

    return invitations;
  } catch (error) {
    console.error('Error fetching pending invitations:', error);
    throw error;
  }
};