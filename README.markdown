# WARQ: Collaborative Study Environment

A full-stack web application designed to empower students to collaborate on study projects, share notes in real-time, generate AI-powered quizzes, chat, and manage group work. WARQ leverages a modern tech stack with real-time features and group management to enhance the collaborative learning experience.

---

## 🚀 Features

- **Study Groups**: Create and join study groups for collaborative learning.
- **Real-time Notes**: Create, edit, and share notes in real time (personal and group notes).
- **Group Invitations**: Invite users to groups, accept/decline invitations, and manage group membership with notifications.
- **Notifications**: Real-time notifications for invitations, file uploads, role changes, quiz assignments, and more.
- **AI-Powered Quizzes**: Generate quizzes from your notes to self-assess and reinforce learning.
- **File Upload**: Upload and manage files for each note (PDFs, images, docs, etc.).
- **Real-time Chat**: Group chat for each study group, with live updates and member presence.
- **Progress Tracking**: Dashboard to monitor your notes, group activity, and study progress.
- **Authentication**: Secure user authentication with Supabase Auth.
- **User Roles**: Admin, editor, viewer, and more for group management.
- **Responsive UI**: Modern, clean, and mobile-friendly interface.

---

## 🛠️ Tech Stack

**Frontend**:
- React.js (with custom hooks and context)
- Supabase JS Client (for auth, database, and real-time)
- HTML/CSS (custom, no Tailwind)
- Lucide React Icons
- react-hot-toast (notifications)

**Backend/Database**:
- Supabase (PostgreSQL, Auth, Storage, Realtime)
- Supabase Storage (file uploads)

**AI Integration**:
- (Planned) OpenAI API for note summarization and quiz generation

**Real-time Features**:
- Supabase Realtime (notes, chat, invitations, notifications)

**Deployment**:
- Frontend: Vercel/Netlify
- Backend: Supabase Cloud

---

## 📁 Project Structure

```
WARQ--A_Collaborative_Study_Environment/
├── frontend/
│   ├── public/                # Static assets
│   ├── src/
│   │   ├── assets/           # Images and icons
│   │   ├── components/       # Reusable UI components (Chat, Modal, Notification, etc.)
│   │   ├── hooks/            # Custom React hooks (e.g., useGroupInvitations)
│   │   ├── pages/            # Page components (Dashboard, Login, Signup, etc.)
│   │   ├── services/         # Supabase API wrappers (groupService, notificationService, etc.)
│   │   ├── utils/            # Utility functions
│   │   └── App.js            # Main React app
│   ├── package.json          # Frontend dependencies
│   └── ...
├── README.markdown           # Project documentation
```

---

## 🛠️ Setup Instructions

### 📦 1. Clone the Repository

```bash
git clone https://github.com/your-username/warq-collab-study.git
cd WARQ--A_Collaborative_Study_Environment
```

---

### 🔧 2. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `frontend/` directory:
   ```env
   REACT_APP_SUPABASE_URL=your_supabase_url
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. Start the frontend development server:
   ```bash
   npm start
   ```
   The frontend will run at `http://localhost:3000`.

---

## 🔗 Connecting to Supabase

The frontend uses the Supabase JS client for all authentication, database, and real-time features. Configure your Supabase project URL and anon key in the `.env` file as shown above.

---

## 👨‍💻 Team Roles

| Member             | Role                                |
|--------------------|-------------------------------------|
| Saqib Mahmood      | Backend, Supabase Integration, AI   |
| Ali Safdar Saeed   | Frontend, UI/UX, Chat, Group Logic  |
| Qurat-ul-Ain       | Auth, Group Features, Testing       |

---

## 📋 Features Status

- [x] Create and join study groups
- [x] Real-time collaborative notes (personal & group)
- [x] Group invitations with notifications
- [x] Accept/decline invitations and update group membership
- [x] Real-time notifications (all major events)
- [x] File upload and management
- [x] Real-time group chat
- [x] Progress dashboard
- [x] User roles and permissions
- [x] Responsive, modern UI
- [ ] AI-powered note summarization (planned)
- [ ] AI-powered quiz generator (planned)

---

## 📦 Required Dependencies

### Frontend
```bash
npm install react supabase @tiptap/react @tiptap/starter-kit lucide-react react-hot-toast
```

---

## 🚀 Deployment

- **Frontend**: Deploy to Vercel or Netlify for React hosting.
- **Backend**: Use Supabase Cloud for database, auth, and storage.
- Ensure environment variables are configured on the hosting platform.

---

## 📄 License

MIT © 2025 WARQ Collaborative Study Environment Team
