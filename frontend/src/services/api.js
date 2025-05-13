import axios from "axios";

const API = axios.create({
  baseURL: (process.env.REACT_APP_API_URL || 'http://localhost:5001') + "/api"
});

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Example: Auth
export const login = (email, password) =>
  API.post("/auth/login", { email, password });

// Example: Signup
export const signup = ({ username, email, password }) =>
  API.post("/auth/signup", { username, email, password });

// Example: Get Projects
export const getProjects = () => API.get("/projects");

// Projects
export const getUserProjects = () => API.get('/projects');
export const createProject = (data) => API.post('/projects', data);
export const joinProject = (data) => API.post('/projects/join', data);
export const setProjectRole = (data) => API.post('/projects/set-role', data);
export const inviteToProject = (data) => API.post('/projects/invite', data);

// Notes
export const getNotes = () => API.get('/notes');
export const getNoteById = (noteId) => API.get(`/notes/${noteId}`);
export const createNote = (data) => API.post('/notes', data);
export const editNote = (noteId, data) => API.put(`/notes/${noteId}`, data);
export const deleteNote = (noteId) => API.delete(`/notes/${noteId}`);
export const markNoteCompleted = (data) => API.post('/notes/complete', data);
export const addFileToNote = (noteId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return API.post(`/notes/${noteId}/files`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};
export const subscribeToNote = (data) => API.post('/notes/subscribe', data);
export const unsubscribeFromNote = (data) => API.post('/notes/unsubscribe', data);

// User
export const getUserProfile = () => API.get('/auth/me');

// Quizzes
export const createQuiz = (data) => API.post('/notes/quiz', data);
export const getQuizzesForNote = (noteId) => API.get(`/notes/${noteId}/quizzes`);
export const submitQuiz = (data) => API.post('/notes/quiz/submit', data);

// Add more API functions as needed...
export default API;

