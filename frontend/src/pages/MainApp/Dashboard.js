import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import './Dashboard.css';
import profileButton from '../../assets/user-profile.png';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import previousNotes from '../../assets/prev-notes.png';
import chatFeature from '../../assets/chat.png';
import aiFeature from '../../assets/ai.png';
import importFiles from '../../assets/import.png';
import newNote from '../../assets/addSign.png';
import { supabase } from '../../services/supabase';
import Spinner from '../../components/Spinner';
import FileCard from "../../components/FileCard";
import Modal from '../../components/Modal';
import FileUpload from '../../components/FileUpload';
import { Toaster, toast } from 'react-hot-toast';
import { Bell, Menu, Search, Plus, Bold, Italic, Heading1, Heading2, List, ListOrdered, Palette, Upload, MessageSquare, Bot, X, Edit3, Save, LogOut, Users, UserPlus, FolderPlus } from 'lucide-react';
import NotificationCard from '../../components/NotificationCard';
import { sendNotification } from '../../services/notificationService';
import WarqLogo from '../../components/WarqLogo';
import { createClient } from '@supabase/supabase-js';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Avatar } from '../../components/Avatar';
import { createGroup, inviteToGroup, getUserGroups, getGroupMembers } from '../../services/groupService';
import Chat from '../../components/Chat/Chat';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const sortNotesByDate = (notes) => {
  return [...notes].sort((a, b) => 
    new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at)
  );
};

const InviteModal = ({ isOpen, onClose, onInvite, email, setEmail }) => {
  if (!isOpen) return null;
  
  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h3>Invite Member</h3>
        <input
          type="email"
          placeholder="Enter email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="modal-input"
        />
        <div className="modal-actions">
          <button onClick={onClose} className="modal-button cancel">Cancel</button>
          <button onClick={onInvite} className="modal-button invite">Send Invite</button>
        </div>
      </div>
    </div>
  );
};

// Add this utility function at the top level
const serializeError = (error) => {
  if (!error) return 'No error object provided';
  
  // Handle non-object errors
  if (typeof error !== 'object') return String(error);

  // Create a safe copy of the error object
  const serialized = {
    name: error.name,
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
    stack: error.stack,
    statusCode: error.statusCode,
    status: error.status
  };

  // Add any additional properties
  Object.getOwnPropertyNames(error).forEach(prop => {
    if (!serialized[prop]) {
      try {
        serialized[prop] = JSON.stringify(error[prop]);
      } catch (e) {
        serialized[prop] = '[Circular or Non-Serializable]';
      }
    }
  });

  return JSON.stringify(serialized, null, 2);
};

// Add this component near the top with other modal components
const CreateGroupModal = ({ isOpen, onClose, onCreate }) => {
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    setIsLoading(true);
    try {
      await onCreate(groupName, description);
      setGroupName('');
      setDescription('');
      onClose();
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-content create-group-modal">
        <h3>Create New Group</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="groupName">Group Name</label>
            <input
              id="groupName"
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name"
              className="modal-input"
              maxLength={50}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="groupDescription">Description (Optional)</label>
            <textarea
              id="groupDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter group description"
              className="modal-input"
              rows={3}
              maxLength={200}
            />
          </div>
          <div className="modal-actions">
            <button 
              type="button" 
              onClick={onClose} 
              className="modal-button cancel"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="modal-button create"
              disabled={!groupName.trim() || isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Add this component near the top with other component definitions
const InvitationNotification = ({ notification, onAccept, onDecline }) => {
  const { group_title, invitation_token } = notification.data || {};
  
  return (
    <div className="invitation-notification">
      <p>{notification.message}</p>
      <div className="invitation-actions">
        <button onClick={() => onAccept(invitation_token)} className="accept-btn">
          Accept
        </button>
        <button onClick={() => onDecline(invitation_token)} className="decline-btn">
          Decline
        </button>
      </div>
    </div>
  );
};

function Dashboard() {
  const [selectedColor, setSelectedColor] = useState(null);
  const [showColors, setShowColors] = useState(false);
  const [content, setContent] = useState('');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const editorRef = useRef(null);
  const [notes, setNotes] = useState([]); // Ensure notes is always an array
  const [notesLoading, setNotesLoading] = useState(true);
  const [notesError, setNotesError] = useState(false); // <-- Add this line
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [error, setError] = useState('');
  const [projectName, setProjectName] = useState('');
  const [projectError, setProjectError] = useState('');
  const [fileUploadError, setFileUploadError] = useState('');
  const [user, setUser] = useState(null);
  const [quizNoteId, setQuizNoteId] = useState(null);
  const [quizQuestion, setQuizQuestion] = useState('');
  const [quizOptions, setQuizOptions] = useState(['', '', '', '']);
  const [quizAnswer, setQuizAnswer] = useState(0);
  const [quizError, setQuizError] = useState('');
  const [quizzes, setQuizzes] = useState([]);
  const [quizSubmission, setQuizSubmission] = useState({});
  const [quizResult, setQuizResult] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const profileRef = useRef(null);
  const [activeNote, setActiveNote] = useState(null);
  const saveTimeout = useRef(null);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [userRole, setUserRole] = useState('viewer'); // Add userRole state
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleModalProject, setRoleModalProject] = useState(null);
  const [roleModalUsers, setRoleModalUsers] = useState([]);
  const [roleModalLoading, setRoleModalLoading] = useState(false);
  const [roleModalError, setRoleModalError] = useState('');
  const [roleModalUserDetails, setRoleModalUserDetails] = useState({}); // Enhance: fetch user details for modal display
  const [roleModalFilter, setRoleModalFilter] = useState('');
  const [notesFilter, setNotesFilter] = useState('');
  const [files, setFiles] = useState([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [filesError, setFilesError] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [notificationTypeFilter, setNotificationTypeFilter] = useState('all');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth <= 768);
  const [welcomeShown, setWelcomeShown] = useState(false);
  const [isGroupMode, setIsGroupMode] = useState(false);
  const [groups, setGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const navigate = useNavigate();
  const [collaborators, setCollaborators] = useState({});
  const [userPresence, setUserPresence] = useState(null);
  const presenceChannel = useRef(null);
  const notesChannel = useRef(null);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchParams] = useSearchParams();

  const notificationTypes = [
    { value: 'all', label: 'All Notifications' },
    { value: 'role_change', label: 'Role Changes' },
    { value: 'membership_change', label: 'Membership Changes' },
    { value: 'file_upload', label: 'File Uploads' },
    { value: 'mention', label: 'Mentions' },
    { value: 'comment', label: 'Comments' },
    { value: 'quiz_assignment', label: 'Quiz Assignments' },
    { value: 'quiz_result', label: 'Quiz Results' },
    { value: 'announcement', label: 'Announcements' }
  ];

  const roleColors = {
    admin: '#47e584',
    editor: '#3498DB',
    commenter: '#F1C40F',
    viewer: '#aaa',
    restricted: '#ff6b6b'
  };

  // Add status constants at the top level of the component
  const PRESENCE_STATUS = {
    EDITING: 'typing',
    VIEWING: 'viewing',
    IDLE: 'idle'
  };

  // Add this helper function at the component level
  const getPresenceStatus = (isEditorFocused, isTyping) => {
    if (!isEditorFocused) return 'idle';
    return isTyping ? 'typing' : 'viewing';
  };

  const updatePresence = async (noteId, action = 'viewing') => {
    if (!user || !noteId) return;

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) return;

      // Ensure we're using one of the valid status values
      const validStatuses = ['viewing', 'typing', 'idle'];
      const status = validStatuses.includes(action) ? action : 'viewing';

      // First delete any existing presence for this user and note
      await supabase
        .from('note_presence')
        .delete()
        .match({ user_id: user.id, note_id: noteId });

      // Then insert new presence
      const presence = {
        user_id: user.id,
        note_id: noteId,
        project_id: isGroupMode ? selectedGroup : null,
        status,
        cursor_position: editor?.state?.selection ? {
          from: editor.state.selection.from,
          to: editor.state.selection.to
        } : null,
        last_active: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('note_presence')
        .insert(presence);

      if (error) {
        console.error('Error updating presence:', error);
        console.error('Failed presence data:', presence);
        return;
      }

      setUserPresence(presence);
    } catch (error) {
      console.error('Error updating presence:', error);
      // Don't show error to user as presence is not critical
    }
  };

  // Modify the editor configuration
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2]
        }
      }),
      Placeholder.configure({
        placeholder: 'Start writing your note here...',
      }),
      TextStyle,
      Color,
    ],
    content: noteContent,
    onUpdate: ({ editor }) => {
      try {
      const content = editor.getHTML();
        // Only update if content has actually changed
        if (content !== noteContent) {
      setNoteContent(content);
          
          // Update presence to show we're typing
          if (activeNote?.id) {
            updatePresence(activeNote.id, 'typing');
          }
      
      // Debounce real-time updates
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
      }
      saveTimeout.current = setTimeout(() => {
        saveCurrentNote();
      }, 1000);
        }
      } catch (err) {
        console.error('Error updating editor content:', err);
      }
    },
    onBlur: ({ editor }) => {
      if (activeNote?.id) {
        updatePresence(activeNote.id, 'idle');
      }
    },
    onFocus: ({ editor }) => {
      if (activeNote?.id) {
        updatePresence(activeNote.id, 'viewing');
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
      },
    },
  });

  // Sync editor content with activeNote
  useEffect(() => {
    if (editor && activeNote) {
      editor.commands.setContent(activeNote.content || '');
    }
    if (editor && !activeNote) {
      editor.commands.setContent('');
    }
  }, [activeNote, editor]);

  // Helper to apply editor commands and preserve selected color
  const applyCommandWithColorPreserved = (commandFn) => {
    if (!editor) return;
    commandFn(); // Run formatting command
    if (selectedColor) {
      editor.chain().focus().setColor(selectedColor).run(); // Reapply color
    }
  };

  const handleNameSave = async () => {
    setProfileError('');
    setProfileSuccess('');
    try {
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) throw new Error('No active session');

      // Update the user metadata
      const { data: authData, error: authError } = await supabase.auth.updateUser({
        data: { full_name: newName.trim() }
      });

      if (authError) throw authError;

      // Update the users table
      const { error: updateError } = await supabase
        .from('users')
        .update({ name: newName.trim() })
        .eq('id', session.user.id);

      if (updateError) throw updateError;

      // Update local user state
      setUser(prev => ({
        ...prev,
        name: newName.trim(),
        user_metadata: {
          ...prev.user_metadata,
          full_name: newName.trim()
        }
      }));

      setEditingName(false);
      toast.success('Name updated successfully!');
    } catch (err) {
      console.error('Error updating name:', err);
      toast.error('Failed to update name');
    }
  };

  const handleColorSelect = (color) => {
    if (!editor) return;
    const newColor = selectedColor === color ? null : color;
    setSelectedColor(newColor);
    editor.chain().focus().setColor(newColor).run();
    setShowColors(false);
  };

  const handleResetToDefault = () => {
    if (!editor) return;
    setSelectedColor(null);
    editor.chain().focus().setColor(null).run();
  };

  // Add this near other useMemo hooks
  const filteredNotes = useMemo(() => {
    let filtered = notes;
    
    // First filter by mode (personal vs group)
    if (isGroupMode) {
      // In group mode, only show notes from the selected group
      filtered = filtered.filter(note => note.project_id === selectedGroup);
      // If no group is selected, show no notes
      if (!selectedGroup) {
        filtered = [];
      }
    } else {
      // In personal mode, only show notes without a project_id (personal notes)
      filtered = filtered.filter(note => !note.project_id);
    }

    // Then apply search filter if exists
    if (notesFilter) {
      const searchTerm = notesFilter.toLowerCase();
      filtered = filtered.filter(note => 
        note.title?.toLowerCase().includes(searchTerm) ||
        note.content?.toLowerCase().includes(searchTerm)
      );
    }

    // Sort by last updated
    return sortNotesByDate(filtered);
  }, [notes, notesFilter, isGroupMode, selectedGroup]);

  // Update fetchNotes to handle personal notes only
  const fetchNotes = useCallback(async (showLoading = true) => {
    if (showLoading) setNotesLoading(true);
    setNotesError(false);
    try {
      // First verify we have a valid session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw new Error('Session verification failed');
      if (!session) throw new Error('No active session');

      // Fetch user's personal notes only (where project_id is null)
      const { data: notesArr, error: notesError } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', session.user.id)
        .is('project_id', null) // Only fetch notes without a project_id
        .order('updated_at', { ascending: false });

      if (notesError) {
        console.error("Notes fetch error:", notesError);
        throw new Error(notesError.message);
      }

      if (!notesArr) {
        console.warn("No notes returned from query");
        setNotes([]);
        return [];
      }

      console.log("Fetched personal notes:", notesArr);
      setNotes(notesArr);
      return notesArr;
    } catch (err) {
      console.error("Error fetching notes:", err);
      setNotesError(true);
      setError(err.message || 'Failed to load notes. Please try refreshing the page.');
      return [];
    } finally {
      setNotesLoading(false);
    }
  }, []);

  // Update fetchGroupNotes to handle group notes only
  const fetchGroupNotes = async (groupId) => {
    if (!groupId) return;
    
    setNotesLoading(true);
    setNotesError(false);
    try {
      const { data: groupNotes, error: notesError } = await supabase
        .from('notes')
        .select('*')
        .eq('project_id', groupId)
        .order('updated_at', { ascending: false });

      if (notesError) throw notesError;
      setNotes(groupNotes || []);
    } catch (err) {
      console.error('Error fetching group notes:', err);
      setNotesError(true);
      toast.error('Failed to load group notes');
    } finally {
      setNotesLoading(false);
    }
  };

  // Fetch files for the active note
  const fetchFiles = useCallback(async (noteId) => {
    if (!noteId) return;
    
    setFilesLoading(true);
    setFilesError('');
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('note_id', noteId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching files:', error);
        setFilesError('Failed to load files');
        setFiles([]);
        return;
      }

      setFiles(data || []);
    } catch (err) {
      console.error('Error fetching files:', err);
      setFilesError('Failed to load files');
      setFiles([]);
    } finally {
    setFilesLoading(false);
    }
  }, []);

  // Fetch notifications for the current user
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setNotifications(data || []);
    } catch (err) {
      // Optionally handle error
      setNotifications([]);
    }
  }, [user?.id]);

  // Mark all notifications as read
  const markAllNotificationsRead = useCallback(async () => {
    if (!user?.id) return;
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      fetchNotifications();
    } catch (err) {
      // Optionally handle error
    }
  }, [user?.id, fetchNotifications]);

  // Mark single notification as read/unread
  const markNotificationRead = async (id) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    fetchNotifications();
  };
  const markNotificationUnread = async (id) => {
    await supabase.from('notifications').update({ is_read: false }).eq('id', id);
    fetchNotifications();
  };

  // Real-time notifications
  useEffect(() => {
    if (!user?.id) return;
    fetchNotifications();
    const channel = supabase
      .channel('user_notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchNotifications]);

  // Fetch user data from Supabase
  const fetchUserData = async () => {
    try {
      // Check if we're authenticated with Supabase
      const { data: { session }, error: supabaseError } = await supabase.auth.getSession();
      if (supabaseError || !session) {
        console.error("Supabase auth error:", supabaseError);
        window.location.href = '/login';
        return;
      }
      // Get the user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();
      if (userError) throw userError;
      setUser(userData);
    } catch (e) {
      console.error("Auth verification error:", e);
      const { data: { session }, error: supabaseError } = await supabase.auth.getSession();
      if (supabaseError || !session) {
        console.error("Supabase auth error:", supabaseError);
        window.location.href = '/login';
      }
    } finally {
      setProfileLoading(false);
    }
  };

  // Add event listener to close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Add useEffect to fetch user data on mount
  useEffect(() => {
    fetchUserData();
  }, []);

  const handleInput = () => {
    if (editorRef.current) {
      setContent(editorRef.current.innerText);
    }
  };

  // Update handleCreateOrEditNote to show the note in the panel immediately after saving
  const handleCreateOrEditNote = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Check session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Authentication required. Please log in again.');
      }

      // Check for duplicate title
      const { data: existingNotes, error: titleCheckError } = await supabase
        .from('notes')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('title', noteTitle.trim())
        .neq('id', editingNoteId || ''); // Exclude current note if editing

      if (titleCheckError) throw titleCheckError;

      if (existingNotes?.length > 0) {
        throw new Error('A note with this title already exists. Please choose a different title.');
      }

      // Generate a unique file path for the note
      const timestamp = new Date().getTime();
      const safeTitleSlug = noteTitle.trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const uniquePath = `notes/${session.user.id}/${timestamp}-${safeTitleSlug}`;

      // Prepare note data
      const noteData = {
        title: noteTitle.trim(),
        content: noteContent,
        updated_at: new Date().toISOString(),
        user_id: session.user.id,
        file_path: uniquePath
      };

      // Add project_id only if we're in group mode and have a selected group
      if (isGroupMode && selectedGroup) {
        // Verify user has permission in the group
        const { data: membership, error: membershipError } = await supabase
          .from('project_members')
          .select('role')
          .eq('project_id', selectedGroup)
          .eq('user_id', session.user.id)
          .eq('status', 'accepted')
          .single();

        if (membershipError || !membership) {
          throw new Error('You do not have permission to create notes in this group.');
        }

        if (!['admin', 'editor'].includes(membership.role)) {
          throw new Error('You need editor or admin role to create/edit notes.');
        }

        noteData.project_id = selectedGroup;
        // Update file path for group notes
        noteData.file_path = `notes/groups/${selectedGroup}/${timestamp}-${safeTitleSlug}`;
      }

      // Perform the database operation
      let query;
      if (editingNoteId) {
        query = supabase
          .from('notes')
          .update(noteData)
          .eq('id', editingNoteId)
          .select()
          .single();
      } else {
        query = supabase
          .from('notes')
          .insert([{
            ...noteData,
            created_at: new Date().toISOString()
          }])
          .select()
          .single();
      }

      const { data: savedNote, error: noteError } = await query;

      if (noteError) {
        if (noteError.code === '42501') {
          throw new Error('You do not have permission to perform this action.');
        } else if (noteError.code === '42P17') {
          throw new Error('There was an issue with permissions. Please try again.');
        }
        throw noteError;
      }

      if (!savedNote) {
        throw new Error('Failed to save note. Please try again.');
      }

      // Update UI state
      setNotes(prev => {
        const updatedNotes = editingNoteId
          ? prev.map(note => note.id === editingNoteId ? savedNote : note)
          : [savedNote, ...prev];
        return sortNotesByDate(updatedNotes);
      });

      setEditingNoteId(savedNote.id);
      setActiveNote(savedNote);
      
      toast.success(`Note ${editingNoteId ? 'updated' : 'created'} successfully!`);

      // Handle group notifications
      if (isGroupMode && selectedGroup) {
        await handleGroupNotifications(savedNote, session.user, selectedGroup);
      }

    } catch (error) {
      console.error('Operation failed:', error);
      const errorMessage = error.message || 'Failed to save note. Please try again.';
      toast.error(errorMessage);
      setError(errorMessage);
    }
  };

  // Helper function for group notifications
  const handleGroupNotifications = async (noteData, user, groupId) => {
    console.log('Sending group notifications...');
    const { data: members, error: membersError } = await supabase
      .from('project_members')
      .select('user_id')
      .eq('project_id', groupId)
      .neq('user_id', user.id)
      .eq('status', 'accepted');

    if (membersError) {
      console.error('Failed to fetch group members:', membersError);
      return;
    }

    console.log(`Sending notifications to ${members?.length || 0} members`);

    if (members?.length) {
      await Promise.all(members.map(async (member) => {
        try {
          await sendNotification({
            user_id: member.user_id,
            type: 'note_created',
            title: 'New Note Created',
            message: `${user.email} created a new note: ${noteData.title}`,
            data: { note_id: noteData.id, project_id: groupId },
            severity: 'info'
          });
          console.log('Notification sent to:', member.user_id);
        } catch (notifyError) {
          console.error('Failed to notify user:', {
            userId: member.user_id,
            error: notifyError
          });
        }
      }));
    }
  };

  // Update saveCurrentNote function with better error handling
  const saveCurrentNote = async () => {
    if (!noteTitle?.trim() || !noteContent || noteContent === '<p></p>') {
      console.log('Note title or content is empty, not saving');
      return false;
    }     

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error("Session error:", serializeError(sessionError));
      return false;
    }    

      // Generate a unique file path for new notes
      let filePath;
      if (!activeNote?.id) {
        const timestamp = new Date().getTime();
        const safeTitleSlug = noteTitle.trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
        filePath = isGroupMode && selectedGroup
          ? `notes/groups/${selectedGroup}/${timestamp}-${safeTitleSlug}`
          : `notes/${session.user.id}/${timestamp}-${safeTitleSlug}`;
      }

      const noteData = {
        title: noteTitle.trim(),
        content: noteContent,
        updated_at: new Date().toISOString(),
        user_id: session.user.id,
        file_path: filePath || activeNote?.file_path
      };

      let query;
      if (activeNote?.id) {
        query = supabase
          .from('notes')
          .update(noteData)
          .eq('id', activeNote.id)
          .select()
          .single();
          } else {
        query = supabase
          .from('notes')
          .insert([{
            ...noteData,
            created_at: new Date().toISOString()
          }])
          .select()
          .single();
      }

      const { data: savedNote, error: noteError } = await query;
      
      if (noteError) {
        console.error("Auto-save error:", serializeError(noteError));
        return false;
      }

      if (!savedNote) {
        console.error("No data returned from auto-save");
        return false;
      }

      setNotes(prev => {
        const updatedNotes = activeNote?.id
          ? prev.map(note => note.id === activeNote.id ? savedNote : note)
          : [savedNote, ...prev];
          return sortNotesByDate(updatedNotes);
        });
        
      if (!activeNote?.id) {
        setActiveNote(savedNote);
        setEditingNoteId(savedNote.id);
      }
      
      return true;
    } catch (err) {
      console.error('Auto-save failed:', serializeError(err));
      return false;
    }   
  };

  // Update handleNewNote to be simpler
  const handleNewNote = async () => {
    try {
      // Try to save current note if we have content
      if (noteTitle.trim() && noteContent && noteContent !== '<p></p>') {
        await saveCurrentNote();
      }   
      // Reset states for new note
      setActiveNote(null);
      setEditingNoteId(null);
      setNoteTitle('');
      setNoteContent('');
      setError('');
      toast.success('Started new note');
    } catch (error) {
      console.error("Error creating new note:", error);
      toast.error('Failed to create new note');
    }
  };

  const handleEdit = async (note) => {
    // Auto-save current note if we have one
    try {
      if (activeNote && activeNote.id !== note.id) {
        await saveCurrentNote();
      } 
      // Set up for editing the selected note
      setEditingNoteId(note.id);
      setActiveNote(note);
      setNoteTitle(note.title || '');
      setNoteContent(note.content || '');
      
      // Fetch files for the selected note
      await fetchFiles(note.id);
    } catch (error) {
      console.error("Error switching notes:", error);
      toast.error('Failed to load note files');
    }
  };

  const handleDelete = async (noteId) => {
    if (!window.confirm("Are you sure you want to delete this note?")) {
      return;
    }
    try {
      await supabase
        .from('notes')
        .delete()
        .eq('id', noteId);
      setNotes(notes.filter(n => n._id !== noteId));
      if (activeNote && activeNote._id === noteId) handleNewNote();
      toast.success('Note deleted successfully');
    } catch (err) {
      console.error("Delete error:", err);
      toast.error('Failed to delete note');
    }
  };

  const handleMarkCompleted = async (noteId) => {
    try {
      await markNoteCompleted({ noteId });
    } catch (err) {
      console.error("Error marking note as completed:", err);
      setError('Failed to mark note as completed.');
    }
  };

  const handleProjectCreate = async (e) => {
    e.preventDefault();
    setProjectError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = '/login';
        return;
      }

      // First create the project
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .insert([{
          title: projectName,
          created_by: session.user.id
        }])
        .select();

      if (projectError) throw projectError;

      // Then add the creator as an admin member
      const { error: memberError } = await supabase
        .from('project_members')
        .insert([{
          project_id: projectData[0].id,
          user_id: session.user.id,
          role: 'admin',
          status: 'accepted',
          joined_at: new Date().toISOString()
        }]);

      if (memberError) throw memberError;
      
      setProjects([...projects, projectData[0]]);
      setProjectName('');
    } catch (err) {
      console.error("Project creation error:", err);
      setProjectError('Failed to create project.');
    }
  };

  const handleJoinProject = async (projectId) => {
    setProjectError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = '/login';
        return;
      }

      // Check if user is already a member
      const { data: existingMember, error: memberCheckError } = await supabase
        .from('project_members')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', session.user.id)
        .single();

      if (memberCheckError && memberCheckError.code !== 'PGRST116') throw memberCheckError;

      if (existingMember) {
        setProjectError('You are already a member of this project.');
        return;
      }

      // Add user as a viewer member
      const { error: joinError } = await supabase
        .from('project_members')
        .insert([{
          project_id: projectId,
          user_id: session.user.id,
          role: 'viewer',
          status: 'accepted',
          joined_at: new Date().toISOString()
        }]);

      if (joinError) throw joinError;
      
      // Refresh projects list
      fetchProjects();
      setProjectError('Successfully joined project!');
    } catch (err) {
      console.error("Join project error:", err);
      setProjectError('Failed to join project.');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !activeNote?.id) {
      toast.error('Please select a file and ensure a note is active');
      return;
    }

    try {
      setFilesLoading(true);
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Authentication required');
      }

      // Generate a unique file path
      const timestamp = new Date().getTime();
      const fileExt = file.name.split('.').pop();
      const safeFileName = `${timestamp}-${file.name.split('.')[0].replace(/[^a-z0-9]/gi, '-').toLowerCase()}.${fileExt}`;
      
      // Create a more organized path structure
      const filePath = isGroupMode && selectedGroup
        ? `groups/${selectedGroup}/notes/${activeNote.id}/${safeFileName}`
        : `users/${session.user.id}/notes/${activeNote.id}/${safeFileName}`;

      // Check if file with same name exists
      const { data: existingFiles, error: listError } = await supabase.storage
        .from('uploads')
        .list(filePath.split('/').slice(0, -1).join('/'));

      if (listError) throw listError;

      if (existingFiles?.some(f => f.name === safeFileName)) {
        throw new Error('A file with this name already exists');
      }

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Get the public URL
      const { data: { publicUrl }, error: urlError } = await supabase.storage
        .from('uploads')
        .getPublicUrl(filePath);

      if (urlError) throw urlError;

      // Create file record in the database
      const { error: dbError } = await supabase
        .from('files')
        .insert([{
          note_id: activeNote.id,
          user_id: session.user.id,
          project_id: isGroupMode ? selectedGroup : null,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          file_path: filePath,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (dbError) {
        console.error('Database error:', dbError);
        // If the database insert fails, try to clean up the uploaded file
        await supabase.storage
          .from('uploads')
          .remove([filePath])
          .catch(err => console.error('Failed to clean up uploaded file:', err));
        throw dbError;
      }

      // Refresh files list
      await fetchFiles(activeNote.id);
      toast.success('File uploaded successfully');

      // Send notification for group notes
      if (isGroupMode && selectedGroup) {
        const { data: members } = await supabase
          .from('project_members')
          .select('user_id')
          .eq('project_id', selectedGroup)
          .neq('user_id', session.user.id);

        if (members?.length) {
          await Promise.all(members.map(member => 
            sendNotification({
              user_id: member.user_id,
              type: 'file_upload',
              title: 'New File Uploaded',
              message: `${session.user.email} uploaded ${file.name} to note "${activeNote.title}"`,
              data: { note_id: activeNote.id, project_id: selectedGroup },
              severity: 'info'
            })
          ));
        }
      }
    } catch (err) {
      console.error('File upload error:', err);
      toast.error(err.message || 'Failed to upload file');
    } finally {
      setFilesLoading(false);
      // Reset the file input
      e.target.value = '';
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('token');
      window.location.href = '/login';
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleQuizCreate = async (e) => {
    e.preventDefault();
    setQuizError('');
    try {
      const res = await createQuiz({ noteId: quizNoteId, question: quizQuestion, options: quizOptions, answer: quizAnswer });
      
      // Get note information to create meaningful notifications
      const { data: noteData } = await supabase
        .from('notes')
        .select('title, projectId, project:projects(title, members)')
        .eq('id', quizNoteId)
        .single();
        
      if (noteData?.project) {
        // Get current user details
        const { data: { session } } = await supabase.auth.getSession();
        const { data: userData } = await supabase
          .from('users')
          .select('name')
          .eq('id', session.user.id)
          .single();
        
        const creatorName = userData?.name || 'A team member';
        
        // Send quiz assignment notifications to all project members except creator
        for (const memberId of noteData.project.members) {
          if (memberId !== session.user.id) {
            await sendNotification({
              userId: memberId,
              type: 'quiz_assignment',
              message: `${creatorName} created a new quiz for note "${noteData.title}" in project "${noteData.project.title}".`,
              projectId: noteData.projectId,
              severity: 'info'
            });
          }
        }
      }
      
      setQuizNoteId(null); 
      setQuizQuestion(''); 
      setQuizOptions(['', '', '', '']); 
      setQuizAnswer(0);
    } catch (err) {
      console.error("Quiz creation error:", err);
      setQuizError('Failed to create quiz.');
    }
  };

  const handleShowQuizzes = async (noteId) => {
    setQuizNoteId(noteId);
    try {
      const res = await getQuizzesForNote(noteId);
      setQuizzes(res.data || []);
    } catch (err) {
      console.error("Quiz fetch error:", err);
      setQuizzes([]);
    }
  };

  const handleQuizOptionChange = (idx, value) => {
    setQuizOptions(quizOptions.map((opt, i) => i === idx ? value : opt));
  };

  const handleQuizSubmit = async (quizId, selected) => {
    try {
      const res = await submitQuiz({ quizId, selected });
      setQuizResult(res.data?.result || 'Submitted!');
      
      // Get quiz and note information
      const { data: quizData } = await supabase
        .from('quizzes')
        .select('note_id, created_by, title')
        .eq('id', quizId)
        .single();
        
      if (quizData) {
        // Get note information
        const { data: noteData } = await supabase
          .from('notes')
          .select('title, projectId, project:projects(title)')
          .eq('id', quizData.note_id)
          .single();
          
        // Get current user details
        const { data: { session } } = await supabase.auth.getSession();
        const { data: userData } = await supabase
          .from('users')
          .select('name')
          .eq('id', session.user.id)
          .single();
          
        const submitterName = userData?.name || 'A team member';
        
        // Send notification to quiz creator
        if (quizData.created_by && quizData.created_by !== session.user.id) {
          await sendNotification({
            userId: quizData.created_by,
            type: 'quiz_result',
            message: `${submitterName} has submitted an answer to your quiz "${quizData.title}" in note "${noteData.title}".`,
            projectId: noteData.projectId,
            severity: 'info'
          });
        }
      }
    } catch (err) {
      console.error("Quiz submission error:", err);
      setQuizResult('Submission failed.');
    }
  };

  const colors = [
    '#FF5733', '#47e584', '#3357FF', '#F1C40F',
    '#9B59B6', '#E74C3C', '#1ABC9C', '#F39C12',
    '#3498DB', '#2ECC71', '#E67E22', '#9B59B6',
    '#F39C12', '#8E44AD', '#16A085', '#D35400'
  ];

  const renderToolbar = () => {
    if (!editor) return null;
    
    const tools = [
      { icon: <Bold size={16} strokeWidth={2.5} />, action: () => editor.chain().focus().toggleBold().run(), isActive: editor.isActive('bold'), label: 'Bold' },
      { icon: <Italic size={16} strokeWidth={2.5} />, action: () => editor.chain().focus().toggleItalic().run(), isActive: editor.isActive('italic'), label: 'Italic' },
      { icon: <Heading1 size={16} strokeWidth={2.5} />, action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), isActive: editor.isActive('heading', { level: 1 }), label: 'H1' },
      { icon: <Heading2 size={16} strokeWidth={2.5} />, action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), isActive: editor.isActive('heading', { level: 2 }), label: 'H2' },
      { icon: <ListOrdered size={16} strokeWidth={2.5} />, action: () => editor.chain().focus().toggleOrderedList().run(), isActive: editor.isActive('orderedList'), label: 'Numbered List' },
      { icon: <List size={16} strokeWidth={2.5} />, action: () => editor.chain().focus().toggleBulletList().run(), isActive: editor.isActive('bulletList'), label: 'Bullet List' },
    ];

    return (
      <div className="editor-toolbar">
        {tools.map((tool, index) => (
        <button
            key={index}
            onClick={tool.action}
            className={`toolbar-button ${tool.isActive ? 'active' : ''}`}
            title={tool.label}
          >
            {tool.icon}
        </button>
        ))}
        <div className="color-dropdown-container">
        <button
            onClick={() => setShowColors(!showColors)}
            className={`toolbar-button ${selectedColor ? 'active' : ''}`}
            title="Text Color"
          >
            <Palette size={18} />
          </button>
          {showColors && (
            <div className="color-dropdown">
              {colors.map((color, idx) => (
                <button
                  key={idx}
                  className="color-swatch"
                  style={{
                    backgroundColor: color,
                    border: selectedColor === color ? '2px solid white' : '1px solid rgba(255,255,255,0.1)',
                  }}
                  onClick={() => handleColorSelect(color)}
                  title={color}
                />
              ))}
              <button 
                className="toolbar-button reset-default-btn"
                onClick={handleResetToDefault}
              >
                Reset Color
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Update fetchUserRole to use Supabase
  const fetchUserRole = useCallback(async (projectId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setUserRole('viewer');
        return;
      }

      const { data: member, error } = await supabase
        .from('project_members')
        .select('role')
        .eq('project_id', projectId)
        .eq('user_id', session.user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          setUserRole('viewer');
      } else {
          throw error;
      }
        return;
      }

      setUserRole(member.role);
    } catch (err) {
      console.error("Error fetching user role:", err);
      setUserRole('viewer');
    }
  }, []);

  // When activeNote changes, fetch userRole if it's a collab note
  useEffect(() => {
    if (activeNote && activeNote.projectId) {
      fetchUserRole(activeNote.projectId);
    } else if (activeNote) {
      setUserRole('admin'); // Personal notes: owner is admin
    }
  }, [activeNote, fetchUserRole]);

  // Update openRoleModal to use Supabase
  const openRoleModal = async (project) => {
    setRoleModalProject(project);
    setRoleModalLoading(true);
    setShowRoleModal(true);
    try {
      // Fetch project members and their roles
      const { data: members, error: membersError } = await supabase
        .from('project_members')
        .select(`
          user_id,
          role,
          restricted_until,
          users:user_id (
            id,
            name,
            email
          )
        `)
        .eq('project_id', project.id);

      if (membersError) throw membersError;

      // Transform the data into the expected format
      setRoleModalUsers(members.map(member => ({
        userId: member.user_id,
        role: member.role,
        restrictedUntil: member.restricted_until
      })));

      const userDetailsMap = {};
      members.forEach(member => {
        userDetailsMap[member.user_id] = member.users;
      });
      setRoleModalUserDetails(userDetailsMap);
    } catch (err) {
      console.error("Error loading project members:", err);
      setRoleModalError('Failed to load project members.');
    }
    setRoleModalLoading(false);
  };

  // Update handleRoleChange to use Supabase
  const handleRoleChange = async (userId, newRole, restrictedUntil) => {
    setRoleModalLoading(true);
    setRoleModalError('');
    try {
      const { error: updateError } = await supabase
        .from('project_members')
        .update({
          role: newRole,
          restricted_until: restrictedUntil
        })
        .eq('project_id', roleModalProject.id)
        .eq('user_id', userId);

      if (updateError) throw updateError;

      // Update local state
      setRoleModalUsers(prev => 
        prev.map(user => 
          user.userId === userId 
            ? { ...user, role: newRole, restrictedUntil } 
            : user
        )
      );

      // Send notification about role change
      const { data: userData } = await supabase
        .from('users')
        .select('name')
        .eq('id', userId)
        .single();

      await sendNotification({
        type: 'role_change',
        user_id: userId,
        title: 'Role Updated',
        message: `Your role in project "${roleModalProject.title}" has been updated to ${newRole}`,
        metadata: {
          projectId: roleModalProject.id,
          projectTitle: roleModalProject.title,
          newRole
        }
      });

    } catch (err) {
      console.error("Error updating role:", err);
      setRoleModalError('Failed to update role.');
    }
    setRoleModalLoading(false);
  };

  // Update handleRemoveUser to use Supabase
  const handleRemoveUser = async (userId) => {
    setRoleModalLoading(true);
    setRoleModalError('');
    try {
      const { error: deleteError } = await supabase
        .from('project_members')
        .delete()
        .eq('project_id', roleModalProject.id)
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      // Update local state
      setRoleModalUsers(prev => prev.filter(user => user.userId !== userId));

      // Send notification about removal
      const { data: userData } = await supabase
        .from('users')
        .select('name')
        .eq('id', userId)
        .single();

      await sendNotification({
        type: 'membership_change',
        user_id: userId,
        title: 'Removed from Project',
        message: `You have been removed from project "${roleModalProject.title}"`,
        metadata: {
        projectId: roleModalProject.id,
          projectTitle: roleModalProject.title
        }
      });

    } catch (err) {
      console.error("Error removing user:", err);
      setRoleModalError('Failed to remove user.');
    }
    setRoleModalLoading(false);
  };

  // Remove setSelectedColor from renderToolbar and sync with editor events
  useEffect(() => {
    if (!editor) return;
    const updateColor = () => {
      const currentColor = editor.getAttributes('textStyle').color || null;
      setSelectedColor(currentColor);
    };
    editor.on('selectionUpdate', updateColor);
    editor.on('transaction', updateColor);
    // Clean up
    return () => {
      editor.off('selectionUpdate', updateColor);
      editor.off('transaction', updateColor);
    };
  }, [editor]);

  // Add missing handleNameEdit function
  const handleNameEdit = () => {
    console.log('Edit button clicked'); // Add debug log
    setEditingName(true);
    setNewName(user?.name || user?.user_metadata?.full_name || '');
  };

  // Add resize listener
  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-save functionality
  useEffect(() => {
    if (activeNote && noteTitle.trim() && noteContent && noteContent !== '<p></p>') {
      const timeoutId = setTimeout(() => {
        saveCurrentNote();
      }, 2000); // Auto-save after 2 seconds of no typing
      return () => clearTimeout(timeoutId);
    }
  }, [noteTitle, noteContent]);

  // Helper to determine if current note is group/collab
  const isGroupNote = !!activeNote?.project_id;

  // Add notification for user login
  useEffect(() => {
    const checkAndNotifyLogin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && !welcomeShown) {
        toast.success('Welcome back!');
        setWelcomeShown(true);
      }
    };
    checkAndNotifyLogin();
  }, [welcomeShown]);

  // Add notification for user logout
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        toast.info('Successfully logged out');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Update handleModeSwitch to properly handle note switching
  const handleModeSwitch = async () => {
    try {
      const newMode = !isGroupMode;
      setIsGroupMode(newMode);
      
      // Reset states first
      setNotes([]);
      setActiveNote(null);
      setEditingNoteId(null);
      setNoteTitle('');
      setNoteContent('');
      setSelectedGroup(null);
      
      if (newMode) {
        // Switching to group mode
        setGroupsLoading(true);
        try {
          await fetchGroups();
        } catch (err) {
          console.error('Error fetching groups:', err);
          toast.error('Failed to load groups');
        } finally {
          setGroupsLoading(false);
        }
      } else {
        // Switching to personal mode
        try {
          await fetchNotes();
        } catch (err) {
          console.error('Error fetching notes:', err);
          toast.error('Failed to load notes');
        }
      }

      toast.success(`Switched to ${newMode ? 'Group' : 'Personal'} Notes`, {
        duration: 2000,
        style: {
          background: 'var(--background-lighter)',
          border: '1px solid var(--primary-color)',
          borderRadius: '6px',
          color: 'var(--text-primary)',
        }
      });
    } catch (err) {
      console.error('Error switching modes:', err);
      toast.error('Failed to switch modes');
    }
  };

  const fetchGroups = async () => {
    try {
      setGroupsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const { data: userGroups, error } = await supabase
        .from('project_members')
        .select(`
          project:project_id (
            id,
            title,
            description,
            created_at
          )
        `)
        .eq('user_id', session.user.id)
        .eq('status', 'accepted');

      if (error) throw error;

      // Transform the data to match the expected format
      const transformedGroups = userGroups
        .map(item => item.project)
        .filter(group => group !== null); // Filter out any null values

      setGroups(transformedGroups);
    } catch (err) {
      console.error('Error fetching groups:', err);
      toast.error('Failed to load groups');
      setGroups([]); // Set empty array on error
    } finally {
      setGroupsLoading(false);
    }
  };

  const createNewGroup = async (name, description = '') => {
    try {
      const loadingToast = toast.loading('Creating group...');
      const group = await createGroup(name.trim(), description.trim());
      
      // Update groups list and select the new group
      await fetchGroups();
      setSelectedGroup(group.id);
      setIsGroupMode(true);

      toast.dismiss(loadingToast);
      toast.success('New group created!');
    } catch (err) {
      console.error('Error creating group:', err);
      toast.error(err.message || 'Failed to create group');
    }
  };

  // Add this effect near other useEffects to handle invitation notifications
  useEffect(() => {
    if (!user?.id) return;

    // Subscribe to invitation notifications
    const channel = supabase
      .channel('invitation_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'projects_invitations',
          filter: `invited_email=eq.${user.email}`
        },
        (payload) => {
          console.log('New invitation received:', payload);
          toast.success('You have received a new group invitation!', {
            duration: 5000,
            action: {
              label: 'View',
              onClick: () => setShowNotificationsModal(true)
            }
          });
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, user?.email]);

  // Update the inviteMember function
  const inviteMember = async () => {
    if (!inviteEmail || !selectedGroup) {
      toast.error('Please provide an email address');
        return;
      }

    try {
      const loadingToast = toast.loading('Sending invitation...');
      
      const { invitation, reused } = await inviteToGroup(selectedGroup, inviteEmail);
      
      toast.dismiss(loadingToast);
      if (reused) {
        toast.success('Invitation already sent to this email');
      } else {
        toast.success('Invitation sent successfully!');
      }
      
      setShowInviteModal(false);
      setInviteEmail('');

      // Send notification about the invitation
      if (!reused && user) {
        try {
          const { data: groupData } = await supabase
            .from('projects')
            .select('title')
            .eq('id', selectedGroup)
            .single();

          await sendNotification({
            type: 'group_invitation',
            user_id: user.id,
            title: 'New Group Invitation',
            message: `You invited ${inviteEmail} to join "${groupData?.title || 'group'}"`,
            metadata: {
              groupId: selectedGroup,
              groupTitle: groupData?.title
            }
          });
        } catch (notifyError) {
          console.error('Error sending notification:', notifyError);
        }
      }
    } catch (err) {
      console.error('Error inviting member:', err);
      toast.error(err.message || 'Failed to send invitation');
    }
  };

  // Add useEffect for fetching groups when group mode is enabled
  useEffect(() => {
    if (isGroupMode && user) {
      fetchGroups();
    }
  }, [isGroupMode, user]);

  // Add this function to handle group selection
  const handleGroupSelect = async (groupId) => {
    try {
    setSelectedGroup(groupId);
      await fetchGroupNotes(groupId);

      // Set up real-time subscription for this group's notes
      if (notesChannel.current) {
        notesChannel.current.unsubscribe();
      }

      notesChannel.current = supabase
        .channel(`group-notes:${groupId}`)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'notes',
            filter: `project_id=eq.${groupId}`
          },
          async (payload) => {
            if (payload.new.user_id !== user.id) {
              await fetchGroupNotes(groupId);
              
              // Show notification for changes
              const action = payload.eventType === 'INSERT' ? 'created' : 'updated';
              toast.info(`Note "${payload.new.title}" was ${action} by another user`);
            }
          }
        )
        .subscribe();

    } catch (err) {
      console.error('Error selecting group:', err);
      toast.error('Failed to load group notes');
    }
  };

  // Add this effect to handle group parameter in URL
  useEffect(() => {
    const handleInitialGroupRedirect = async () => {
      const groupId = searchParams.get('group');
      if (groupId) {
        setIsGroupMode(true);
        setSelectedGroup(groupId);
        await fetchGroups();
        await handleGroupSelect(groupId);
        // Remove the group parameter from URL
        searchParams.delete('group');
        navigate(location.pathname, { replace: true });
      }
    };

    handleInitialGroupRedirect();
  }, [searchParams]);

  // Update the presence effect to include more user details
  useEffect(() => {
    if (!activeNote?.id || !user) return;

    // Set up presence channel
    presenceChannel.current = supabase
      .channel(`presence:${activeNote.id}`)
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.current.presenceState();
        setCollaborators(state);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        toast.success(`${newPresences[0].user_name || 'A user'} joined the note`, {
          duration: 2000,
        });
        setCollaborators(prev => ({
          ...prev,
          [key]: newPresences[0]
        }));
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setCollaborators(prev => {
          const newState = { ...prev };
          delete newState[key];
          return newState;
        });
      })
      .subscribe(async (status) => {
        if (status !== 'SUBSCRIBED') return;

        // Track user presence with more details
        await presenceChannel.current.track({
          user_id: user.id,
          user_name: user.name || user.email,
          user_email: user.email,
          note_id: activeNote.id,
          status: 'online',
          last_seen: new Date().toISOString(),
          action: editor?.isFocused ? 'editing' : 'viewing'
        });
      });

    // Update presence status when editor focus changes
    const updatePresenceStatus = () => {
      if (!presenceChannel.current) return;
      
      presenceChannel.current.track({
        user_id: user.id,
        user_name: user.name || user.email,
        user_email: user.email,
        note_id: activeNote.id,
        status: 'online',
        last_seen: new Date().toISOString(),
        action: editor?.isFocused ? 'editing' : 'viewing'
      });
    };

    if (editor) {
      editor.on('focus', updatePresenceStatus);
      editor.on('blur', updatePresenceStatus);
    }

    // Cleanup
    return () => {
      if (editor) {
        editor.off('focus', updatePresenceStatus);
        editor.off('blur', updatePresenceStatus);
      }
      if (presenceChannel.current) {
        presenceChannel.current.unsubscribe();
      }
    };
  }, [activeNote?.id, user, editor]);

  // Add this to render collaborators with better styling
  const renderCollaborators = () => {
    if (!activeNote) return null;

    return (
      <div className="collaborators-bar">
        <div className="collaborators-list">
          {Object.values(collaborators).map((collaborator, index) => (
            <div 
              key={collaborator.user_id} 
              className={`collaborator-item ${collaborator.action}`}
              title={`${collaborator.user_name} is ${collaborator.action}`}
            >
              <div className="collaborator-avatar">
                {collaborator.user_name?.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="collaborator-info">
                <span className="collaborator-name">{collaborator.user_name}</span>
                <span className="collaborator-status">{collaborator.action}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Add this CSS
  const collaboratorStyles = `
    .collaborators-bar {
      background: var(--background-lighter);
      border-bottom: 1px solid var(--border-color);
      padding: 8px 16px;
      margin-bottom: 8px;
    }

    .collaborators-list {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .collaborator-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 8px;
      border-radius: 20px;
      background: var(--background-dark);
      border: 1px solid var(--border-color);
      transition: all 0.2s ease;
    }

    .collaborator-item.editing {
      border-color: #47e584;
    }

    .collaborator-item.viewing {
      border-color: #3498db;
    }

    .collaborator-avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--primary-color);
      color: var(--background-dark);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 14px;
    }

    .collaborator-info {
      display: flex;
      flex-direction: column;
    }

    .collaborator-name {
      font-size: 12px;
      font-weight: 500;
      color: var(--text-primary);
    }

    .collaborator-status {
      font-size: 10px;
      color: var(--text-secondary);
    }
  `;

  // Add useEffect for fetching notes
  useEffect(() => {
    if (user) {
      if (isGroupMode && selectedGroup) {
        fetchGroupNotes(selectedGroup);
      } else {
        fetchNotes();
      }
    }
  }, [user, isGroupMode, selectedGroup]);

  // Add hidden file input
  const fileInputRef = useRef(null);

  // Function to trigger file input click
  const triggerFileUpload = () => {
    if (!activeNote) {
      toast.error('Please select or create a note first');
      return;
    }
    fileInputRef.current?.click();
  };

  // Add this near your JSX where you want the file input
  const renderFileInput = () => (
    <input
      ref={fileInputRef}
      type="file"
      onChange={handleFileUpload}
      style={{ display: 'none' }}
      accept="*/*"
    />
  );

  const renderGroupsList = () => (
    <div className="groups-list">
      <div className="groups-section-header">
        <div className="section-title-row">
          <h3>Your Groups</h3>
          <button 
            onClick={() => setShowCreateGroupModal(true)} 
            className="new-group-button"
            title="Create New Group"
          >
            <FolderPlus size={16} />
            <span>New Group</span>
          </button>
        </div>
        <div className="search-container">
          <Search className="search-icon" size={16} strokeWidth={2} />
          <input
            type="text"
            className="groups-search-input"
            placeholder="Search groups..."
            value={notesFilter}
            onChange={e => setNotesFilter(e.target.value)}
          />
        </div>
      </div>
      
      {groupsLoading ? (
        <div className="groups-loading">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="group-item loading-skeleton" />
          ))}
        </div>
      ) : groups && groups.length > 0 ? (
        groups.map(group => group && (
          <div
            key={group.id}
            className={`group-item${selectedGroup === group.id ? ' active' : ''}`}
            onClick={() => group.id && handleGroupSelect(group.id)}
          >
            <div className="group-info">
              <h4>{group.title || 'Untitled Group'}</h4>
              {group.description && (
                <p className="group-description">{group.description}</p>
              )}
              <div className="group-meta">
                <span>Created {group.created_at ? new Date(group.created_at).toLocaleDateString() : 'Unknown date'}</span>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (group.id) {
                  setSelectedGroup(group.id);
                  setShowInviteModal(true);
                }
              }}
              className="group-invite-btn"
              title="Invite Members"
            >
              <UserPlus size={14} />
            </button>
          </div>
        ))
      ) : null}
      
      {groups.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">
            <Users size={20} />
          </div>
          <p>No groups yet</p>
          <button 
            onClick={() => setShowCreateGroupModal(true)} 
            className="new-group-btn"
          >
            <FolderPlus size={14} />
            Create your first group
          </button>
        </div>
      )}
    </div>
  );

  const createNewNote = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const newNote = {
        title: 'Untitled Note',
        content: '',
        user_id: user.id,
        project_id: isGroupMode ? selectedGroup : null, // Set project_id only for group notes
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('notes')
        .insert([newNote])
        .select()
        .single();

      if (error) throw error;

      // Add new note to state
      setNotes(prev => [data, ...prev]);
      setSelectedNote(data);
      
      // Log creation context
      console.log('Created new note:', {
        isGroupNote: isGroupMode,
        groupId: selectedGroup,
        noteId: data.id
      });

    } catch (error) {
      console.error('Error creating note:', error);
      toast.error('Failed to create note');
    }
  };

  // Add this near other button handlers
  const handleChatToggle = () => {
    if (isGroupMode && selectedGroup) {
      setShowChat(!showChat);
    }
  };

  // Add this function for enhanced search
  const handleSearch = async (searchTerm) => {
    setNotesFilter(searchTerm);
    setIsSearching(true);

    try {
      if (!searchTerm.trim()) {
        setSearchResults([]);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const query = supabase
        .from('notes')
        .select('*')
        .or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`)
        .eq('user_id', session.user.id);

      if (isGroupMode && selectedGroup) {
        query.eq('project_id', selectedGroup);
      } else {
        query.is('project_id', null);
      }

      const { data, error } = await query;
      if (error) throw error;

      setSearchResults(data || []);
    } catch (err) {
      console.error('Search error:', err);
      toast.error('Failed to search notes');
    } finally {
      setIsSearching(false);
    }
  };

  // Add this function to handle invitation acceptance
  const handleAcceptInvitation = async (token) => {
    try {
      const loadingToast = toast.loading('Accepting invitation...');
      
      const { data: inviteData, error: acceptError } = await supabase.functions.invoke('accept-invitation', {
        body: JSON.stringify({ token })
      });

      if (acceptError) throw acceptError;
      
      if (!inviteData?.groupId) {
        throw new Error('No group ID received after accepting invitation');
      }

      // Update notifications list
      setNotifications(prev => prev.filter(n => 
        !(n.type === 'group_invitation' && n.data?.invitation_token === token)
      ));

      // Refresh groups list
      await fetchGroups();

      // Switch to the new group
      setSelectedGroup(inviteData.groupId);
      setIsGroupMode(true);

      toast.dismiss(loadingToast);
      toast.success('Successfully joined the group!');
      setShowNotificationsModal(false);

    } catch (err) {
      console.error('Error accepting invitation:', err);
      toast.error(err.message || 'Failed to accept invitation');
    }
  };

  // Add this function to handle invitation decline
  const handleDeclineInvitation = async (token) => {
    try {
      const { error } = await supabase
        .from('projects_invitations')
        .update({ status: 'declined' })
        .eq('invitation_token', token);

      if (error) throw error;

      // Update notifications list
      setNotifications(prev => prev.filter(n => 
        !(n.type === 'group_invitation' && n.data?.invitation_token === token)
      ));

      toast.success('Invitation declined');
      setShowNotificationsModal(false);

    } catch (err) {
      console.error('Error declining invitation:', err);
      toast.error(err.message || 'Failed to decline invitation');
    }
  };

  // Add this effect to fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user?.id) return;

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
        return;
      }

      setNotifications(data || []);
    };

    fetchNotifications();

    // Subscribe to new notifications
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user?.id}`
        },
        (payload) => {
          setNotifications(prev => [payload.new, ...prev]);
          
          if (payload.new.type === 'group_invitation') {
            toast.success('You have received a new group invitation!', {
              duration: 5000,
              action: {
                label: 'View',
                onClick: () => setShowNotificationsModal(true)
              }
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Add these styles near the other style tags
  const profileStyles = `
    .edit-name-form {
      display: flex;
      gap: 8px;
      align-items: center;
      width: 100%;
    }

    .edit-name-input {
      flex: 1;
      padding: 6px 10px;
      border-radius: 4px;
      border: 1px solid var(--border-color);
      background: var(--background-dark);
      color: var(--text-primary);
      font-size: 14px;
    }

    .edit-name-input:focus {
      outline: none;
      border-color: var(--primary-color);
    }

    .save-name-btn {
      padding: 6px 12px;
      border-radius: 4px;
      border: none;
      background: var(--primary-color);
      color: var(--background-dark);
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
    }

    .save-name-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .edit-name-btn {
      background: transparent;
      border: none;
      padding: 4px;
      color: var(--text-secondary);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: all 0.2s ease;
      min-width: 28px;
      min-height: 28px;
    }

    .edit-name-btn:hover {
      background: var(--background-lighter);
      color: var(--primary-color);
    }

    .profile-name {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
    }

    .profile-name-container {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
    }

    .profile-name-text {
      font-size: 16px;
      font-weight: 500;
      color: var(--text-primary);
      flex: 1;
    }

    .profile-header {
      padding: 16px;
      border-bottom: 1px solid var(--border-color);
    }

    .profile-email {
      font-size: 14px;
      color: var(--text-secondary);
      margin-top: 4px;
    }

    .groups-loading {
      padding: 16px;
    }

    .loading-skeleton {
      background: linear-gradient(
        90deg,
        var(--background-dark) 0%,
        var(--background-lighter) 50%,
        var(--background-dark) 100%
      );
      background-size: 200% 100%;
      animation: loading 1.5s infinite;
      border-radius: 8px;
      height: 80px;
      margin-bottom: 12px;
    }

    @keyframes loading {
      0% {
        background-position: 200% 0;
      }
      100% {
        background-position: -200% 0;
      }
    }
  `;

  return (
    <div className="dashboard-container">
      <style>{profileStyles}</style>
      <Toaster 
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'var(--background-lighter)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '12px 16px',
            fontSize: '14px',
            maxWidth: '320px',
            boxShadow: '0 4px 12px var(--shadow-color)'
          },
          success: {
            style: {
              background: 'var(--background-lighter)',
              border: '1px solid var(--primary-color)',
            },
            iconTheme: {
              primary: 'var(--primary-color)',
              secondary: 'var(--background-dark)'
            }
          },
          error: {
            style: {
              background: 'var(--background-lighter)',
              border: '1px solid var(--danger-color)',
            },
            iconTheme: {
              primary: 'var(--danger-color)',
              secondary: 'var(--background-dark)'
            }
          }
        }}
      />
      <div className="dashboard-body">
        <aside className={`dashboard-sidebar ${isSmallScreen && isSidebarExpanded ? 'expanded' : ''}`}>
          <div className="warq-logo-container">
            {isSmallScreen && (
              <button
                onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
                className="action-button"
                title="Toggle Sidebar"
              >
                <Menu size={20} />
              </button>
            )}
            <WarqLogo size={isSmallScreen ? 'small' : 'medium'} variant="default" />
          </div>
          
          <div className="mode-switch-container">
            <div className="mode-label">
              <Users size={16} />
              Group Notes
            </div>
            <div 
              className={`mode-switch${isGroupMode ? ' active' : ''}`}
              onClick={handleModeSwitch}
              role="button"
              tabIndex={0}
            />
          </div>

          {isGroupMode && (
            <div className="groups-section">
              <div className="groups-header">
                <h3>
                  <Users size={16} />
                  Your Groups
                </h3>
                <button 
                  onClick={() => setShowCreateGroupModal(true)} 
                  className="group-action-btn"
                  title="Create New Group"
                >
                  <FolderPlus size={14} />
                  New Group
                </button>
              </div>
              
              {groupsLoading ? (
                <div className="groups-loading">
                  {Array(3).fill(0).map((_, i) => (
                    <div key={i} className="group-item loading-skeleton" />
                  ))}
                      </div>
                    ) : (
                <div className="groups-list">
                  {groups.map(group => (
                    <div
                      key={group.id}
                      className={`group-item${selectedGroup === group.id ? ' active' : ''}`}
                      onClick={() => handleGroupSelect(group.id)}
                    >
                      <div className="group-info">
                        <h4>{group.title}</h4>
                        {group.description && (
                          <p className="group-description">{group.description}</p>
                        )}
                        <div className="group-meta">
                          <span>Created {new Date(group.created_at).toLocaleDateString()}</span>
                      </div>
                      </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedGroup(group.id);
                            setShowInviteModal(true);
                          }}
                          className="group-invite-btn"
                        title="Invite Members"
                        >
                          <UserPlus size={14} />
                        </button>
                    </div>
                  ))}
                  
                  {groups.length === 0 && (
                    <div className="empty-state">
                      <div className="empty-icon">
                        <Users size={20} />
                      </div>
                      <p>No groups yet</p>
                      <button 
                        onClick={() => setShowCreateGroupModal(true)} 
                        className="new-group-btn"
                      >
                        <FolderPlus size={14} />
                        Create your first group
                    </button>
                  </div>
                )}
              </div>
              )}
            </div>
          )}
          
          <div className="prev-notes">
            <div className="prev-notes-header">
            <div className="prev-notes-heading">
                <span className="section-title">
                  {isGroupMode ? (selectedGroup ? groups.find(g => g.id === selectedGroup)?.title || 'Group Notes' : 'Select a Group') : 'Notes'}
                </span>
                {(!isGroupMode || (isGroupMode && selectedGroup)) && (
                <button
                  className="new-note-btn"
                  onClick={handleNewNote}
                  title="Create New Note"
                  type="button"
                >
                  <Plus size={18} strokeWidth={2.5} />
                  <span className="btn-text">Create Note</span>
                </button>
                )}
            </div>
            
              <div className="search-container">
                <Search className="search-icon" size={16} strokeWidth={2} />
            <input
              type="text"
              className="notes-search-input"
                  placeholder={`Search ${isGroupMode ? 'group' : ''} notes...`}
              value={notesFilter}
              onChange={(e) => handleSearch(e.target.value)}
                  disabled={isGroupMode && !selectedGroup}
            />
              {isSearching && (
                <div className="search-spinner">
                  <Spinner size={14} />
                </div>
              )}
              </div>
            </div>
            
            <div className="notes-scroll-wrapper">
              {notesLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <div key={i} className="note-item loading-skeleton" style={{ height: '80px' }} />
                ))
              ) : (
                <>
                {notesError && (
                    <div className="error-message">
                      <X size={16} />
                      Failed to load notes. Please try again.
                    </div>
                )}
                {(notesFilter ? searchResults : notes)?.filter(note => note !== null).map((note) => (
                    <div 
                        key={note.id} 
                        className={`note-item${activeNote?.id === note.id ? ' active' : ''}`}
                        onClick={() => handleEdit(note)}
                    >
                        <div className="note-title">
                          <span>{note.title || 'Untitled'}</span>
                          {note.updated_at && note.updated_at !== note.created_at && (
                            <span className="note-edited">(edited)</span>
                          )}
                        </div>
                      <div className="note-meta">
                          <span>{new Date(note.created_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                         
                         
                          })}</span>
                          {files.length > 0 && note.id === activeNote?.id && (
                            <span className="note-files">
                              <Upload size={14} />
                              {files.length} {files.length === 1 ? 'file' : 'files'}
                            </span>
                          )}
                      </div>
                    </div>
                  ))}
                  {filteredNotes.length === 0 && !notesLoading && !notesError && (
                    <div className="empty-state">
                      <div className="empty-icon">
                        <Plus size={20} strokeWidth={2.5} />
              </div>
                      <p>No {isGroupMode ? 'group ' : ''}notes yet</p>
                      <button className="new-note-btn" onClick={handleNewNote}>
                        <Plus size={16} strokeWidth={2.5} />
                        Create your first {isGroupMode ? 'group ' : ''}note
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <style>{`
            .prev-notes {
              display: flex;
              flex-direction: column;
              height: calc(100vh - 300px);
              min-height: 200px;
              overflow: hidden;
            }

            .prev-notes-header {
              padding: 16px 16px 0;
            }

            .prev-notes-heading {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 16px;
            }

            .search-container {
              position: relative;
              margin: 8px 0;
            }

            .search-icon {
              position: absolute;
              left: 8px;
              top: 50%;
              transform: translateY(-50%);
              color: var(--text-secondary);
              pointer-events: none;
            }

            .notes-search-input {
              width: 100%;
              padding: 8px 12px 8px 32px;
              border-radius: 6px;
              border: 1px solid var(--border-color);
              background: var(--background-dark);
              color: var(--text-primary);
              font-size: 14px;
              transition: all 0.2s ease;
            }

            .notes-search-input:focus {
              outline: none;
              border-color: var(--primary-color);
              background: var(--background-lighter);
            }

            .notes-search-input::placeholder {
              color: var(--text-secondary);
            }

            .section-title {
              font-size: 16px;
              font-weight: 600;
              color: var(--text-primary);
            }

            .new-note-btn {
              display: flex;
              align-items: center;
              gap: 8px;
              padding: 6px 12px;
              border-radius: 6px;
              background: var(--primary-color);
              color: var(--background-dark);
              border: none;
              font-size: 14px;
              font-weight: 500;
              cursor: pointer;
              transition: all 0.2s ease;
            }

            .new-note-btn:hover {
              background: var(--primary-color-hover);
            }

            .notes-scroll-wrapper {
              flex: 1;
              overflow-y: auto;
              padding: 16px;
              margin-right: 2px;
            }

            .notes-scroll-wrapper::-webkit-scrollbar {
              width: 4px;
            }

            .notes-scroll-wrapper::-webkit-scrollbar-track {
              background: transparent;
            }

            .notes-scroll-wrapper::-webkit-scrollbar-thumb {
              background: rgba(71, 229, 132, 0.3);
              border-radius: 4px;
            }

            .notes-scroll-wrapper::-webkit-scrollbar-thumb:hover {
              background: rgba(71, 229, 132, 0.5);
            }
          `}</style>

          <div className="sidebar-footer">
            <div className="action-buttons">
              <button
                className="action-button"
                disabled={!isGroupMode || !selectedGroup}
                style={{ opacity: isGroupMode && selectedGroup ? 1 : 0.5 }}
                onClick={handleChatToggle}
              >
                <MessageSquare size={20} strokeWidth={2} />
                <span className="action-label">Chat</span>
                {(!isGroupMode || !selectedGroup) && (
                  <div className="tooltip">
                    {!isGroupMode ? "Available in group mode only" : "Select a group first"}
                  </div>
                )}
              </button>
              <button
                className="action-button"
                onClick={() => {/* AI functionality */}}
              >
                <Bot size={20} strokeWidth={2} />
                <span className="action-label">AI</span>
              </button>
              <button
                className="action-button"
                onClick={triggerFileUpload}
                disabled={!activeNote}
              >
                <Upload size={20} strokeWidth={2} />
                <span className="action-label">Upload</span>
              </button>
            </div>
            <div className="user-section">
              <button
                className="bell-icon"
                onClick={() => {
                  setShowNotificationsModal(true);
                  markAllNotificationsRead();
                }}
                title="Notifications"
              >
                <Bell size={20} strokeWidth={2} />
                {notifications.filter(n => !n.is_read).length > 0 && (
                  <span className="bell-badge">
                    {notifications.filter(n => !n.is_read).length}
                  </span>
                )}
              </button>
              <button
                ref={profileRef}
                className="profile-button"
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              >
                <img 
                  src={profileButton} 
                  alt={user?.name || 'Profile'} 
                  className="profile-avatar"
                />
              </button>
              {showProfileDropdown && (
                <>
                  {isSmallScreen && (
                    <div 
                      className="profile-dropdown-backdrop"
                      onClick={() => setShowProfileDropdown(false)}
                    />
                  )}
                  <div className="profile-dropdown">
                    <div className="profile-header">
                      <div className="profile-name">
                        {editingName ? (
                          <div className="edit-name-form">
                            <input
                              type="text"
                              value={newName}
                              onChange={(e) => setNewName(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && newName.trim()) {
                                  e.preventDefault();
                                  handleNameSave();
                                } else if (e.key === 'Escape') {
                                  e.preventDefault();
                                  setEditingName(false);
                                }
                              }}
                              placeholder="Enter new name"
                              maxLength={32}
                              className="edit-name-input"
                              autoFocus
                            />
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNameSave();
                              }}
                              className="save-name-btn"
                              disabled={!newName.trim()}
                              type="button"
                            >
                              Save
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingName(false);
                              }}
                              className="edit-name-btn"
                              title="Cancel"
                              type="button"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="profile-name-container">
                            <span className="profile-name-text">
                              {user?.name || user?.user_metadata?.full_name || 'User'}
                            </span>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log('Edit button clicked');
                                handleNameEdit();
                              }}
                              className="edit-name-btn"
                              title="Edit name"
                              type="button"
                            >
                              <Edit3 size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="profile-email" title={user?.email}>
                        {user?.email || 'No email available'}
                      </div>
                    </div>
                    <div className="profile-stats">
                      <div className="stat-item">
                        <span className="stat-label">Joined</span>
                        <span className="stat-value">
                          {user?.created_at ? new Date(user.created_at).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          }) : 'N/A'}
                        </span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Notes</span>
                        <span className="stat-value">
                          {notes.length || 0} total
                        </span>
                      </div>
                    </div>
                    <div className="profile-actions">
                      <button 
                        onClick={handleLogout}
                        className="profile-action-btn logout-btn"
                      >
                        <LogOut size={16} strokeWidth={2} />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </aside>

        <main className="dashboard-main">
          <div className="editor-wrapper">
            <div className="editor-header">
              <div className="editor-header-content">
              <input
                type="text"
                  className="note-title-input"
                  placeholder="Untitled Note"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                maxLength={60}
              />
                <button 
                  onClick={handleCreateOrEditNote}
                  className="save-note-btn"
                  disabled={!noteTitle.trim() || !noteContent || noteContent === '<p></p>'}
                >
                  <Save size={16} strokeWidth={2} className="save-icon" />
                  {editingNoteId ? 'Update' : 'Save'}
                </button>
              </div>
            </div>

            {renderCollaborators()}
            {renderToolbar()}
            
            <div className="rich-text-editor">
              <div className="editor-content" style={{flex: 1, minHeight: '300px', paddingBottom: files.length > 0 ? 60 : 0}}>
                <EditorContent editor={editor} />
              </div>
            {files.length > 0 && (
                <div className="file-cards-row-compact">
                {files.map(file => (
                    <FileCard
                      key={file.file_path}
                      file={file}
                      noteId={activeNote.id}
                      onDelete={() => fetchFiles(activeNote.id)}
                      userRole={userRole}
                      isCollab={isGroupMode}
                      compact
                    />
                ))}
              </div>
            )}
            </div>
          </div>
        </main>
      </div>

      {/* Notifications Modal */}
      {showNotificationsModal && (
        <div className="notifications-modal">
          <div className="notifications-header">
            <span className="notifications-title">Notifications</span>
            <button
              className="notification-action-btn"
          onClick={() => setShowNotificationsModal(false)}
        >
              <X size={16} />
            </button>
          </div>
          <div className="notifications-list">
            {notifications.length === 0 ? (
              <div className="empty-state">
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div 
                  key={notification.id} 
                  className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                >
                  <div className="notification-content">
                    {notification.message}
            </div>
                  <div className="notification-meta">
                    <span className="notification-time">
                      {new Date(notification.created_at).toLocaleDateString()}
                    </span>
                    <div className="notification-actions">
                      {notification.is_read ? (
            <button
                          className="notification-action-btn"
                          onClick={() => markNotificationUnread(notification.id)}
                        >
                          Mark as unread
            </button>
                      ) : (
                        <button
                          className="notification-action-btn"
                          onClick={() => markNotificationRead(notification.id)}
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      {/* Add the modal UI */}
      {showRoleModal && (
        <Modal onClose={() => setShowRoleModal(false)}>
          <h2>Manage Roles & Restrictions</h2>
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={roleModalFilter}
            onChange={e => setRoleModalFilter(e.target.value)}
            style={{
              width: '100%',
              marginBottom: 12,
              padding: '6px 10px',
              borderRadius: 6,
              border: '1px solid #47e584',
              background: '#151515',
              color: '#fff',
              fontSize: 15
            }}
          />
          {roleModalLoading ? <Spinner /> : (
            <div>
              {roleModalError && <div style={{ color: 'red' }}>{roleModalError}</div>}
              <table style={{ width: '100%', color: '#fff', background: '#222', borderRadius: 8 }}>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Restricted Until</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {roleModalUsers
                    .filter(user => {
                      const details = roleModalUserDetails[user.userId] || {};
                      const search = roleModalFilter.toLowerCase();
                      return (
                        !roleModalFilter ||
                        (details.name && details.name.toLowerCase().includes(search)) ||
                        (details.email && details.email.toLowerCase().includes(search))
                      );
                    })
                    .map(user => (
                      <tr key={user.userId}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {/* Avatar: fallback to initials if no avatarUrl */}
                            {roleModalUserDetails[user.userId]?.avatarUrl ? (
                              <img src={roleModalUserDetails[user.userId].avatarUrl} alt="avatar" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '2px solid #47e584', marginRight: 6 }} />
                            ) : (
                              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#222', color: '#47e584', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, marginRight: 6 }}>
                                {roleModalUserDetails[user.userId]?.name ? roleModalUserDetails[user.userId].name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2) : '?'}
                              </div>
                            )}
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontWeight: 500 }}>{roleModalUserDetails[user.userId]?.name || user.userId}</span>
                              <span style={{ color: '#aaa', fontSize: 12 }}>{roleModalUserDetails[user.userId]?.email || ''}</span>
                              <span style={{
                                display: 'inline-block',
                                background: roleColors[user.role] || '#aaa',
                                color: '#181818',
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: 600,
                                padding: '1px 7px',
                                marginTop: 2,
                                letterSpacing: 0.5
                              }}>{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <select
                            value={user.role}
                            onChange={e => handleRoleChange(user.userId, e.target.value, user.restrictedUntil)}
                            style={{ background: '#151515', color: '#fff', border: '1px solid #47e584', borderRadius: 4 }}
                          >
                            <option value="admin">Admin</option>
                            <option value="editor">Editor</option>
                            <option value="commenter">Commenter</option>
                            <option value="viewer">Viewer</option>
                            <option value="restricted">Restricted</option>
                          </select>
                        </td>
                        <td>
                          <input
                            type="datetime-local"
                            value={user.restrictedUntil ? new Date(user.restrictedUntil).toISOString().slice(0, 16) : ''}
                            onChange={e => handleRoleChange(user.userId, user.role, e.target.value)}
                            style={{ background: '#151515', color: '#fff', border: '1px solid #47e584', borderRadius: 4 }}
                          />
                        </td>
                        <td>
                          <button
                            style={{ background: '#ff6b6b', color: '#fff', border: 'none', borderRadius: 4, padding: '2px 8px', cursor: 'pointer', fontSize: 13 }}
                            onClick={() => handleRemoveUser(user.userId)}
                            disabled={roleModalLoading}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  {/* Edge case: if no users match filter, show message */}
                  {roleModalUsers.filter(user => {
                    const details = roleModalUserDetails[user.userId] || {};
                    const search = roleModalFilter.toLowerCase();
                    return (
                      !roleModalFilter ||
                      (details.name && details.name.toLowerCase().includes(search)) ||
                      (details.email && details.email.toLowerCase().includes(search))
                    );
                  }).length === 0 && (
                    <tr><td colSpan="4" style={{ color: '#aaa', textAlign: 'center', padding: 16 }}>No users found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Modal>
      )}
      {/* Add the invite modal */}
      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onInvite={inviteMember}
        email={inviteEmail}
        setEmail={setInviteEmail}
      />
      {renderFileInput()}
      <CreateGroupModal
        isOpen={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
        onCreate={createNewGroup}
      />

      {/* Add the Chat component */}
      {isGroupMode && selectedGroup && (
        <Chat
          projectId={selectedGroup}
          userId={user?.id}
          userName={user?.user_metadata?.full_name}
          showChat={showChat}
          onClose={() => setShowChat(false)}
        />
      )}

      {/* Add this before the closing div */}
      {showNotificationsModal && (
        <div className="modal-backdrop">
          <div className="modal-content notifications-modal">
            <h3>Notifications</h3>
            <div className="notifications-list">
              {notifications.map(notification => (
                <div key={notification.id} className="notification-item">
                  {notification.type === 'group_invitation' ? (
                    <InvitationNotification
                      notification={notification}
                      onAccept={handleAcceptInvitation}
                      onDecline={handleDeclineInvitation}
                    />
                  ) : (
                    <p>{notification.message}</p>
                  )}
                </div>
              ))}
              {notifications.length === 0 && (
                <p className="no-notifications">No new notifications</p>
              )}
            </div>
            <button 
              onClick={() => setShowNotificationsModal(false)}
              className="close-button"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
