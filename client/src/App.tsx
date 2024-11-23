import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './components/dashboard/Dashboard';
import BookList from './components/books/BookList';
import BorrowingHistory from './components/borrowing/BorrowingHistory';
import ProtectedRoute from './components/common/ProtectedRoute';
import BookDetails from './components/books/BookDetails';
import { useAppSelector } from './store/hooks';
import { wsService } from './services/websocket';
import RequestsPage from './components/requests/RequestsPage';

function App() {
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (user) {
      wsService.connect(user.id);
    }

    return () => {
      wsService.disconnect();
    };
  }, [user]);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
        
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="books" element={<BookList />} />
          <Route path="borrowing-history" element={<BorrowingHistory />} />
          <Route path="books/:id" element={<BookDetails />} />
          <Route 
            path="/requests" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <RequestsPage />
              </ProtectedRoute>
            } 
          />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
