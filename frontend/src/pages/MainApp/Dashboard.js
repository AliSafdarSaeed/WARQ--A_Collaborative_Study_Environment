import React, { useEffect, useState, useRef } from 'react';
import './Dashboard.css';
import profileButton from '../../assets/user-profile.png';
import { getProjects, getNotes, createNote, editNote, deleteNote, markNoteCompleted, getUserProjects, createProject, joinProject, addFileToNote, getUserProfile, createQuiz, getQuizzesForNote, submitQuiz } from '../../services/api';

function Dashboard() {
  const [content, setContent] = useState('');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const editorRef = useRef(null);

  const [notes, setNotes] = useState([]);
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

  useEffect(() => {
    // Example: Fetch projects from backend
    getProjects()
      .then(res => setProjects(res.data))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));

    getNotes()
      .then(res => setNotes(res.data))
      .catch(() => setNotes([]))
      .finally(() => setNotesLoading(false));

    getUserProfile().then(res => setUser(res.data.data)).catch(() => setUser(null));
  }, []);

  const handleInput = () => {
    setContent(editorRef.current.innerText);
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
                <span className="warq-logo-container" style={{ fontSize: '36px'}}>WARQ</span>
                <div className="image-box" style={{width: '36px', height:'36px'}} >
                                <img src={profileButton} alt="Icon" className="info-image" />
                              </div>
            </div>
            {user && (
              <div style={{margin:'16px 0', color:'#333'}}>
                <b>{user.username || user.name}</b><br/>
                <span>{user.email}</span>
              </div>
            )}
            <button onClick={handleLogout} style={{margin:'8px 0'}}>Logout</button>
            <div className="prev-notes">
                <div className='heading'  style={{borderBottom: '2px solid #444',paddingLeft: '15px', paddingRight: '5px',
                    fontSize: '22px', fontWeight: '500', color: 'gray'}}>
                
                    Previous Notes</div>
            </div>
            <div className="footing" style={{border: '3px solid #444', borderRadius: '10px', color: 'gray'}}>
                Features Buttons here.
            </div>
        </aside>
        <main className="dashboard-main">
          <div className="editor-wrapper">
            <div className="file-info">
              <div className="file-name">File Name: My Note</div>
              <div className="save-text">Save</div>
            </div>

            <hr className="separator" />

            <div
              className="rich-text-editor"
              contentEditable
              ref={editorRef}
              data-placeholder="Start typing your notes here..."
              suppressContentEditableWarning={true}
              onInput={handleInput}
            ></div>
            {/* Removed My Projects and My Notes sections as requested */}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
