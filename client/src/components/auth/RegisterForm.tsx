import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { BookOpen } from 'lucide-react';

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const { confirmPassword, ...registrationData } = formData;
      const response = await api.post('/auth/register', registrationData);
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Registration failed:', error);
      setError(error.response?.data?.message || 'Registration failed');
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
              Create your library account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-amber-700">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder="Enter your first name"
                  required
                  className="mt-1 block w-full px-3 py-2 bg-amber-50 border border-amber-300 rounded-md text-sm shadow-sm placeholder-amber-400
                           focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  value={formData.firstName}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-amber-700">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="Enter your last name"
                  required
                  className="mt-1 block w-full px-3 py-2 bg-amber-50 border border-amber-300 rounded-md text-sm shadow-sm placeholder-amber-400
                           focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-amber-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 block w-full px-3 py-2 bg-amber-50 border border-amber-300 rounded-md text-sm shadow-sm placeholder-amber-400
                         focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                placeholder="Enter your email address"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-amber-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                required
                className="mt-1 block w-full px-3 py-2 bg-amber-50 border border-amber-300 rounded-md text-sm shadow-sm placeholder-amber-400
                         focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-amber-700">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                required
                className="mt-1 block w-full px-3 py-2 bg-amber-50 border border-amber-300 rounded-md text-sm shadow-sm placeholder-amber-400
                         focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
              >
                Create Account
              </button>
            </div>
          </form>
        </div>
        <div className="px-6 py-4 bg-amber-100 border-t border-amber-200">
          <Link to="/login" className="text-sm text-amber-600 hover:text-amber-500">
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm; 