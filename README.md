# 🎓 NEx – Modern Educational Resource & Collaboration Platform

An open, collaborative full-stack educational platform built for students and educators to share study resources, collaborate in real-time, and manage academic content seamlessly.

---

## 🌟 Features

- **🔐 Authentication & Authorization**
  - Secure JWT-based user authentication (Register, Login, Profile management)
  - Role-Based Access Control (Student/User and Administrator roles)
  - Support for Google OAuth authentication

- **📚 Resource Sharing & Discovery**
  - Upload academic materials, documents, and notes
  - Categorized resource browsing and advanced keyword search
  - Rating, review, and feedback system on educational resources
  - Secure file handling and download capabilities

- **💬 Real-Time Collaboration & Chat**
  - Live discussion channels and study rooms powered by Socket.io
  - Instant messaging with fellow learners and educators

- **🛡️ Admin Management Dashboard**
  - Centralized dashboard for platform metrics and resource moderation
  - User and content oversight to maintain academic integrity

- **🎨 Modern, Responsive User Interface**
  - Fast single-page application built with React 19 and Vite
  - Styled with Tailwind CSS for clean mobile and desktop experiences
  - Intuitive navigation, interactive filters, and rich state management with Zustand

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Routing:** [React Router v7](https://reactrouter.com/)
- **State Management:** [Zustand](https://github.com/pmndrs/zustand)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Real-Time Client:** [Socket.io Client](https://socket.io/)
- **HTTP Client:** [Axios](https://axios-http.com/)
- **Icons:** [Lucide React](https://lucide.dev/)

### Backend
- **Runtime:** [Node.js](https://nodejs.org/)
- **Framework:** [Express 5](https://expressjs.com/)
- **Database:** [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/)
- **Real-Time Server:** [Socket.io](https://socket.io/)
- **Authentication:** [JSON Web Tokens (JWT)](https://jwt.io/) & [bcryptjs](https://github.com/dcodeIO/bcrypt.js)
- **File Uploads:** [Multer](https://github.com/expressjs/multer)

---

## 📂 Project Structure

```text
NEx/
├── Doc/
│   └── NEx_Documentation.pdf     # Platform documentation and architecture specs
├── backend/
│   ├── middleware/               # Auth and file upload middlewares
│   ├── models/                   # Mongoose schemas (User, Resource, Room, Message)
│   ├── routes/                   # API routes (auth, resources, admin)
│   ├── uploads/                  # Upload directory (git-ignored)
│   ├── .env.example              # Backend environment template
│   ├── package.json              # Backend dependencies and scripts
│   ├── seedAdmin.js              # Initial admin seeder script
│   └── server.js                 # Express server & Socket.io entry point
├── frontend/
│   ├── public/                   # Static assets and icons
│   ├── src/
│   │   ├── components/           # Reusable UI components (Navbar, Cards, Modals)
│   │   ├── contexts/             # Zustand stores (Auth, Resources, Chat)
│   │   ├── pages/                # Views (Home, Search, Upload, Chat, Admin, etc.)
│   │   ├── utils/                # Axios instance and helpers
│   │   ├── App.jsx               # Main application routing
│   │   └── main.jsx              # React DOM entry point
│   ├── .env.example              # Frontend environment template
│   ├── package.json              # Frontend dependencies and scripts
│   └── vite.config.js            # Vite build configuration
├── .gitignore                    # Global repository gitignore
└── README.md                     # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your system:
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [MongoDB](https://www.mongodb.com/) (running locally or a MongoDB Atlas connection URI)
- [Git](https://git-scm.com/)

---

### Installation & Setup

#### 1. Clone the repository
```bash
git clone https://github.com/nahom-je/NEx-education-platform.git
cd NEx
```

#### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create your `.env` file from the template:
   ```bash
   cp .env.example .env
   ```
4. Configure your `.env` variables:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/NEx
   JWT_SECRET=your_jwt_secret_key_here
   NODE_ENV=development
   ```
5. *(Optional)* Seed initial admin user:
   ```bash
   node seedAdmin.js
   ```
6. Start the backend development server:
   ```bash
   npm run dev
   # or
   npm start
   ```
   The backend API will run on `http://localhost:5000`.

---

#### 3. Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create your `.env` file from the template:
   ```bash
   cp .env.example .env
   ```
4. Verify your `.env` variables:
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_SOCKET_URL=http://localhost:5000
   ```
5. Start the frontend development server:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:5173`.

---

## 🔑 Environment Variables Reference

### Backend (`backend/.env`)
| Variable | Description | Default |
|---|---|---|
| `PORT` | Port for Express server | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/NEx` |
| `JWT_SECRET` | Secret key for signing JWT tokens | `your_jwt_secret_key_here` |
| `NODE_ENV` | Application environment (`development` / `production`) | `development` |

### Frontend (`frontend/.env`)
| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | Base endpoint for the backend REST API | `http://localhost:5000/api` |
| `VITE_SOCKET_URL` | Endpoint for Socket.io real-time connection | `http://localhost:5000` |

---

## 📜 Scripts Reference

### Backend
- `npm start` – Run backend server in production mode
- `npm run dev` – Run backend server in development mode

### Frontend
- `npm run dev` – Launch Vite development server with HMR
- `npm run build` – Build production-ready frontend bundle in `frontend/dist`
- `npm run preview` – Locally preview production build
- `npm run lint` – Run ESLint checks

---

## 📄 Documentation

For full architecture details, data flows, and use case diagrams, refer to the documentation file located at [`Doc/NEx_Documentation.pdf`](./Doc/NEx_Documentation.pdf).

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
