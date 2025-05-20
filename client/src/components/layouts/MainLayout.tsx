import React, { useEffect } from 'react';
import { Outlet, useNavigate, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../utils/auth';
import { Button } from '../ui';
import {
  Home,
  File,
  FileText,
  Settings,
  LogOut,
  Menu,
  Bot,
} from 'lucide-react';

const MainLayout: React.FC = () => {
  const { status, user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (status === 'loading') {
      useAuth.getState().checkAuth();
    }
  }, [status]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };


  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold">Report Generator</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link to="/">
            <Button variant="ghost" className="w-full justify-start">
              <Home className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </Link>
          <Link to="/templates">
            <Button variant="ghost" className="w-full justify-start">
              <File className="mr-2 h-4 w-4" />
              Templates
            </Button>
          </Link>
          <Link to="/reports">
            <Button variant="ghost" className="w-full justify-start">
              <FileText className="mr-2 h-4 w-4" />
              Reports
            </Button>
          </Link>
          <Link to="/chats">
            <Button variant="ghost" className="w-full justify-start">
              <Bot className="mr-2 h-4 w-4" />
              Chat AI
            </Button>
          </Link>
          <Link to="/settings">
            <Button variant="ghost" className="w-full justify-start">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </Link>
        </nav>
        <div className="p-4 border-t">
          <Button 
            variant="ghost" 
            className="w-full justify-start"
            onClick={() => {
              // Handle logout
              navigate('/login');
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-background border-b p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Report Generator</h1>
          <Button variant="ghost" size="icon">
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-4 md:p-6 pt-20 md:pt-6">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;