import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../store/hooks';
import { login } from '../../features/auth/authSlice';
import { BookOpen } from 'lucide-react';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const resultAction = await dispatch(login({ email, password })).unwrap();
      console.log('Login successful:', resultAction);
      
      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      console.error('Login failed:', error);
      setError(error.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 space-y-6">
          <div className="flex flex-col items-center">
            <BookOpen className="h-12 w-12 text-amber-600" />
            <h2 className="mt-4 text-3xl font-bold text-amber-800">BookHive</h2>
            <p className="mt-2 text-amber-700 text-center">
              Enter your email and password to access your library card
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-amber-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                className="mt-1 block w-full px-3 py-2 bg-amber-50 border border-amber-300 rounded-md text-sm shadow-sm placeholder-amber-400
                         focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-amber-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                className="mt-1 block w-full px-3 py-2 bg-amber-50 border border-amber-300 rounded-md text-sm shadow-sm placeholder-amber-400
                         focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
              >
                Sign in
              </button>
            </div>
          </form>
        </div>

        <div className="px-6 py-4 bg-amber-100 border-t border-amber-200">
          <a href="#" className="text-sm text-amber-600 hover:text-amber-500">
            Forgot your password?
          </a>
        </div>
      </div>
    </div>
  );
};

export default LoginForm; 