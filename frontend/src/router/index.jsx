import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Dashboard from '../pages/Dashboard';
import TasksPage from '../pages/TasksPage';
import TaskCompleted from '../pages/TaskCompleted';
import Projects from '../pages/Projects';
import Calendar from '../pages/Calendar';
import Reports from '../pages/Reports';
import Settings from '../pages/Settings';
import Profile from '../pages/Profile';
import TaskControlPage from '../pages/TaskControlPage';
import UserManagement from '../pages/UserManagement';
import Chat from '../pages/Chat';
import LoginPage from '../pages/LoginPage';
import ProtectedRoute from '../components/common/ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute requireAuth={true}>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'tasks/not-started',
        element: <TasksPage />,
      },
      {
        path: 'tasks/in-progress',
        element: <TasksPage />,
      },
      {
        path: 'tasks/overdue',
        element: <TasksPage />,
      },
      {
        path: 'tasks/completed',
        element: <TaskCompleted />,
      },
      // Redirects for backward compatibility
      {
        path: 'tasks/today',
        element: <Navigate to="/tasks/not-started" replace />,
      },
      {
        path: 'tasks/upcoming',
        element: <Navigate to="/tasks/in-progress" replace />,
      },
      {
        path: 'projects',
        element: <Projects />,
      },
      {
        path: 'user-management',
        element: (
          <ProtectedRoute requireAdmin={true}>
            <UserManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: 'calendar',
        element: <Calendar />,
      },
      {
        path: 'chat',
        element: <Chat />,
      },
      {
        path: 'reports',
        element: <Reports />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
      {
        path: 'profile',
        element: <Profile />,
      },
      {
        path: 'admin/task-control',
        element: (
          <ProtectedRoute requireAdmin={true}>
            <TaskControlPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: '/dashboard',
    element: <Navigate to="/" replace />,
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
]);