import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../services/supabase';
import { Editor } from '@tinymce/tinymce-react';
import { debounce } from 'lodash';
import {
  showUserJoinedNotification,
  showUserTypingNotification,
  showUserEditingNotification,
  clearUserNotifications,
  clearAllNotifications
} from '../../utils/notificationHelpers';
import './Note.css';

const Note = ({ noteId, userId, userName, isGroupNote }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeUsers, setActiveUsers] = useState(new Set());
  const editorRef = useRef(null);
  const channelRef = useRef(null);

  // Load note content
  useEffect(() => {
    loadNote();
    if (isGroupNote) {
      subscribeToPresence();
      return () => {
        if (channelRef.current) {
          channelRef.current.unsubscribe();
          clearAllNotifications();
        }
      };
    }
  }, [noteId]);

  const loadNote = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notes')
        .select('content')
        .eq('id', noteId)
        .single();

      if (error) throw error;
      setContent(data.content || '');
    } catch (error) {
      console.error('Error loading note:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToPresence = () => {
    channelRef.current = supabase.channel(`note:${noteId}`)
      .on('presence', { event: 'sync' }, () => {
        const newState = channelRef.current.presenceState();
        const users = new Set(Object.values(newState).map(presence => presence[0]?.user_id));
        setActiveUsers(users);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        newPresences.forEach(presence => {
          if (presence.user_id !== userId) {
            showUserJoinedNotification(presence.user_id, presence.user_name);
          }
        });
      })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.user_id !== userId) {
          showUserTypingNotification(payload.user_id, payload.user_name);
        }
      })
      .on('broadcast', { event: 'editing' }, ({ payload }) => {
        if (payload.user_id !== userId) {
          showUserEditingNotification(payload.user_id, payload.user_name);
        }
      });

    channelRef.current.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channelRef.current.track({
          user_id: userId,
          user_name: userName,
          online_at: new Date().toISOString(),
        });
      }
    });
  };

  // Debounced save function
  const saveNote = debounce(async (content) => {
    try {
      const { error } = await supabase
        .from('notes')
        .update({ content })
        .eq('id', noteId);

      if (error) throw error;

      if (isGroupNote && channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'editing',
          payload: {
            user_id: userId,
            user_name: userName,
          }
        });
      }
    } catch (error) {
      console.error('Error saving note:', error);
    }
  }, 1000);

  // Handle typing notification
  const handleTyping = debounce(() => {
    if (isGroupNote && channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          user_id: userId,
          user_name: userName,
        }
      });
    }
  }, 500);

  const handleEditorChange = (content) => {
    setContent(content);
    saveNote(content);
    handleTyping();
  };

  if (loading) {
    return <div className="loading">Loading note...</div>;
  }

  return (
    <div className="note-container">
      {isGroupNote && (
        <div className="active-users">
          {Array.from(activeUsers).length > 0 && (
            <span>{Array.from(activeUsers).length} user(s) viewing this note</span>
          )}
        </div>
      )}
      <Editor
        onInit={(evt, editor) => editorRef.current = editor}
        value={content}
        onEditorChange={handleEditorChange}
        init={{
          height: '100%',
          menubar: true,
          plugins: [
            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
            'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
          ],
          toolbar: 'undo redo | blocks | ' +
            'bold italic forecolor | alignleft aligncenter ' +
            'alignright alignjustify | bullist numlist outdent indent | ' +
            'removeformat | help',
          content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 14px }'
        }}
      />
    </div>
  );
};

export default Note; 