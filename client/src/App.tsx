import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginForm from './components/auth/LoginForm';
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './components/dashboard/Dashboard';
import BookList from './components/books/BookList';
import BorrowingHistory from './components/borrowing/BorrowingHistory';
import ProtectedRoute from './components/common/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="books" element={<BookList />} />
          <Route path="borrowing-history" element={<BorrowingHistory />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
