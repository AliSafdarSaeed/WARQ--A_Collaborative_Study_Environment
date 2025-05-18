import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import Spinner from '../../components/Spinner';
import { toast } from 'react-hot-toast';

// Helper function to get the network URL
const getNetworkUrl = () => {
  return 'http://10.7.42.128:3000';
};

const AcceptInvitation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = searchParams.get('token');

  useEffect(() => {
    const checkInvitation = async () => {
      try {
        setLoading(true);
        
        if (!token) {
          setError('Invalid invitation link');
          return;
        }

        // First, verify if the invitation is valid and not expired
        const { data: invitation, error: inviteError } = await supabase
          .from('projects_invitations')
          .select('*, projects(title)')
          .eq('invitation_token', token)
          .eq('status', 'pending')
          .gt('expires_at', new Date().toISOString())
          .single();

        if (inviteError || !invitation) {
          throw new Error('Invalid or expired invitation');
        }

        // Check if user is logged in
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          // Not logged in - redirect to signup with invitation token
          navigate(`/signup?token=${token}`);
          return;
        }

        // User is logged in - check if this is their invitation
        if (invitation.invited_email.toLowerCase() !== session.user.email.toLowerCase()) {
          throw new Error('This invitation was sent to a different email address');
        }

        // Accept the invitation
        const { data: acceptData, error: acceptError } = await supabase.functions.invoke('accept-invitation', {
          body: JSON.stringify({ token })
        });

        if (acceptError) throw acceptError;

        if (!acceptData?.groupId) {
          throw new Error('Failed to accept invitation');
        }

        // Send real-time notification about member joining
        await supabase.from('notifications').insert([{
          type: 'member_joined',
          title: 'New Member Joined',
          message: `${session.user.email} has joined the group "${invitation.projects.title}"`,
          group_id: acceptData.groupId,
          user_id: session.user.id,
          created_at: new Date().toISOString()
        }]);

        // Update member status
        await supabase
          .from('project_members')
          .update({ 
            status: 'active',
            joined_at: new Date().toISOString()
          })
          .eq('project_id', acceptData.groupId)
          .eq('user_id', session.user.id);

        // Redirect to the group's dashboard
        navigate(`/dashboard?group=${acceptData.groupId}`);
        toast.success('Successfully joined the group!');

      } catch (err) {
        console.error('Error accepting invitation:', err);
        setError(err.message || 'Failed to accept invitation');
      } finally {
        setLoading(false);
      }
    };

    checkInvitation();
  }, [token, navigate]);

  if (loading) {
    return (
      <div className="accept-invitation-container">
        <div className="loading-state">
          <Spinner />
          <p>Processing invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="accept-invitation-container">
        <div className="error-state">
          <div className="error-message">{error}</div>
          <button
            onClick={() => navigate('/')}
            className="home-button"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default AcceptInvitation; 