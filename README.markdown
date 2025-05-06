# Student Collaborative Study Platform

A full-stack web application designed to empower students to collaborate on study projects, share notes in real-time, generate AI-powered flashcards and quizzes, and communicate via integrated tools. The platform combines a modern tech stack with real-time features and AI integration to enhance the collaborative learning experience.

---

## 🚀 Features

- **Study Projects**: Create and join study groups for collaborative learning.
- **Real-time Collaboration**: Share and annotate notes/documents instantly.
- **AI-Powered Tools**:
  - Summarize notes using OpenAI integration.
  - Generate flashcards and quizzes for efficient studying.
- **Communication**: Real-time chatroom for group discussions (planned).
- **Progress Tracking**: Dashboard to monitor project and study progress.
- **Authentication**: Secure user authentication with Firebase Auth.
- **File Upload**: Upload and annotate study materials.

---

## 🛠️ Tech Stack

**Frontend**:
- React.js (Next.js for enhanced routing and SSR)
- Axios (API calls)
- HTML/CSS
- Tailwind CSS (styling)
- Geist font (via Next.js font optimization)

**Backend**:
- Node.js
- Express.js
- MongoDB (data storage)
- Firebase Admin SDK (authentication and real-time features)

**AI Integration**:
- OpenAI API (note summarization, flashcard/quiz generation)

**Real-time Features**:
- Firebase Auth
- Firebase Cloud Messaging (planned for notifications)

**Deployment**:
- Frontend: Vercel/Netlify
- Backend: Render/Heroku

---

## 📁 Project Structure

```
student-collab-platform/
├── backend/                    # Express server & API
│   ├── controllers/            # API logic
│   ├── models/                 # MongoDB schemas (e.g., User, Note)
│   ├── routes/                 # API endpoints
│   ├── firebase/               # Firebase configuration
│   ├── config/                 # Database and environment setup
│   ├── middleware/             # Authentication and error handling
│   ├── .env                    # Environment variables
│   ├── server.js               # Main server file
│   └── package.json            # Backend dependencies
├── frontend/                   # Next.js/React app
│   ├── app/                    # Next.js pages and routing
│   ├── public/                 # Static assets
│   ├── src/                    # React source code
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Page components
│   │   ├── services/           # Axios API wrapper
│   │   └── App.js              # Main React app
│   ├── .env                    # Frontend environment variables
│   └── package.json            # Frontend dependencies
├── README.md                   # Project documentation
```

---

## 🛠️ Setup Instructions

### 📦 1. Clone the Repository

```bash
git clone https://github.com/your-username/student-collab-platform.git
cd student-collab-platform
```

---

### 🔧 2. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend/` directory:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_uri
   FIREBASE_PROJECT_ID=your_firebase_project_id
   ```
4. Add your Firebase Admin SDK JSON file (`firebaseServiceKey.json`) to `backend/firebase/`. Ensure this file is not committed to the public repository.
5. Start the backend server:
   ```bash
   npm start
   ```
   The backend will run at `http://localhost:5000`.

---

### 🎨 3. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `frontend/` directory:
   ```env
   REACT_APP_API_URL=http://localhost:5000
   ```
4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   The frontend will run at `http://localhost:3000`.

---

## 🔗 Connecting Frontend to Backend

The frontend uses Axios to communicate with the backend. Configure the API wrapper in `frontend/src/services/api.js`:

```javascript
import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL + '/api'
});

export default API;
```

---

## 👨‍💻 Team Roles

| Member             | Role                                |
|--------------------|-------------------------------------|
| Saqib Mahmood      | Backend Dev, React Integration, AI  |
| Ali Safdar Saeed   | Frontend Dev (HTML/CSS/React)       |
| Qura tul Ain       | Firebase Auth & Firestore           |

---

## 📋 Features Status

- [x] Create and join study projects
- [ ] AI-powered note summarization
- [ ] Flashcard and quiz generator
- [ ] Firebase Auth integration
- [ ] Real-time chatroom
- [ ] Upload and annotate notes/documents
- [ ] Progress tracking dashboard

---

## 📦 Required Dependencies

### Backend
```bash
npm install express mongoose dotenv cors firebase-admin
npm install --save-dev nodemon
```

### Frontend
```bash
npm install axios next react react-dom tailwindcss
```

---

## 🚀 Deployment

- **Frontend**: Deploy to Vercel or Netlify for Next.js hosting.
- **Backend**: Deploy to Render or Heroku for Node.js hosting.
- Ensure environment variables are configured on the hosting platform.

For Next.js deployment on Vercel, follow the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying).

---

## 📄 License

MIT © 2025 Student Collaborative Study Platform Team