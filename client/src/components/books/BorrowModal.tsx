import { useState } from 'react';
import api from '../../services/api';

interface BorrowModalProps {
  bookId: string;
  bookTitle: string;
  onSuccess: () => void;
  onClose: () => void;
}

const BorrowModal = ({ bookId, bookTitle, onSuccess, onClose }: BorrowModalProps) => {
  const [returnDate, setReturnDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await api.post('/borrows', {
        bookId,
        returnDate: new Date(returnDate)
      });
      onSuccess();
    } catch (error: any) {
      console.error('Borrow error:', error.response?.data);
      const errorMessage = error.response?.data?.message 
        || 'Error borrowing book. Please try again.';
      setError(`${errorMessage} ${error.response?.status === 403 ? 
        '(Permission denied - contact administrator)' : ''}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Borrow Book</h2>
        <p className="mb-6">Book: {bookTitle}</p>
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg">
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Return Date
            </label>
            <input
              type="date"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              className="appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-indigo-500 transition duration-300"
              required
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div className="flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="text-gray-600 hover:text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300 transform hover:scale-105 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Borrowing...' : 'Borrow'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BorrowModal; 