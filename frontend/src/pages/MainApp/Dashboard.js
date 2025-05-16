import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import './Dashboard.css';
import profileButton from '../../assets/user-profile.png';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import BulletList from '@tiptap/extension-bullet-list';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import previousNotes from '../../assets/prev-notes.png';
import chatFeature from '../../assets/chat.png';
import aiFeature from '../../assets/ai.png';
import importFiles from '../../assets/import.png';
import newNote from '../../assets/addSign.png';
import { supabase } from '../../services/supabase';
import { getProjects, getNotes, createNote, editNote, deleteNote, markNoteCompleted, getUserProjects, createProject, joinProject, addFileToNote, getUserProfile, createQuiz, getQuizzesForNote, submitQuiz } from '../../services/api';
import Spinner from '../../components/Spinner';
import axios from 'axios';
import API from '../../services/api';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const sortNotesByDate = (notes) => {
  return [...notes].sort((a, b) => 
    new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
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
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [error, setError] = useState('');
  const [projectName, setProjectName] = useState('');
  const [projectError, setProjectError] = useState('');
  const [fileUploadNoteId, setFileUploadNoteId] = useState(null);
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
  const [notesError, setNotesError] = useState(false);

  // Profile dropdown edit state
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  const handleNameEdit = () => {
    setEditingName(true);
    setNewName(user?.name || '');
  };

  const handleNameSave = async () => {
    setProfileError('');
    setProfileSuccess('');
    try {
      const res = await API.put('/auth/profile', { name: newName });
      setUser(prev => ({ ...prev, name: newName }));
      setEditingName(false);
      setProfileSuccess('Name updated!');
    } catch (err) {
      setProfileError('Failed to update name');
    }
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        orderedList: false,
        bulletList: false,
        listItem: false,
        textStyle: false,
        color: false,
      }),
      TextStyle,
      Color,
      OrderedList,
      BulletList,
      ListItem,
      Placeholder.configure({
        placeholder: 'Start typing your notes here...',
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        className: 'prose prose-sm focus:outline-none',
      },
    },
    onUpdate({ editor }) {
      const currentColor = editor.getAttributes('textStyle').color || null;
      setSelectedColor(currentColor);
      setNoteContent(editor.getHTML()); // Sync editor content to noteContent
    },
  });

  // Helper to apply editor commands and preserve selected color
  const applyCommandWithColorPreserved = (commandFn) => {
    if (!editor) return;
    commandFn(); // Run formatting command
    if (selectedColor) {
      editor.chain().focus().setColor(selectedColor).run(); // Reapply color
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

  const colors = [
    '#FF5733', '#47e584', '#3357FF', '#F1C40F',
    '#9B59B6', '#E74C3C', '#1ABC9C', '#F39C12',
    '#3498DB', '#2ECC71', '#E67E22', '#9B59B6',
    '#F39C12', '#8E44AD', '#16A085', '#D35400'
  ];

  const renderToolbar = () => {
    if (!editor) return null;

    return (
      <div className="editor-toolbar">
        <button
          onClick={() => applyCommandWithColorPreserved(() =>
            editor.chain().focus().toggleBold().run()
          )}
          className={editor.isActive('bold') ? 'active' : ''}>
          Bold
        </button>
        <button
          onClick={() => applyCommandWithColorPreserved(() =>
            editor.chain().focus().toggleItalic().run()
          )}
          className={editor.isActive('italic') ? 'active' : ''}>
          Italic
        </button>
        <button
          onClick={() => applyCommandWithColorPreserved(() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          )}
          className={editor.isActive('heading', { level: 1 }) ? 'active' : ''}>
          H1
        </button>
        <button
          onClick={() => applyCommandWithColorPreserved(() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          )}
          className={editor.isActive('heading', { level: 2 }) ? 'active' : ''}>
          H2
        </button>
        <button
          onClick={() => applyCommandWithColorPreserved(() =>
            editor.chain().focus().toggleOrderedList().run()
          )}
          className={editor.isActive('orderedList') ? 'active' : ''}>
          1. Numbered
        </button>
        <button
          onClick={() => applyCommandWithColorPreserved(() =>
            editor.chain().focus().toggleBulletList().run()
          )}
          className={editor.isActive('bulletList') ? 'active' : ''}>
          • Bullets
        </button>

        <div className="color-dropdown-container">
          <button onClick={() => setShowColors(!showColors)} className="color-toggle-btn">
            🎨 Color
          </button>

          {showColors && (
            <div className="color-dropdown">
              {colors.map((color, idx) => (
                <button
                  key={idx}
                  style={{
                    backgroundColor: color,
                    width: '24px',
                    height: '24px',
                    border: selectedColor === color ? '2px solid #000' : '1px solid #444',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    opacity: selectedColor === color ? 0.7 : 1,
                  }}
                  onClick={() => handleColorSelect(color)}
                  title={color}
                />
              ))}
            </div>
          )}
        </div>

        {selectedColor && (
          <button className="reset-default-btn" onClick={handleResetToDefault}>
            Reset to Default
          </button>
        )}
      </div>
    );

  };

  const fetchNotes = useCallback(async (showLoading = true) => {
    if (showLoading) setNotesLoading(true);
    setNotesError(false);
    
    try {
      const response = await API.get('/notes/all');
      
      if (Array.isArray(response.data)) {
        const sortedNotes = sortNotesByDate(response.data);
        setNotes(sortedNotes);
        return sortedNotes;
      } else {
        console.error("Unexpected notes response format:", response.data);
        setNotes([]);
        setNotesError(true);
        return [];
      }
    } catch (err) {
      console.error("Error fetching notes:", err);
      setNotesError(true);
      return [];
    } finally {
      if (showLoading) setNotesLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch user data from both Supabase and our backend
    const fetchUserData = async () => {
      try {
        // First check if we're authenticated with Supabase
        const { data: { session }, error: supabaseError } = await supabase.auth.getSession();
        
        if (supabaseError || !session) {
          console.error("Supabase auth error:", supabaseError);
          window.location.href = '/login';
          return;
        }
        
        // Then get the MongoDB user data from our backend
        try {
          const { data: userData } = await getUserProfile();
          if (userData && userData.data) {
            setUser(userData.data);
            console.log("User data from MongoDB:", userData.data);
          }
        } catch (backendError) {
          console.error("Backend profile fetch error:", backendError);
          // If our backend fails but Supabase auth is valid, we can still proceed
          // The middleware will create a user on first authenticated request
        }
      } catch (e) {
        console.error("Auth verification error:", e);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchUserData();
    
    // Fetch projects and notes
    Promise.all([
      getProjects().then(res => setProjects(res.data)).catch(() => setProjects([])),
      getNotes().then(res => setNotes(Array.isArray(res.data) ? res.data : [])).catch(() => setNotes([]))
    ]).finally(() => {
      setLoading(false);
      setNotesLoading(false);
    });

    // Add event listener to close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [fetchNotes]);

  const handleInput = () => {
    if (editorRef.current) {
      setContent(editorRef.current.innerText);
    }
  };

  // Update handleCreateOrEditNote to show the note in the panel immediately after saving
  const handleCreateOrEditNote = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!noteTitle.trim()) {
      setError("Note title is required");
      return;
    }
    if (!noteContent || !noteContent.trim() || noteContent === '<p></p>') {
      setError("Note content is required");
      return;
    }
    
    try {
      if (editingNoteId) {
        const res = await editNote(editingNoteId, { title: noteTitle, content: noteContent });
        // Update the note in the notes array with the response data
        setNotes(prev => prev.map(n => n._id === editingNoteId ? res.data : n));
        setActiveNote(res.data); // Update active note with latest data
        
        // Refresh notes list to ensure it's up-to-date
        fetchNotes(false);
        
        setError('Note updated successfully!');
        setTimeout(() => setError(''), 2000);
      } else {
        const res = await createNote({ title: noteTitle, content: noteContent });
        if (res.data) {
          // Add the new note to the beginning of the notes array
          setNotes(prev => sortNotesByDate([res.data, ...prev]));
          // Update active note to the newly created note
          setActiveNote(res.data);
          setEditingNoteId(res.data._id);
          
          // Refresh notes list to ensure it's up-to-date
          fetchNotes(false);
          
          setError('Note created successfully!');
          setTimeout(() => setError(''), 2000);
        }
      }
    } catch (err) {
      console.error("Note save error:", err);
      setError('Failed to save note. Please try again.');
    }
  };

  // Improve the saveCurrentNote function to properly save and update UI
  const saveCurrentNote = async () => {
    if (!noteTitle.trim()) {
      console.log('Note title is empty, not saving');
      return false;
    }
    
    if (!noteContent || noteContent === '<p></p>') {
      console.log('Note content is empty, not saving');
      return false;
    }
    
    try {
      if (activeNote && activeNote._id) {
        // Update existing note
        const res = await API.put(`/notes/${activeNote._id}`, {
          title: noteTitle,
          content: noteContent
        });
        
        // Update notes array with the updated note
        setNotes(prev => {
          const updatedNotes = [...prev];
          const idx = updatedNotes.findIndex(n => n._id === activeNote._id);
          if (idx !== -1) {
            updatedNotes[idx] = res.data;
          } else {
            // If somehow not found, add it
            updatedNotes.unshift(res.data);
          }
          return sortNotesByDate(updatedNotes);
        });
        
        // Refresh all notes in the background
        fetchNotes(false);
        
        console.log('Existing note saved:', noteTitle);
        return true;
      } else if (noteTitle.trim() && noteContent) {
        // Create new note
        const res = await createNote({ title: noteTitle, content: noteContent });
        if (res.data) {
          // Add to notes array
          setNotes(prev => sortNotesByDate([res.data, ...prev]));
          
          // Refresh all notes in the background
          fetchNotes(false);
          
          console.log('New note created:', noteTitle);
          return true;
        }
      }
      return false;
    } catch (err) {
      console.error('Failed to save note:', err);
      return false;
    }
  };

  // Update handleNewNote to ensure current note is saved
  const handleNewNote = async () => {
    try {
      // Try to save current note if we have content
      if (noteTitle.trim() && noteContent && noteContent !== '<p></p>') {
        await saveCurrentNote();
      }
      
      // Reset editor state for new note
      if (editor) {
        editor.commands.clearContent();
      }
      
      // Reset states for new note
      setActiveNote(null);
      setEditingNoteId(null);
      setNoteTitle('');
      setNoteContent('');
      setError('');
    } catch (error) {
      console.error("Error creating new note:", error);
    }
  };

  const handleEdit = async (note) => {
    // Auto-save current note if we have one
    if (activeNote && activeNote._id !== note._id) {
      await saveCurrentNote();
    }
    
    // Set up for editing the selected note
    setEditingNoteId(note._id);
    setActiveNote(note);
    setNoteTitle(note.title || '');
    setNoteContent(note.content || '');
    
    // Update the editor content
    if (editor) {
      editor.commands.setContent(note.content || '');
    }
  };

  const handleDelete = async (noteId) => {
    if (!window.confirm("Are you sure you want to delete this note?")) {
      return;
    }
    
    try {
      await deleteNote(noteId);
      setNotes(notes.filter(n => n._id !== noteId));
    } catch (err) {
      console.error("Delete error:", err);
      setError('Failed to delete note.');
    }
  };

  const handleMarkCompleted = async (noteId) => {
    try {
      await markNoteCompleted({ noteId });
      setNotes(notes.map(n => n._id === noteId ? { ...n, completed: true } : n));
    } catch (err) {
      console.error("Mark complete error:", err);
      setError('Failed to mark as completed.');
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setProjectError('');
    
    if (!projectName.trim()) {
      setProjectError("Project name is required");
      return;
    }
    
    try {
      const res = await createProject({ name: projectName });
      if (res.data) {
        setProjects([...projects, res.data]);
        setProjectName('');
      }
    } catch (err) {
      console.error("Project creation error:", err);
      setProjectError('Failed to create project.');
    }
  };

  const handleJoinProject = async (projectId) => {
    setProjectError('');
    try {
      await joinProject({ projectId });
      setProjectError('Successfully joined project!');
    } catch (err) {
      console.error("Join project error:", err);
      setProjectError('Failed to join project.');
    }
  };

  const handleFileUpload = async (e, noteId) => {
    setFileUploadError('');
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      await addFileToNote(noteId, file);
      setFileUploadNoteId(null);
    } catch (err) {
      console.error("File upload error:", err);
      setFileUploadError('Failed to upload file.');
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
      await createQuiz({ noteId: quizNoteId, question: quizQuestion, options: quizOptions, answer: quizAnswer });
      setQuizNoteId(null); setQuizQuestion(''); setQuizOptions(['', '', '', '']); setQuizAnswer(0);
    } catch {
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
    } catch (err) {
      console.error("Quiz submission error:", err);
      setQuizResult('Submission failed.');
    }
  };

  // Fetch notes on mount
  useEffect(() => {
    API.get('/notes/all').then(res => {
      // Sort notes by updated date before setting
      const fetchedNotes = Array.isArray(res.data) ? res.data : [];
      setNotes(fetchedNotes.sort((a, b) => 
        new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
      ));
    });
  }, []);

  // Auto-save on content/title change
  useEffect(() => {
    if (!activeNote) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    
    saveTimeout.current = setTimeout(async () => {
      if (!noteTitle.trim() || !noteContent || noteContent === '<p></p>') return;
      
      try {
        const res = await API.post(`/api/notes/save`, {
          noteId: activeNote._id,
          title: noteTitle,
          content: noteContent
        }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        // Update the notes list with the updated/saved note
        setNotes(prev => {
          const updatedNotes = [...prev];
          const idx = updatedNotes.findIndex(n => n._id === res.data._id);
          if (idx !== -1) {
            updatedNotes[idx] = res.data;
          } else {
            // If note doesn't exist in list, add it to the beginning
            updatedNotes.unshift(res.data);
          }
          return updatedNotes;
        });
        
        // Update activeNote with the saved data
        setActiveNote(res.data);
      } catch (err) {
        console.error("Auto-save error:", err);
      }
    }, 1000);
    
    return () => clearTimeout(saveTimeout.current);
  }, [noteContent, noteTitle, activeNote]);

  // Save on unmount (e.g., accidental close)
  useEffect(() => {
    return () => {
      if (activeNote) {
        axios.post(`${API_URL}/api/notes/save`, {
          noteId: activeNote._id,
          title: noteTitle,
          content: noteContent
        }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
      }
    };
  }, [activeNote, noteTitle, noteContent]);

  // Open note for editing
  const handleEditNote = (note) => {
    setActiveNote(note);
    setNoteTitle(note.title);
    setNoteContent(note.content);
  };

  // Delete note
  const handleDeleteNote = (noteId) => {
    axios.delete(`${API_URL}/api/notes/${noteId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).then(() => setNotes(notes.filter(n => n._id !== noteId)));
    if (activeNote && activeNote._id === noteId) handleNewNote();
  };

  // Add a CSS style to highlight the active note
  const activeNoteStyle = {
    backgroundColor: '#2a2a2a',
    color: '#47e584',
    borderLeft: '3px solid #47e584'
  };

  const refreshNotes = () => {
    fetchNotes(true);
  };

  const renderNotesSidebar = () => {
    if (notesLoading) {
      return (
        <div style={{padding: '10px', textAlign: 'center'}}>
          <div className="mini-spinner" style={{
            border: "4px solid #333",
            borderTop: "4px solid #47e584",
            borderRadius: "50%",
            width: 20,
            height: 20,
            animation: "spin 1s linear infinite",
            margin: "10px auto"
          }}></div>
          <p style={{color: 'gray'}}>Loading notes...</p>
        </div>
      );
    }
    
    if (notesError) {
      return (
        <div style={{padding: '10px', textAlign: 'center'}}>
          <p style={{color: '#ff6b6b'}}>Failed to load notes</p>
          <button onClick={refreshNotes} style={{
            background: 'transparent',
            border: '1px solid #47e584',
            color: '#47e584',
            borderRadius: '4px',
            padding: '4px 8px',
            cursor: 'pointer',
            fontSize: '12px',
            marginTop: '5px'
          }}>
            Retry
          </button>
        </div>
      );
    }
    
    if (!Array.isArray(notes) || notes.length === 0) {
      return (
        <div style={{padding: '10px', textAlign: 'center'}}>
          <p style={{color: 'gray'}}>No notes found</p>
          <button onClick={handleNewNote} style={{
            background: 'transparent',
            border: '1px solid #47e584',
            color: '#47e584',
            borderRadius: '4px',
            padding: '4px 8px',
            cursor: 'pointer',
            fontSize: '12px',
            marginTop: '5px'
          }}>
            Create First Note
          </button>
        </div>
      );
    }
    
    return (
      <>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 10px 5px',
          borderBottom: '1px solid #333'
        }}>
          <small style={{color: '#999'}}>
            {notes.length} note{notes.length !== 1 ? 's' : ''}
          </small>
          <button 
            onClick={refreshNotes}
            style={{
              background: 'none',
              border: 'none',
              color: '#47e584',
              cursor: 'pointer',
              fontSize: '11px',
              padding: 0
            }}
            title="Refresh Notes List"
          >
            ↻ Refresh
          </button>
        </div>
        {sortNotesByDate(notes).map((note, index) => (
          <div 
            key={note._id || index} 
            style={activeNote && activeNote._id === note._id ? activeNoteStyle : {}}
            className="note-title" 
            onClick={() => handleEdit(note)}
          >
            <div style={{
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              overflow: 'hidden'
            }}>
              <span style={{
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                maxWidth: '80%'
              }}>
                {note.title || "Untitled Note"}
              </span>
              <small style={{
                fontSize: '10px',
                color: '#888',
                whiteSpace: 'nowrap'
              }}>
                {new Date(note.updatedAt || note.createdAt).toLocaleDateString()}
              </small>
            </div>
          </div>
        ))}
      </>
    );
  };

  if (profileLoading) {
    return <Spinner />;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-body">
        <aside className="dashboard-sidebar">
          <div className="heading">
            <span className="warq-logo-container" style={{ fontSize: '36px' }}>WARQ</span>
            <div 
              ref={profileRef} 
              className="image-box" 
              style={{
                width: '36px', 
                height: '36px',
                position: 'relative',
                cursor: 'pointer'
              }}
              onMouseEnter={() => setShowProfileDropdown(true)}
            >
              <img src={profileButton} alt="Profile" className="info-image" />
              
              {/* Profile dropdown */}
              {showProfileDropdown && (
                <div 
                  className="profile-dropdown"
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    width: '260px',
                    backgroundColor: '#151515',
                    border: '1px solid #47e584',
                    borderRadius: '4px',
                    padding: '12px',
                    zIndex: 1000,
                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
                  }}
                >
                  <div style={{ marginBottom: '12px', borderBottom: '1px solid #333', paddingBottom: '8px' }}>
                    {editingName ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input
                          type="text"
                          value={newName}
                          onChange={e => setNewName(e.target.value)}
                          style={{
                            flex: 1,
                            padding: '4px 8px',
                            borderRadius: 4,
                            border: '1px solid #47e584',
                            background: '#222',
                            color: '#fff'
                          }}
                          maxLength={32}
                        />
                        <button onClick={handleNameSave} style={{
                          background: '#47e584',
                          color: '#151515',
                          border: 'none',
                          borderRadius: 4,
                          padding: '4px 10px',
                          cursor: 'pointer'
                        }}>Save</button>
                      </div>
                    ) : (
                      <h3 style={{ color: '#47e584', margin: '0 0 4px 0', fontSize: '16px', wordBreak: 'break-word', display: 'flex', alignItems: 'center', gap: 8 }}>
                        {user?.name || 'User'}
                        <button onClick={handleNameEdit} style={{
                          background: 'none',
                          border: 'none',
                          color: '#47e584',
                          cursor: 'pointer',
                          fontSize: 14,
                          marginLeft: 4
                        }} title="Edit Name">✏️</button>
                      </h3>
                    )}
                    <p style={{
                      color: '#ccc',
                      margin: '4px 0 0 0',
                      fontSize: '14px',
                      wordBreak: 'break-all',
                      overflowWrap: 'break-word'
                    }}>
                      {user?.email || 'No email available'}
                    </p>
                  </div>
                  
                  <div style={{ borderBottom: '1px solid #333', paddingBottom: '8px', marginBottom: '8px' }}>
                    <p style={{ color: '#999', margin: '4px 0', fontSize: '14px' }}>
                      <strong>Joined:</strong> {user ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                    <p style={{ color: '#999', margin: '4px 0', fontSize: '14px' }}>
                      <strong>Notes:</strong> {user?.progress?.notesCompleted?.length || 0} completed
                    </p>
                  </div>
                  
                  {profileError && <div style={{ color: 'red', fontSize: 13 }}>{profileError}</div>}
                  {profileSuccess && <div style={{ color: 'green', fontSize: 13 }}>{profileSuccess}</div>}
                  
                  <button 
                    onClick={handleLogout} 
                    style={{
                      backgroundColor: 'transparent',
                      border: '1px solid #47e584',
                      borderRadius: '4px',
                      color: '#47e584',
                      padding: '6px 12px',
                      margin: '8px 0 0 0',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      width: '100%'
                    }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="prev-notes">
            <div className="prev-notes-heading">
              <div>
                <img src={previousNotes} alt="Design Logo" className="widget" style={{width: '22px', height: '22px', marginRight: '10px'}} />
                Previous Notes
              </div>
              <div>
                <div 
                  className='icon-wrapper' 
                  style={{width: '48px', height: '48px', cursor: 'pointer'}} 
                  onClick={handleNewNote}
                  title="Create new note"
                >
                  <img src={newNote} alt="Create New Note" className="widget" style={{width: '26px', height: '26px'}} />
                </div>
              </div>
            </div>
            <div className="notes-scroll-wrapper">
              <div className="notes-content">
                {renderNotesSidebar()}
              </div>
            </div>
          </div>
          <div className="footing" style={{ 
            border: '2px solid #47e584', 
            backgroundColor: '#151515', 
            borderRadius: '10px', 
            color: 'gray', 
            display: 'flex', 
            alignItems: 'center', 
          }}>
            <div className="icon-wrapper">
              <img src={chatFeature} alt="Design Logo" className="widget" style={{width: '36px', height: '36px'}} />
            </div>
            <div className="icon-wrapper">
              <img src={aiFeature} alt="Design Logo" className="widget" style={{width: '36px', height: '36px'}} />
            </div>
            <div className="icon-wrapper">
              <img src={importFiles} alt="Design Logo" className="widget" style={{width: '36px', height: '36px'}} />
            </div>
          </div>
        </aside>
        <main className="dashboard-main">
          <div className="editor-wrapper">
            <div className="file-info" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <input
                type="text"
                placeholder="Title"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  outline: 'none',
                  flex: 1,
                  minWidth: 0
                }}
                maxLength={60}
              />
              <div className="save-text" onClick={handleCreateOrEditNote} style={{cursor: 'pointer', marginLeft: 16}}>Save</div>
            </div>

            <hr className="separator" />
            
            {error && <div style={{color: 'red', padding: '5px'}}>{error}</div>}

            {renderToolbar()}

            <div className="rich-text-editor dark-editor">
              <EditorContent editor={editor} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
