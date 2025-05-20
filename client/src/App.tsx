import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MainLayout from './components/layouts/MainLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import TemplatesPage from './pages/TemplatesPage';
import CreateTemplatePage from './pages/CreateTemplatePage';
import EditTemplatePage from './pages/EditTemplatePage';
import ViewTemplatePage from './pages/ViewTemplatePage';
import ReportsPage from './pages/ReportsPage';
import ViewReportPage from './pages/ViewReportPage';
import GenerateReportPage from './pages/GenerateReportPage';
import DocumentStylePage from './pages/DocumentStylePage';
import FormattingPresetsPage from './pages/FormattingPresetsPage';
import SettingsPage from './pages/SettingsPage';
import ChatsPage from './pages/ChatsPage';
import ChatWindow from './components/chat/ChatWindow';
import './theme.css';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          <Route element={<MainLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/templates" element={<TemplatesPage />} />
            <Route path="/templates/new" element={<CreateTemplatePage />} />
            <Route path="/templates/:id/edit" element={<EditTemplatePage />} />
            <Route path="/templates/:id" element={<ViewTemplatePage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/generate" element={<GenerateReportPage />} />
            <Route path="/document-style" element={<DocumentStylePage />} />
            <Route path="/formatting-presets" element={<FormattingPresetsPage />} />
            <Route path="/reports/:id" element={<ViewReportPage />} />
            <Route path="/chats" element={<ChatsPage />} />
            <Route path="/chats/:chatId" element={<ChatWindow />} />
            <Route path="/settings" element={<SettingsPage />} /> 
          </Route>
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;