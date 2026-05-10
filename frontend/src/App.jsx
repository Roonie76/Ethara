import { Routes, Route, Navigate } from 'react-router-dom';
import { useApp } from './context/AppContext';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import AppLayout from './components/layout/AppLayout';
import DashboardPage from './pages/DashboardPage';
import ProjectsPage from './pages/ProjectsPage';
import TasksPage from './pages/TasksPage';
import MembersPage from './pages/MembersPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import './App.css';

function App() {
  const { currentUser, loading } = useApp();

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--gray-50)' }}>
      <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid var(--blue)', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
    </div>
  );

  return (
    <Routes>
      <Route path="/login" element={!currentUser ? <LoginPage /> : <Navigate to="/" />} />
      <Route path="/signup" element={!currentUser ? <SignupPage /> : <Navigate to="/" />} />

      <Route element={currentUser ? <AppLayout /> : <Navigate to="/login" />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/members" element={<MembersPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
