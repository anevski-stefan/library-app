import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { resetPassword } from '../../features/auth/authSlice';

const ResetPasswordForm = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState('');
  const navigate = useNavigate();
  const { token } = useParams();
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    // Basic JWT expiration check
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          setValidationError('Reset token has expired. Please request a new one.');
          setTimeout(() => navigate('/forgot-password'), 3000);
        }
      }
    } catch (error) {
      console.error('Error checking token:', error);
    }
  }, [token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (newPassword !== confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setValidationError('Password must be at least 6 characters long');
      return;
    }

    try {
      const result = await dispatch(resetPassword({ 
        token: token!, 
        newPassword 
      })).unwrap();
      
      alert('Password reset successful! Please login with your new password.');
      navigate('/login');
    } catch (error: any) {
      console.error('Reset password error details:', error);
      setValidationError(
        error?.message || 
        error?.response?.data?.message || 
        'Failed to reset password. Please try again.'
      );
    }
  };

  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 space-y-6">
          <div className="flex flex-col items-center">
            <BookOpen className="h-12 w-12 text-amber-600" />
            <h2 className="mt-4 text-3xl font-bold text-amber-800">Set New Password</h2>
            <p className="mt-2 text-amber-700 text-center">
              Please enter your new password
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-amber-700">
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                required
                className="mt-1 block w-full px-3 py-2 bg-amber-50 border border-amber-300 rounded-md text-sm shadow-sm placeholder-amber-400
                         focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-amber-700">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                className="mt-1 block w-full px-3 py-2 bg-amber-50 border border-amber-300 rounded-md text-sm shadow-sm placeholder-amber-400
                         focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordForm; 