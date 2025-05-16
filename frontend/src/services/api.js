import axios from "axios";

// Create configurable API instance
const createAPI = (token = null) => {
  const instance = axios.create({
    baseURL: (process.env.REACT_APP_API_URL || 'http://localhost:5001') + "/api"
  });

  // Set up request interceptor for authentication
  instance.interceptors.request.use(
    (config) => {
      // Use the provided token first, fall back to localStorage
      const authToken = token || localStorage.getItem('token');
      if (authToken) {
        config.headers['Authorization'] = `Bearer ${authToken}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Add response interceptor to handle errors
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      // Handle auth errors
      if (error.response && error.response.status === 401) {
        console.warn('Authentication error, you might need to log in again');
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

// Default instance (will use localStorage token)
const API = createAPI();

// Allow creating a configured instance with specific token
export const getConfiguredAPI = (token) => createAPI(token);

// Example: Auth
// Enhanced login to support Supabase token
export const login = (email, password, token) =>
  API.post("/auth/login", { email, password, token });

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

