
import React, { useState } from 'react';
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

function Dashboard() {
  const [selectedColor, setSelectedColor] = useState(null);
  const [showColors, setShowColors] = useState(false);

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

  const handleCreateOrEditNote = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingNoteId) {
        await editNote(editingNoteId, { title: noteTitle, content: noteContent });
        setNotes(notes.map(n => n._id === editingNoteId ? { ...n, title: noteTitle, content: noteContent } : n));
        setEditingNoteId(null);
      } else {
        const res = await createNote({ title: noteTitle, content: noteContent });
        setNotes([...notes, res.data]);
      }
      setNoteTitle('');
      setNoteContent('');
    } catch (err) {
      setError('Failed to save note.');
    }
  };

  const handleEdit = (note) => {
    setEditingNoteId(note._id);
    setNoteTitle(note.title);
    setNoteContent(note.content);
  };

  const handleDelete = async (noteId) => {
    try {
      await deleteNote(noteId);
      setNotes(notes.filter(n => n._id !== noteId));
    } catch {
      setError('Failed to delete note.');
    }
  };

  const handleMarkCompleted = async (noteId) => {
    try {
      await markNoteCompleted({ noteId });
      setNotes(notes.map(n => n._id === noteId ? { ...n, completed: true } : n));
    } catch {
      setError('Failed to mark as completed.');
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setProjectError('');
    try {
      const res = await createProject({ name: projectName });
      setProjects([...projects, res.data]);
      setProjectName('');
    } catch {
      setProjectError('Failed to create project.');
    }
  };

  const handleJoinProject = async (projectId) => {
    setProjectError('');
    try {
      await joinProject({ projectId });
      setProjectError('Joined project!');
    } catch {
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
    } catch {
      setFileUploadError('Failed to upload file.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
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
      setQuizzes(res.data);
    } catch {
      setQuizzes([]);
    }
  };

  const handleQuizOptionChange = (idx, value) => {
    setQuizOptions(quizOptions.map((opt, i) => i === idx ? value : opt));
  };

  const handleQuizSubmit = async (quizId, selected) => {
    try {
      const res = await submitQuiz({ quizId, selected });
      setQuizResult(res.data.result || 'Submitted!');
    } catch {
      setQuizResult('Submission failed.');
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-body">
        <aside className="dashboard-sidebar">

          <div className="heading">
            <span className="warq-logo-container" style={{ fontSize: '36px' }}>WARQ</span>
            <div className="image-box" style={{ width: '36px', height: '36px' }}>
              <img src={profileButton} alt="Icon" className="info-image" />

            </div>
          </div>
<div className="prev-notes">
  <div className="prev-notes-heading">
  <div>
    <img src={previousNotes} alt="Design Logo" className="widget" style={{width: '22px', height: '22px', marginRight: '10px'}} />
    Previous Notes
  </div>
  <div>
    <div className='icon-wrapper' style={{width: '48px', height: '48px'}}>
    <img src={newNote} alt="Design Logo" className="widget" style={{width: '26px', height: '26px'}} />
    </div>
  </div>
</div>
  <div className="notes-scroll-wrapper">
    <div className="notes-content">
      {[
        'Introduction to Binary Language',
        'History of Computing',
        'React State vs Props in Depth',
        'Understanding MongoDB Schema Design',
        'Building REST APIs with Node.js',
        'Authentication in MERN Stack',
        'Async JavaScript: Promises and Async/Await',
        'Data Structures Overview',
        'Sorting Algorithms Comparison',
        'Deploying Apps with Vercel',
        'Authentication in MERN Stack',
        'Advanced CSS Grid Techniques',
        'Web Security Best Practices',
        'GraphQL vs REST API Design',
        'Mobile-First Responsive Design',
        'Testing React Applications',
        'JavaScript Design Patterns',
        'Cloud Deployment Strategies',
        'Machine Learning Basics',
        'Blockchain Fundamentals'
      ].map((title, index) => (
        <div key={index} className="note-title">
          {title}
        </div>
      ))}
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
            <div className="file-info">
              <div className="file-name">File Name: My Note</div>
              <div className="save-text">Save</div>
            </div>

            <hr className="separator" />

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
