import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './components/dashboard/Dashboard';
import BookList from './components/books/BookList';
import BorrowingHistory from './components/borrowing/BorrowingHistory';
import ProtectedRoute from './components/common/ProtectedRoute';
import BookDetails from './components/books/BookDetails';

function App() {
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
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
