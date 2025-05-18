import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { FaBell } from 'react-icons/fa';

// Optional: For toast notifications
// npm install react-hot-toast
import { toast } from 'react-hot-toast';

const PAGE_SIZE = 10;

export default function NotificationsBell({ userId }) {
  const [notifications, setNotifications] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications with pagination
  const fetchNotifications = async (pageNum = 1, reset = false) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range((pageNum - 1) * PAGE_SIZE, pageNum * PAGE_SIZE - 1);

      if (error) throw error;
      setNotifications(prev => (reset ? data : [...prev, ...data]));
      setHasMore(data.length === PAGE_SIZE);
      setUnreadCount((reset ? data : [...prev, ...data]).filter(n => !n.is_read).length);
    } catch (err) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (userId) fetchNotifications(1, true);
    // eslint-disable-next-line
  }, [userId]);

  // Real-time subscription
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel('user_notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          setNotifications(prev => [payload.new, ...prev]);
          setUnreadCount(count => count + 1);
          toast.custom(
            <div style={{ background: '#fff', padding: 12, borderRadius: 8, boxShadow: '0 2px 8px #47e58422' }}>
              <b>{payload.new.title}</b>
              <div>{payload.new.message}</div>
            </div>,
            { duration: 4000 }
          );
          // Play sound (optional)
          if (localStorage.getItem('notificationSound') !== 'false') {
            const audio = new Audio('/notification.mp3');
            audio.play().catch(() => {});
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Mark all as read when modal opens
  const markAllAsRead = async () => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      toast.error('Failed to mark notifications as read');
    }
  };

  // Mark individual notification as read
  const markAsRead = async (id) => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
        .eq('user_id', userId);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(notifications.filter(n => !n.is_read && n.id !== id).length);
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  // Load more notifications
  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotifications(nextPage);
  };

  return (
    <>
      <button
        onClick={() => { setShowModal(true); markAllAsRead(); }}
        className="relative"
        style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative' }}
        title="Notifications"
      >
        <FaBell size={22} color="#47e584" />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4,
            background: '#ff6b6b', color: '#fff',
            borderRadius: '50%', fontSize: 11,
            padding: '2px 6px', fontWeight: 700
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {showModal && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000,
            display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', padding: 24
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: '#232323', borderRadius: 12, boxShadow: '0 4px 24px #0005',
              padding: 24, width: 360, maxHeight: '80vh', overflowY: 'auto', animation: 'fade-in 0.3s'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 style={{ color: '#47e584', fontSize: 20, fontWeight: 700 }}>Notifications</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#aaa', fontSize: 22, cursor: 'pointer' }}>×</button>
            </div>
            {notifications.length === 0 ? (
              <div style={{ color: '#aaa', textAlign: 'center', padding: 24 }}>No notifications yet.</div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {notifications.map(n => (
                  <li
                    key={n.id}
                    style={{
                      background: n.is_read ? '#232323' : '#2ecc71',
                      color: n.is_read ? '#fff' : '#181818',
                      borderRadius: 8, marginBottom: 10, padding: '10px 14px',
                      boxShadow: n.is_read ? 'none' : '0 2px 8px rgba(71,229,132,0.10)',
                      transition: 'background 0.22s, color 0.22s'
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: 2 }}>
                      {n.type === 'invite' ? 'Project Invite' : n.type === 'role_change' ? 'Role Changed' : n.title}
                    </div>
                    <div style={{ fontSize: 14 }}>{n.message || n.data?.message || ''}</div>
                    <div style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>{new Date(n.created_at).toLocaleString()}</div>
                    {!n.is_read && (
                      <button
                        onClick={() => markAsRead(n.id)}
                        style={{ marginTop: 6, fontSize: 13, color: '#3498DB', background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        Mark as Read
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {hasMore && (
              <button
                onClick={loadMore}
                style={{ marginTop: 12, color: '#47e584', background: 'none', border: 'none', fontWeight: 600, cursor: 'pointer' }}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}