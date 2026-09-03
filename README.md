# 🏫 IIIT Pune Campus Connect

A full-stack **Smart Campus Administration Platform** for IIIT Pune featuring real-time emergency response, attendance management, and campus safety tools.

## ✨ Features

- **🚨 Emergency Response System** — Real-time emergency reporting with Socket.IO-powered live updates
- **📍 Live Location Tracking** — Interactive maps with Leaflet for campus emergency visualization
- **👥 Responder Management** — Assign and manage security/admin responders to incidents
- **📊 Analytics Dashboard** — Visual analytics with Recharts for campus safety insights
- **📋 Attendance Management** — Track and manage student/faculty attendance
- **🔐 Role-Based Access** — JWT authentication with Admin, Security, Student, and Faculty roles
- **⚡ Real-Time Notifications** — WebSocket-based instant alerts and escalation service
- **📱 Responsive Design** — Modern UI built with React + Tailwind CSS

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite, Tailwind CSS |
| **Backend** | Node.js, Express.js |
| **Database** | Prisma ORM (SQLite/PostgreSQL) |
| **Real-Time** | Socket.IO |
| **Maps** | Leaflet + React-Leaflet |
| **Charts** | Recharts |
| **Auth** | JWT + bcrypt |

## 📁 Project Structure

```
IIIT-Pune-Campus-Connect/
├── backend/
│   ├── middleware/       # Auth & validation middleware
│   ├── prisma/           # Database schema & seed data
│   ├── routes/           # API route handlers
│   ├── services/         # Background services (escalation)
│   └── server.js         # Express + Socket.IO entry point
├── frontend/
│   ├── public/           # Static assets
│   └── src/
│       ├── components/   # Reusable UI components
│       ├── context/      # React context (Auth, Socket)
│       └── pages/        # Page-level components
└── package.json          # Root monorepo scripts
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/harshit24nagpal-dotcom/IIIT-Pune-Campus-Connect.git
   cd IIIT-Pune-Campus-Connect
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install

   # Install backend dependencies
   cd backend && npm install

   # Install frontend dependencies
   cd ../frontend && npm install
   ```

3. **Set up the database**
   ```bash
   cd backend
   npx prisma generate
   npx prisma db push
   npm run db:seed
   ```

4. **Configure environment** (create `backend/.env`)
   ```env
   DATABASE_URL="file:./dev.db"
   JWT_SECRET="your-secret-key"
   PORT=5000
   ```

### Running the App

```bash
# From the root directory — starts both frontend & backend
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |
| GET | `/api/emergencies/active` | Active emergency alerts |
| POST | `/api/emergencies` | Report new emergency alert |
| GET/POST | `/api/attendance/*` | Class attendance sheets, section rosters & advisor alerts |
| GET/POST | `/api/registration/*` | Semester registration submission, Warden & Advisor clearance |
| GET/POST | `/api/nodues/*` | 15-Department clearance matrix, officer verification & certificate generation |
| POST | `/api/files/upload` | Document upload for registration proofs |

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is developed as part of coursework at **IIIT Pune**.

---

**Built with ❤️ by [Harshit Nagpal](https://github.com/harshit24nagpal-dotcom)**
