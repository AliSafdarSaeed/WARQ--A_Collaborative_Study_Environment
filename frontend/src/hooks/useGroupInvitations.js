import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { getPendingInvitations, subscribeToInvitations } from '../services/groupService';

export const useGroupInvitations = (userId) => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;

    const loadInvitations = async () => {
      try {
        setLoading(true);
        const pendingInvitations = await getPendingInvitations(userId);
        setInvitations(pendingInvitations);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // Initial load
    loadInvitations();

    // Subscribe to realtime updates
    const unsubscribe = subscribeToInvitations(userId, (payload) => {
      if (payload.eventType === 'INSERT') {
        setInvitations((prev) => [...prev, payload.new]);
      } else if (payload.eventType === 'UPDATE') {
        setInvitations((prev) =>
          prev.map((inv) =>
            inv.id === payload.new.id ? payload.new : inv
          )
        );
      } else if (payload.eventType === 'DELETE') {
        setInvitations((prev) =>
          prev.filter((inv) => inv.id !== payload.old.id)
        );
      }
    });

    return () => {
      unsubscribe();
    };
  }, [userId]);

  const acceptInvitation = async (invitationToken) => {
    try {
      const { data, error } = await supabase
        .from('projects_invitations')
        .update({ status: 'accepted' })
        .eq('invitation_token', invitationToken)
        .eq('invited_user_id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const declineInvitation = async (invitationToken) => {
    try {
      const { data, error } = await supabase
        .from('projects_invitations')
        .update({ status: 'declined' })
        .eq('invitation_token', invitationToken)
        .eq('invited_user_id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    invitations,
    loading,
    error,
    acceptInvitation,
    declineInvitation
  };
}; 