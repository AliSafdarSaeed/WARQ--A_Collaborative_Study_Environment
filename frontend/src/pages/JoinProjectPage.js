import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';

export default function JoinProjectPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [alreadyMember, setAlreadyMember] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchProject = async () => {
      setLoading(true);
      setError('');
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setUser(null);
          setLoading(false);
          return;
        }
        setUser(session.user);
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single();
        if (projectError || !projectData) {
          setError('Project not found.');
          setLoading(false);
          return;
        }
        setProject(projectData);
        // Check if already a member
        const { data: memberData } = await supabase
          .from('project_members')
          .select('*')
          .eq('project_id', projectId)
          .eq('user_id', session.user.id)
          .single();
        setAlreadyMember(!!memberData && memberData.status === 'accepted');
      } catch (err) {
        setError('Failed to load project.');
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [projectId]);

  const handleJoin = async () => {
    setJoining(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('You must be logged in to join.');
        setJoining(false);
        return;
      }
      // Insert or update project_members
      const { error } = await supabase.from('project_members').upsert({
        project_id: projectId,
        user_id: session.user.id,
        role: 'viewer',
        status: 'accepted',
        joined_at: new Date().toISOString(),
      });
      if (error) throw error;
      setAlreadyMember(true);
      setTimeout(() => navigate('/dashboard'), 1200);
    } catch (err) {
      setError('Failed to join project.');
    } finally {
      setJoining(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <Modal onClose={() => navigate('/')}> 
      <h2 style={{ color: '#47e584', marginBottom: 12 }}>Join Project</h2>
      {project ? (
        <>
          <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>{project.title}</div>
          <div style={{ color: '#aaa', marginBottom: 16 }}>{project.description}</div>
          {alreadyMember ? (
            <div style={{ color: '#47e584', marginBottom: 16 }}>You are already a member of this project!</div>
          ) : (
            <button
              onClick={handleJoin}
              disabled={joining}
              style={{ background: '#47e584', color: '#181818', fontWeight: 700, border: 'none', borderRadius: 4, padding: '10px 24px', fontSize: 16, cursor: 'pointer', marginBottom: 12 }}
            >
              {joining ? 'Joining...' : 'Join Project'}
            </button>
          )}
          <button
            onClick={() => navigate('/dashboard')}
            style={{ background: 'none', color: '#47e584', border: '1px solid #47e584', borderRadius: 4, padding: '8px 18px', fontWeight: 700, cursor: 'pointer' }}
          >Go to Dashboard</button>
        </>
      ) : (
        <div style={{ color: 'red', marginBottom: 16 }}>{error || 'Project not found.'}</div>
      )}
    </Modal>
  );
} 