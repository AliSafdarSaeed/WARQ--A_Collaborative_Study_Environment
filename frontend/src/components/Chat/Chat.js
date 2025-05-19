import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../services/supabase';
import { IoClose, IoSend } from 'react-icons/io5';
import { toast } from 'react-hot-toast';
import './Chat.css';

const Chat = ({ projectId, userId, userName, showChat, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContentRef = useRef(null);
  const channelRef = useRef(null);
  const oldestMessageRef = useRef(null);

  const PAGE_SIZE = 30;

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load initial messages and set up subscription
  useEffect(() => {
    if (projectId) {
      loadMessages();
      const subscription = subscribeToMessages();
      return () => {
        if (subscription) {
          subscription.unsubscribe();
        }
      };
    }
  }, [projectId]);

  // Infinite scroll: load more when scrolled to top
  useEffect(() => {
    const container = chatContentRef.current;
    if (!container) return;
    const handleScroll = () => {
      if (container.scrollTop === 0 && hasMore && !loadingMore && messages.length > 0) {
        loadOlderMessages();
      }
    };
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasMore, loadingMore, messages]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      setHasMore(true);
      
      // First, verify project membership
      const { data: membership, error: membershipError } = await supabase
        .from('project_members')
        .select('status')
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .single();

      if (membershipError || !membership || membership.status !== 'accepted') {
        throw new Error('Not a member of this project');
      }

      // Then, get the list of accepted members for this project
      const { data: acceptedMembers, error: membersError } = await supabase
        .from('project_members')
        .select('user_id')
        .eq('project_id', projectId)
        .eq('status', 'accepted');

      if (membersError) throw membersError;

      const memberIds = acceptedMembers.map(member => member.user_id);

      // Now load messages with user data for accepted members only
      const { data: messages, error: messagesError } = await supabase
        .from('project_chats')
        .select(`
          id,
          content,
          user_id,
          created_at,
          users (
            name,
            email
          )
        `)
        .eq('project_id', projectId)
        .in('user_id', memberIds)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (messagesError) throw messagesError;

      // Transform messages to include user names
      const transformedMessages = (messages || []).map(message => ({
        ...message,
        userName: message.users?.name || 'Unknown User'
      })).reverse();

      setMessages(transformedMessages);
      if (messages && messages.length < PAGE_SIZE) setHasMore(false);
      oldestMessageRef.current = transformedMessages[0]?.created_at || null;
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    // Unsubscribe from existing channel if any
    if (channelRef.current) {
      channelRef.current.unsubscribe();
    }

    // Create new channel
    channelRef.current = supabase
      .channel(`project_chats:${projectId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'project_chats',
        filter: `project_id=eq.${projectId}`
      }, async (payload) => {
        try {
          // Verify the message is from an accepted member
          const { data: membership, error: membershipError } = await supabase
            .from('project_members')
            .select('status')
            .eq('project_id', projectId)
            .eq('user_id', payload.new.user_id)
            .single();

          if (membershipError || !membership || membership.status !== 'accepted') {
            return; // Ignore messages from non-members
          }

          // Fetch complete message data with user info
          const { data: message, error } = await supabase
            .from('project_chats')
            .select(`
              id,
              content,
              user_id,
              created_at,
              users (
                name,
                email
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (error) throw error;

          const transformedMessage = {
            ...message,
            userName: message.users?.name || 'Unknown User'
          };

          setMessages(current => [...current, transformedMessage]);
          scrollToBottom();
        } catch (error) {
          console.error('Error handling new message:', error);
          toast.error('Failed to load new message');
        }
      })
      .subscribe();

    return channelRef.current;
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sendingMessage) return;

    try {
      setSendingMessage(true);
      const { error } = await supabase
        .from('project_chats')
        .insert({
          content: newMessage.trim(),
          user_id: userId,
          project_id: projectId
        });

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const loadOlderMessages = async () => {
    if (!oldestMessageRef.current) return;
    setLoadingMore(true);
    try {
      // First, verify project membership
      const { data: membership, error: membershipError } = await supabase
        .from('project_members')
        .select('status')
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .single();

      if (membershipError || !membership || membership.status !== 'accepted') {
        throw new Error('Not a member of this project');
      }

      // Then, get the list of accepted members for this project
      const { data: acceptedMembers, error: membersError } = await supabase
        .from('project_members')
        .select('user_id')
        .eq('project_id', projectId)
        .eq('status', 'accepted');

      if (membersError) throw membersError;

      const memberIds = acceptedMembers.map(member => member.user_id);

      // Load older messages
      const { data: messages, error: messagesError } = await supabase
        .from('project_chats')
        .select(`
          id,
          content,
          user_id,
          created_at,
          users (
            name,
            email
          )
        `)
        .eq('project_id', projectId)
        .in('user_id', memberIds)
        .lt('created_at', oldestMessageRef.current)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (messagesError) throw messagesError;

      const transformedMessages = (messages || []).map(message => ({
        ...message,
        userName: message.users?.name || 'Unknown User'
      })).reverse();

      setMessages(current => [...transformedMessages, ...current]);
      if (!messages || messages.length < PAGE_SIZE) setHasMore(false);
      if (transformedMessages.length > 0) {
        oldestMessageRef.current = transformedMessages[0].created_at;
      }
    } catch (error) {
      console.error('Error loading older messages:', error);
      toast.error('Failed to load older messages');
    } finally {
      setLoadingMore(false);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`chat-container ${showChat ? 'open' : ''}`}>
      <div className="chat-content" ref={chatContentRef}>
        <div className="chat-header">
          <h3>Chat</h3>
          <button className="close-btn" onClick={onClose}>
            <IoClose />
          </button>
        </div>

        <div className="messages-container">
          {loading ? (
            <div className="loading-messages">Loading messages...</div>
          ) : (
            <>
              {hasMore && !loadingMore && (
                <button className="load-more-btn" onClick={loadOlderMessages} disabled={loadingMore}>
                  Load older messages
                </button>
              )}
              {loadingMore && <div className="loading-messages">Loading older messages...</div>}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`message ${message.user_id === userId ? 'sent' : 'received'}`}
                  data-user-id={message.user_id === userId ? 'sent' : (parseInt(message.user_id.charAt(message.user_id.length - 1)) % 5 + 1)}
                >
                  {message.user_id !== userId && (
                    <div className="message-sender">
                      {message.userName}
                    </div>
                  )}
                  <div className="message-content">
                    <p>{message.content}</p>
                    <span className="message-time">
                      {formatTime(message.created_at)}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <form onSubmit={sendMessage} className="message-input-container">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="message-input"
            disabled={sendingMessage}
          />
          <button 
            type="submit" 
            className="send-button"
            disabled={!newMessage.trim() || sendingMessage}
          >
            <IoSend />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;