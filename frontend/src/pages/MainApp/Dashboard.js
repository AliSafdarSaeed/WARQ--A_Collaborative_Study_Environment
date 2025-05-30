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
import { Bell, Menu, Search, Plus, Bold, Italic, Heading1, Heading2, List, ListOrdered, Palette, Upload, MessageSquare, Bot, X, Edit3, Save, LogOut, Users, UserPlus, FolderPlus, FileText, Check, AppWindow } from 'lucide-react';
import NotificationsBell from '../../components/NotificationsBell';
import { useNavigate, useSearchParams } from 'react-router-dom';
import WarqLogo from '../../components/WarqLogo';
import InviteModal from '../../components/InviteModal';
import Chat from '../../components/Chat/Chat';
import { subscribeToGroupNotes, subscribeToGroupPresence, createGroup, getGroupMembers } from '../../services/groupService';
import { acceptGroupInvitation } from '../../services/groupService';
import { v4 as uuidv4 } from 'uuid';

const sortNotesByDate = (notes) => {
  return [...notes].sort((a, b) => 
    new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at)
  );
};

function Dashboard() {
  const [selectedColor, setSelectedColor] = useState(null);
  const [showColors, setShowColors] = useState(false);
  const [content, setContent] = useState('');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);  // Add this line
  const [notes, setNotes] = useState([]);
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
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [signOutSaving, setSignOutSaving] = useState(false);


  // Add these state variables next to other state declarations
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const NOTES_PER_PAGE = 10;

  // Add this ref to track last mode
  const lastModeRef = useRef({ isGroupMode: null, selectedGroup: null });

  // Add groupMembers state variable with the other state declarations (line ~277)
  const [groupMembers, setGroupMembers] = useState([]);

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

      // Only include project_id if in group mode and a group is selected
      const presence = {
        user_id: user.id,
        user_name: user.name || user.user_metadata?.name || 'User',
        user_email: user.email,
        note_id: noteId,
        ...(isGroupMode && selectedGroup ? { project_id: selectedGroup } : {}),
        status,
        cursor_position: editor?.state?.selection ? {
          from: editor.state.selection.from,
          to: editor.state.selection.to,
          head: editor.state.selection.head,
          anchor: editor.state.selection.anchor
        } : null,
        selected_text: editor?.state?.selection && editor?.state?.selection.content ? 
                      editor.state.doc.textBetween(
                        editor.state.selection.from,
                        editor.state.selection.to
                      ) : '',
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

    // Only show group notes in group mode
    if (isGroupMode) {
      filtered = filtered.filter(note => note.project_id === selectedGroup);
      if (!selectedGroup) {
        filtered = [];
      }
    } else {
      // In personal mode, strictly show only notes with no project_id
      filtered = filtered.filter(note => !note.project_id);
    }

    if (notesFilter) {
      const searchTerm = notesFilter.toLowerCase();
      filtered = filtered.filter(note => 
        note.title?.toLowerCase().includes(searchTerm) ||
        note.content?.toLowerCase().includes(searchTerm)
      );
    }

    return sortNotesByDate(filtered);
  }, [notes, notesFilter, isGroupMode, selectedGroup]);

  // Replace fetchNotes with this paginated version
  const fetchNotes = useCallback(async (showLoading = true, isLoadMore = false) => {
    if (showLoading) setNotesLoading(true);
    setNotesError(false);
    
    try {
      // First verify we have a valid session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw new Error('Session verification failed');
      if (!session) throw new Error('No active session');

      const start = page * NOTES_PER_PAGE;
      
      // Fetch paginated notes
      const { data: notesArr, error: notesError, count } = await supabase
        .from('notes')
        .select('*', { count: 'exact' })
        .eq('user_id', session.user.id)
        .is('project_id', null) // Only fetch notes without a project_id
        .order('updated_at', { ascending: false })
        .range(start, start + NOTES_PER_PAGE - 1);

      if (notesError) {
        console.error("Notes fetch error:", notesError);
        throw new Error(notesError.message);
      }

      // Update hasMore flag
      setHasMore(count > (page + 1) * NOTES_PER_PAGE);

      if (!notesArr) {
        console.warn("No notes returned from query");
        if (!isLoadMore) setNotes([]);
        return [];
      }

      console.log("Fetched notes:", notesArr.length);
      
      // Update notes state based on whether we're loading more or not
      setNotes(prev => isLoadMore ? [...prev, ...notesArr] : notesArr);
      return notesArr;
    } catch (err) {
      console.error("Error fetching notes:", err);
      setNotesError(true);
      setError(err.message || 'Failed to load notes. Please try refreshing the page.');
      return [];
    } finally {
      setNotesLoading(false);
    }
  }, [page]);

  // Add handleLoadMore function
  const handleLoadMore = useCallback(() => {
    if (hasMore && !notesLoading) {
      setPage(prev => prev + 1);
    }
  }, [hasMore, notesLoading]);

  // Add pagination reset effect
  useEffect(() => {
    setPage(0);
  }, [user?.id]);

  // Add notes fetch effect that runs when page changes
  useEffect(() => {
    fetchNotes(true, page !== 0);
    // page !== 0 means it's a load more, otherwise initial load
  }, [page, user?.id]);

  // Add mode switching effect
  useEffect(() => {
    // Only fetch if mode or group actually changed
    if (
      lastModeRef.current.isGroupMode === isGroupMode &&
      lastModeRef.current.selectedGroup === selectedGroup
    ) {
      return;
    }
    lastModeRef.current = { isGroupMode, selectedGroup };

    if (isGroupMode) {
      if (selectedGroup) {
        // Fetch group notes
        setNotesLoading(true);
        setNotesError(false);
        fetchGroupNotes(selectedGroup)
          .catch((err) => {
            setNotesError(true);
            setError(err.message || 'Failed to load group notes.');
          })
          .finally(() => setNotesLoading(false));
      } else {
        // No group selected, clear notes
        setNotes([]);
      }
    } else {
      // Switching to personal mode: reset pagination and fetch personal notes
      setPage(0);
      fetchNotes(true, false);
    }
  }, [isGroupMode, selectedGroup, user?.id]);

  // Add initialization effect
  useEffect(() => {
    // Make sure we have a user before fetching
    if (!user?.id) {
      console.log("No user available yet, postponing initial notes fetch");
      return;
    }
    
    const initializeNotes = async () => {
      try {
        console.log("Initializing notes on mount for user:", user.id);
        // If we're in personal mode (default), fetch personal notes
        if (!isGroupMode) {
          // Fetch initial notes
          const fetchInitialNotes = async () => {
            setNotesLoading(true);
            setNotesError(false);
            
            try {
              const { data: { session }, error: sessionError } = await supabase.auth.getSession();
              if (sessionError) throw new Error('Session verification failed');
              if (!session) throw new Error('No active session');
              
              // Fetch initial page of notes
              const { data: notesArr, error: notesError } = await supabase
                .from('notes')
                .select('*', { count: 'exact' })
                .eq('user_id', session.user.id)
                .is('project_id', null)
                .order('updated_at', { ascending: false })
                .range(0, NOTES_PER_PAGE - 1);

              if (notesError) {
                console.error("Initial notes fetch error:", notesError);
                throw new Error(notesError.message);
              }

              console.log("Successfully fetched initial notes:", notesArr?.length || 0);
              setNotes(notesArr || []);
            } catch (err) {
              console.error("Error in initial notes fetch:", err);
              setNotesError(true);
              setError(err.message || 'Failed to load notes. Please try refreshing the page.');
            } finally {
              setNotesLoading(false);
            }
          };

          await fetchInitialNotes();
        }
      } catch (err) {
        console.error("Error initializing notes:", err);
      }
    };

    initializeNotes();
  }, [user?.id]);

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
      setProfileLoading(true);
      // Check if we're authenticated with Supabase
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Supabase auth error:", sessionError);
        navigate('/login');
        return;
      }
      
      if (!session) {
        console.warn("No active session found");
        navigate('/login');
        return;
      }
      
      // Get the user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (userError) {
        console.error("Error fetching user data:", userError);
        // If user record doesn't exist, create one with basic info from auth
        if (userError.code === 'PGRST116') { // No rows returned
          const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert([{
              id: session.user.id,
              email: session.user.email,
              name: session.user.user_metadata?.full_name || session.user.email.split('@')[0],
              created_at: new Date().toISOString()
            }])
            .select()
            .single();
            
          if (createError) {
            console.error("Failed to create user record:", createError);
            throw createError;
          }
          
          setUser(newUser);
        } else {
          throw userError;
        }
      } else {
        // Update the user state with fetched data
        setUser({
          ...userData,
          // Ensure user_metadata is available
          user_metadata: session.user.user_metadata || {}
        });
      }
    } catch (e) {
      console.error("Auth verification error:", e);
      // One more attempt to verify session
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate('/login');
        }
      } catch (finalError) {
        console.error("Final auth check failed:", finalError);
        navigate('/login');
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

    // Remove the check that prevents note creation without group members
    // Only check if in group mode but no group selected
    if (isGroupMode && !selectedGroup) {
      toast.error('Please select a group first');
      return;
    }

    try {
      // Check session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Authentication required. Please log in again.');
      }

      // Ensure editingNoteId matches the note being edited
      let currentEditingId = editingNoteId;
      if (!currentEditingId && activeNote && activeNote.id) {
        currentEditingId = activeNote.id;
        setEditingNoteId(activeNote.id);
      }

      // Check for duplicate title
      let titleQuery = supabase
        .from('notes')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('title', noteTitle.trim());
      
      if (currentEditingId) {
        titleQuery = titleQuery.neq('id', currentEditingId);
      }
      
      const { data: existingNotes, error: titleCheckError } = await titleQuery;
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
        // No permission check needed for creating notes in your own group
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
      // Always set both activeNote and editingNoteId to the note's id
      setActiveNote(note);
      setEditingNoteId(note.id);
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
    console.log('Sign out button clicked');
    
    // Check if there are unsaved changes
    if (noteTitle?.trim() && noteContent && noteContent !== '<p></p>') {
      // Show modal instead of basic confirm
      setShowSignOutModal(true);
      return;
    }
    
    // If no unsaved changes, proceed with logout
    performLogout();
  };

  // New function to handle actual logout process
  const performLogout = async () => {
    try {
      // Clear all notifications first
      if (typeof clearAllNotifications === 'function') clearAllNotifications();
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Supabase signOut error:', error);
        toast.error('Failed to sign out. Please try again.');
        return;
      }
      
      // Clear all Supabase session data from localStorage
      localStorage.removeItem('sb-access-token');
      localStorage.removeItem('sb-refresh-token');
      
      // Use React Router's navigate for proper routing
      navigate('/login');
      toast.success('Successfully signed out');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to sign out. Please try again.');
    }
  };

  // New function to save note and then sign out
  const saveAndSignOut = async () => {
    try {
      setSignOutSaving(true);
      const saved = await saveCurrentNote();
      setSignOutSaving(false);
      
      if (saved === false) {
        toast.error('Failed to save note. Please try again.');
        return;
      }
      
      setShowSignOutModal(false);
      performLogout();
    } catch (error) {
      setSignOutSaving(false);
      console.error('Error saving before logout:', error);
      toast.error('Failed to save note. Please try again.');
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
      if (session && !sessionStorage.getItem('welcomeShown')) {
        toast.success('Welcome back!');
        sessionStorage.setItem('welcomeShown', 'true');
      }
    };
    checkAndNotifyLogin();
  }, []);

  // Add notification for user logout
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        toast.info('Successfully logged out');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Update handleModeSwitch to properly handle mode switching
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
      setNotesFilter(''); // Clear search filter
      
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
        // Switching to personal mode: reset pagination and fetch personal notes
        setPage(0);
        fetchNotes(true, false);
      }
    } catch (error) {
      console.error('Error switching modes:', error);
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

  // Update inviteMember function to search for users by name or email
  // Around line 1947
  const inviteMember = async (selectedUser) => {
    if (!selectedUser || !selectedUser.id) {
      toast.error('Please select a valid user to invite');
      return;
    }
  
    try {
      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('project_members')
        .select('id')
        .eq('project_id', selectedGroup)
        .eq('user_id', selectedUser.id)
        .eq('status', 'accepted')
        .single();
  
      if (existingMember) {
        toast.error('User is already a member of this group');
        return;
      }
      const invitationToken = uuidv4();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      // Send invitation (replace with your actual invitation logic)
      const { error: inviteError } = await supabase
        .from('projects_invitations')
        .insert([{
          project_id: selectedGroup,
          invited_user_id: selectedUser.id,
          invited_email: selectedUser.email,
          invited_by: user.id,
          status: 'pending',
          created_at: new Date().toISOString(),
          invitation_token: invitationToken,
          expires_at: expiresAt
        }]);
  
      if (inviteError) throw inviteError;
  
      toast.success('Invitation sent successfully!');
      setShowInviteModal(false);
      setInviteEmail('');
    } catch (err) {
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
      setNotes([]); // Clear existing notes
      setActiveNote(null);
      setEditingNoteId(null);
      setNoteTitle('');
      setNoteContent('');
      
      // Unsubscribe from previous group's real-time updates
      if (notesChannel.current) {
        notesChannel.current();
      }
      if (presenceChannel.current) {
        presenceChannel.current();
      }

      // Subscribe to new group's real-time updates
      notesChannel.current = subscribeToGroupNotes(groupId, (payload) => {
        if (payload.eventType === 'INSERT') {
          setNotes(prev => [...prev, payload.new]);
        } else if (payload.eventType === 'UPDATE') {
          setNotes(prev => prev.map(note => 
            note.id === payload.new.id ? payload.new : note
          ));
        } else if (payload.eventType === 'DELETE') {
          setNotes(prev => prev.filter(note => note.id !== payload.old.id));
        }
      });

      // Subscribe to presence updates
      presenceChannel.current = subscribeToGroupPresence(groupId, user.id, (state) => {
        setCollaborators(state);
      });

      // Fetch initial group data
      await Promise.all([
        fetchGroupNotes(groupId),
        fetchGroupMembers(groupId)
      ]);
    } catch (error) {
      console.error('Error selecting group:', error);
      toast.error('Failed to load group data');
    }
  };

  // This function has been moved up to line 549

  // Add this function to fetch group members
  const fetchGroupMembers = async (groupId) => {
    try {
      const members = await getGroupMembers(groupId);
      setGroupMembers(members);
    } catch (error) {
      console.error('Error fetching group members:', error);
      toast.error('Failed to load group members');
    }
  };

  // This filteredNotes implementation has been moved up to line ~500

  // Update createNote function to handle group notes
  const createNote = async () => {
    try {
      const newNote = {
        title: 'Untitled Note',
        content: '',
        user_id: user.id,
        project_id: isGroupMode ? selectedGroup : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('notes')
        .insert([newNote])
        .select()
        .single();

      if (error) throw error;

      // No need to update notes array manually as real-time subscription will handle it
      setActiveNote(data);
      setEditingNoteId(data.id);
      setNoteTitle(data.title);
      setNoteContent(data.content);
    } catch (error) {
      console.error('Error creating note:', error);
      toast.error('Failed to create note');
    }
  };

  // Update saveNote function to handle real-time updates
  const saveNote = async () => {
    if (!activeNote) return;

    try {
      const updates = {
        title: noteTitle,
        content: noteContent,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('notes')
        .update(updates)
        .eq('id', activeNote.id);

      if (error) throw error;

      // No need to update notes array manually as real-time subscription will handle it
      setEditingNoteId(null);
      toast.success('Note saved successfully');
    } catch (error) {
      console.error('Error saving note:', error);
      toast.error('Failed to save note');
    }
  };

  // Function to trigger the hidden file input for uploads
  const triggerFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Add this before the closing div
  const handleChatToggle = () => {
    if (isGroupMode && selectedGroup) {
      console.log("Chat toggle clicked, current state:", showChat);
      setShowChat(prevState => !prevState);
      console.log("Chat should be set to:", !showChat);
    } else {
      toast.error("Chat is only available in group mode with a selected group");
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
      
      const { groupId } = await acceptGroupInvitation(token, user.id);

      // Update notifications list
      setNotifications(prev => prev.filter(n => 
        !(n.type === 'group_invitation' && n.data?.invitation_token === token)
      ));

      // Refresh groups list
      await fetchGroups();

      // Switch to the new group
      setSelectedGroup(groupId);
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

  const renderCollaborators = () => {
    if (!isGroupMode || !selectedGroup || !collaborators || Object.keys(collaborators).length === 0) return null;

    const activeUsers = Object.values(collaborators).filter(Boolean);
    if (activeUsers.length === 0) return null;

    const statusColors = {
      typing: '#47e584', // green for active typing
      viewing: '#3498DB', // blue for viewing 
      idle: '#aaa' // gray for idle
    };

    return (
      <div className="collaborators-bar">
        <div className="collaborators-header">
          <span className="collaborators-title">Active Contributors</span>
        </div>
        <div className="active-users">
          {activeUsers.map((collaborator, idx) => {
            const initials = collaborator.user_name 
              ? collaborator.user_name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
              : 'U';
            return (
              <div key={collaborator.user_id || idx} className="collaborator-item">
                <div className="collaborator-avatar" style={{ backgroundColor: `rgba(${Math.floor(Math.random()*255)}, ${Math.floor(Math.random()*255)}, ${Math.floor(Math.random()*255)}, 0.2)` }}>
                  {initials}
                  <span 
                    className="status-indicator" 
                    style={{ backgroundColor: statusColors[collaborator.status] || '#aaa' }}
                    title={
                      collaborator.status === 'typing'
                        ? 'Editing'
                        : collaborator.status === 'viewing'
                        ? 'Viewing'
                        : 'Idle'
                    }
                  />
                </div>
                <div className="collaborator-info">
                  <span className="collaborator-name">
                    {collaborator.user_name || 'Unknown User'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-container">
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
        {/* Hidden file input for uploads */}
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileUpload}
          multiple={false}
          accept="image/*,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        />
        <aside className={`dashboard-sidebar ${isSmallScreen && isSidebarExpanded ? 'expanded' : ''}`} style={{ position: 'relative', minWidth: 260 }}>
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

          {/* GROUPS SECTION */}
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
              <div className="groups-list">
                {groups && groups.length > 0 ? (
                  groups.map(group => (
                    <div
                      key={group.id}
                      className={`group-item${selectedGroup === group.id ? ' active' : ''}`}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                      onClick={() => handleGroupSelect(group.id)}
                    >
                      <span>{group.title}</span>
                      <button
                        className="group-invite-btn"
                        title="Invite users to this group"
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedGroup(group.id);
                          setShowInviteModal(true);
                        }}

                        style={{ marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} 
                      >
                        <UserPlus size={16} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">No groups found.</div>
                )}
              </div>
            </div>
          )}

          {/* PREVIOUS NOTES SECTION */}
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
              
              {/* Add search input for notes */}
              <div className="search-container">
                <Search size={14} className="search-icon" />
                <input
                  type="text"
                  className="notes-search-input"
                  placeholder="Search notes..."
                  value={notesFilter}
                  onChange={(e) => handleSearch(e.target.value)}
                  disabled={isSearching}
                />
                {isSearching && (
                  <div className="search-spinner">
                    <Spinner size={14} />
                  </div>
                )}
              </div>
            </div>
            <div className="notes-scroll-wrapper">
              <div className="notes-list">
                {filteredNotes.length > 0 ? (
                  filteredNotes.map(note => (
                    <div
                      key={note.id}
                      className={`note-item${activeNote?.id === note.id ? ' active' : ''}`}
                    >
                      <div 
                        className="note-content"
                        onClick={() => handleEdit(note)}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}
                      >
                        <span>{note.title || 'Untitled'}</span>
                        <button
                          className="note-delete-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(note.id);
                          }}
                          title="Delete note"
                          style={{ 
                            background: 'none', 
                            border: 'none', 
                            cursor: 'pointer', 
                            opacity: 0.6,
                            padding: '4px',
                            borderRadius: '4px',
                            color: 'var(--danger-color)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18"></path>
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">No notes found.</div>
                )}
                
                {hasMore && !isGroupMode && (
                  <button 
                    className="load-more-btn"
                    onClick={handleLoadMore}
                    disabled={notesLoading}
                  >
                    {notesLoading ? (
                      <>
                        <div className="loading-spinner"></div>
                        Loading...
                      </>
                    ) : (
                      'Load More Notes'
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* SIDEBAR BOTTOM BAR: AI, CHAT, UPLOAD, NOTIFICATIONS, PROFILE */}
          <div className="sidebar-bottom-bar" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 0', background: 'var(--background-dark)', borderTop: '1px solid var(--border-color)' }}>
            <button
              className="action-button"
              onClick={() => {/* AI functionality */}}
              title="AI"
              style={{ background: 'none', border: 'none' }}
            >
              <Bot size={22} />
            </button>
            <button
              className="action-button"
              disabled={!isGroupMode || !selectedGroup}
              style={{ opacity: isGroupMode && selectedGroup ? 1 : 0.5, background: 'none', border: 'none' }}
              onClick={handleChatToggle}
              title="Chat"
            >
              <MessageSquare size={22} />
            </button>
            <button
              className="action-button"
              onClick={triggerFileUpload}
              disabled={!activeNote}
              title="Upload"
              style={{ background: 'none', border: 'none' }}
            >
              <Upload size={22} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <NotificationsBell userId={user?.id} />
            </div>
            <div style={{ position: 'relative' }}>
              <button
                className="profile-button"
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                title="Profile"
                style={{ background: 'none', border: 'none', padding: 0 }}
              >
                <img 
                  src={profileButton} 
                  alt={user?.name || 'Profile'} 
                  className="profile-avatar"
                  style={{ width: 28, height: 28, borderRadius: '50%' }}
                />
              </button>
              {showProfileDropdown && (
                <div style={{ position: 'absolute', bottom: 40, right: 0, zIndex: 1000 }}>
                  <div ref={profileRef} className="profile-dropdown">
                    {/* ...existing profile dropdown content... */}
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
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLogout();
                        }}
                        className="profile-action-btn logout-btn"
                      >
                        <LogOut size={16} strokeWidth={2} />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
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
            {activeNote && files.length > 0 && (
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

      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onInvite={inviteMember}
        groupName={groups.find(g => g.id === selectedGroup)?.title || 'Group'}
      />

      {/* Create Group Modal */}
      {showCreateGroupModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateGroupModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Create New Group</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const name = e.target.elements.groupName.value;
              const description = e.target.elements.groupDescription.value;
              createNewGroup(name, description);
              setShowCreateGroupModal(false);
            }}>
              <input
                type="text"
                name="groupName"
                placeholder="Group Name"
                className="modal-input"
                required
              />
              <textarea
                name="groupDescription"
                placeholder="Group Description (Optional)"
                className="modal-input"
                style={{ minHeight: '80px', resize: 'vertical' }}
              ></textarea>
              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-button cancel"
                  onClick={() => setShowCreateGroupModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="modal-button invite"
                >
                  <FolderPlus size={16} />
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

      {/* Sign Out Confirmation Modal */}
      {showSignOutModal && (
        <Modal
          isOpen={showSignOutModal}
          onRequestClose={() => setShowSignOutModal(false)}
          contentLabel="Confirm Sign Out"
          className="sign-out-modal"
        >
          <h3>Confirm Sign Out</h3>
          <p>You have unsaved changes. Do you want to save your note before signing out?</p>
          <div className="modal-actions">
            <button
              onClick={() => {
                setShowSignOutModal(false);
                // Proceed with logout without saving
                performLogout();
              }}
              className="modal-button"
            >
              Sign Out Without Saving
            </button>
            <button
              onClick={() => {
                setShowSignOutModal(false);
                // Save note and then sign out
                saveAndSignOut();
              }}
              className="modal-button save"
              disabled={signOutSaving}
            >
              {signOutSaving ? <Spinner size={16} /> : 'Save and Sign Out'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default Dashboard;
