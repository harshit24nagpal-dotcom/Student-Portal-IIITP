import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Navigation from './components/Navigation';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import ResponderDashboard from './pages/ResponderDashboard';
import AdminDashboard from './pages/AdminDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import WardenDashboard from './pages/WardenDashboard';
import ClearanceOfficerDashboard from './pages/ClearanceOfficerDashboard';
import { Shield } from 'lucide-react';
import './App.css';

function MainLayout() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 font-sans text-slate-800 gap-3.5">
        <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm animate-pulse text-[#1c398e]">
          <Shield className="w-8 h-8 animate-spin text-[#5367c8]" />
        </div>
        <p className="text-xs uppercase font-semibold tracking-wider text-slate-500">
          Loading Campus Portal...
        </p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const renderDashboard = () => {
    switch (user.role) {
      case 'ADMIN':
      case 'SECURITY':
        return <AdminDashboard defaultTab={activeTab === 'dashboard' ? 'live' : activeTab} />;
      case 'RESPONDER':
        return <ResponderDashboard />;
      case 'FACULTY':
      case 'FACULTY_ADVISOR':
        return <FacultyDashboard />;
      case 'HOSTEL_WARDEN':
        return <WardenDashboard />;
      case 'CLEARANCE_OFFICER':
        return <ClearanceOfficerDashboard />;
      case 'STUDENT':
      default:
        return <StudentDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 w-full bg-slate-50">
        {renderDashboard()}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <MainLayout />
      </SocketProvider>
    </AuthProvider>
  );
}
