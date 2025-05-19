import { supabase } from './supabase';

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
        status: 'accepted',
        role: 'admin' // Add role for the creator
      }]);

    if (memberError) throw memberError;

    return group;
  } catch (error) {
    console.error('Error in createGroup:', error);
    throw error;
  }
};

// Invite a user to a group (internal, by userId)
export const inviteUserToGroup = async (groupId, userId, inviterId) => {
  // First verify if the inviter has permission to invite
  const { data: inviterRole, error: roleError } = await supabase
    .from('project_members')
    .select('role')
    .eq('project_id', groupId)
    .eq('user_id', inviterId)
    .single();

  if (roleError || !inviterRole || !['admin', 'moderator'].includes(inviterRole.role)) {
    throw new Error('You do not have permission to invite users to this group');
  }

  // Check if user exists
  const { data: userExists, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .single();

  if (userError || !userExists) {
    throw new Error('User not found');
  }

  // Check if already invited or member
  const { data: existing, error: checkError } = await supabase
    .from('projects_invitations')
    .select()
    .eq('project_id', groupId)
    .eq('invited_user_id', userId)
    .eq('status', 'pending')
    .maybeSingle();
  if (checkError) throw checkError;
  if (existing) return { reused: true, invitation: existing };

  // Get group details for notification
  const { data: group, error: groupError } = await supabase
    .from('projects')
    .select('title')
    .eq('id', groupId)
    .single();
  if (groupError) throw groupError;

  // Create invitation
  const { data: invitation, error: createError } = await supabase
    .from('projects_invitations')
    .insert([{
      project_id: groupId,
      invited_user_id: userId,
      invited_by: inviterId,
      status: 'pending',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      invitation_token: crypto.randomUUID()
    }])
    .select()
    .single();
  if (createError) throw createError;

  // Create notification
  const { error: notifyError } = await supabase.from('notifications').insert([{
    user_id: userId,
    type: 'group_invitation',
    title: 'New Group Invitation',
    message: `You have been invited to join ${group.title}`,
    data: { 
      group_id: groupId,
      group_title: group.title,
      invitation_token: invitation.invitation_token,
      inviter_id: inviterId
    },
    is_read: false,
    created_at: new Date().toISOString()
  }]);

  if (notifyError) throw notifyError;

  return { invitation, reused: false };
};

// Accept a group invitation
export const acceptGroupInvitation = async (invitationToken, userId) => {
  // Get invitation with group details
  const { data: invitation, error: inviteError } = await supabase
    .from('projects_invitations')
    .select(`
      project_id,
      status,
      projects (
        title
      )
    `)
    .eq('invitation_token', invitationToken)
    .eq('invited_user_id', userId)
    .eq('status', 'pending')
    .maybeSingle();

  if (inviteError || !invitation) {
    throw inviteError || new Error('Invalid or expired invitation');
  }

  // Start a transaction
  try {
  // Add to project_members
  const { error: memberError } = await supabase
    .from('project_members')
    .insert({
      user_id: userId,
      project_id: invitation.project_id,
      status: 'accepted',
        role: 'member',
      joined_at: new Date().toISOString()
    });
  if (memberError) throw memberError;

  // Mark invitation as accepted
    const { error: updateError } = await supabase
    .from('projects_invitations')
    .update({ status: 'accepted' })
    .eq('invitation_token', invitationToken);
    if (updateError) throw updateError;

    // Create success notification
    const { error: notifyError } = await supabase
      .from('notifications')
      .insert([{
        user_id: userId,
        type: 'group_joined',
        title: 'Group Joined',
        message: `You have successfully joined ${invitation.projects.title}`,
        data: { group_id: invitation.project_id },
        is_read: false,
        created_at: new Date().toISOString()
      }]);
    if (notifyError) throw notifyError;

  return { groupId: invitation.project_id };
  } catch (error) {
    console.error('Error accepting invitation:', error);
    throw error;
  }
};

// Get user's groups with real-time subscription
export const getUserGroups = async (userId) => {
  const { data: memberships, error } = await supabase
    .from('project_members')
    .select(`
      project_id,
      role,
      projects (
        id,
        title,
        description,
        created_at,
        created_by,
        user_id
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'accepted');

  if (error) throw error;
  return memberships.map(m => ({ ...m.projects, role: m.role }));
};

// Search users by name or email
export const searchUsers = async (query) => {
  if (!query) return [];
  
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email')
    .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
    .limit(5);

  if (error) {
    console.error('Error searching users:', error);
    throw error;
  }

  return data || [];
};

// Get group members with roles
export const getGroupMembers = async (groupId) => {
  try {
    // First get the members
  const { data: members, error } = await supabase
    .from('project_members')
      .select('user_id, role, joined_at, status')
    .eq('project_id', groupId)
    .eq('status', 'accepted');

    if (error) {
      console.error('Error fetching members:', error);
      throw error;
    }

    if (!members || members.length === 0) {
      return [];
    }

    // Get user details
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email')
      .in('id', members.map(m => m.user_id));

    if (usersError) {
      console.error('Error fetching users:', usersError);
      throw usersError;
    }

    // Create a map of user details
    const userMap = new Map(users.map(u => [u.id, u]));

    // Combine member and user data
    return members.map(member => {
      const user = userMap.get(member.user_id);
      return {
        id: member.user_id,
        role: member.role,
        joinedAt: member.joined_at,
        email: user?.email || 'Unknown',
        name: user?.name || 'Unknown User'
      };
    });
  } catch (error) {
    console.error('Error in getGroupMembers:', error);
    throw error;
  }
};

// Get all notifications for a user
export const getUserNotifications = async (userId, filter = 'all') => {
  try {
    let query = supabase
      .from('notifications')
      .select(`
        *,
        projects (
          id,
          title
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (filter === 'unread') {
      query = query.eq('is_read', false);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw error;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (userId) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

  if (error) throw error;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

// Get pending invitations
export const getPendingInvitations = async (userId) => {
  const { data: invitations, error } = await supabase
    .from('projects_invitations')
    .select(`
      *,
      projects (
        title
      ),
      inviter:invited_by (
        email,
        user_metadata
      )
    `)
    .eq('invited_user_id', userId)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (error) throw error;
  return invitations.map(inv => ({
    ...inv,
    group_title: inv.projects.title,
    inviter_name: inv.inviter.user_metadata?.full_name || inv.inviter.email
  }));
};

// Subscribe to invitations with enhanced data
export const subscribeToInvitations = (userId, callback) => {
  const channel = supabase
    .channel(`invitations:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'projects_invitations',
        filter: `invited_user_id=eq.${userId}`
      },
      async (payload) => {
        // Enhance the payload with group and inviter details
        if (payload.new) {
          const { data: details } = await supabase
            .from('projects')
            .select('title')
            .eq('id', payload.new.project_id)
            .single();

          const { data: inviter } = await supabase
            .from('users')
            .select('email, user_metadata')
            .eq('id', payload.new.invited_by)
            .single();

          payload.new.group_title = details?.title;
          payload.new.inviter_name = inviter?.user_metadata?.full_name || inviter?.email;
        }
        callback(payload);
      }
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
};

// Subscribe to realtime updates for group notes
export const subscribeToGroupNotes = (groupId, callback) => {
  const channel = supabase
    .channel(`group-notes:${groupId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notes',
        filter: `project_id=eq.${groupId}`
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
};

// Subscribe to realtime updates for group presence
export const subscribeToGroupPresence = (groupId, userId, callback) => {
  const channel = supabase
    .channel(`presence:${groupId}`)
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      callback(state);
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          user_id: userId,
          online_at: new Date().toISOString()
        });
      }
    });

  return () => {
    channel.unsubscribe();
  };
};

// Decline a group invitation with notification
export const declineGroupInvitation = async (invitationToken, userId) => {
  const { data: invitation, error: getError } = await supabase
    .from('projects_invitations')
    .select('project_id, projects (title)')
    .eq('invitation_token', invitationToken)
    .eq('invited_user_id', userId)
    .single();

  if (getError) throw getError;

  const { error: updateError } = await supabase
    .from('projects_invitations')
    .update({ status: 'declined' })
    .eq('invitation_token', invitationToken)
    .eq('invited_user_id', userId);

  if (updateError) throw updateError;

  // Add notification about declining
  await supabase.from('notifications').insert([{
    user_id: userId,
    type: 'invitation_declined',
    title: 'Invitation Declined',
    message: `You declined the invitation to join ${invitation.projects.title}`,
    data: { group_id: invitation.project_id },
    is_read: false,
    created_at: new Date().toISOString()
  }]);
};