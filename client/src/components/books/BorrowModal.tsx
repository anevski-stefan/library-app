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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/borrows', {
        bookId,
        returnDate: new Date(returnDate)
      });
      onSuccess();
    } catch (error) {
      console.error('Error borrowing book:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Borrow Book</h2>
        <p className="mb-4">Book: {bookTitle}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Return Date
            </label>
            <input
              type="date"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              required
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md"
            >
              Borrow
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BorrowModal; 