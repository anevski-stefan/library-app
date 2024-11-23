import { useState } from 'react';
import api from '../../services/api';
import { showNotification } from '../../services/notificationService';

interface RequestBookModalProps {
  bookTitle: string;
  bookAuthor: string;
  onSuccess: () => void;
  onClose: () => void;
}

const RequestBookModal = ({ bookTitle, bookAuthor, onSuccess, onClose }: RequestBookModalProps) => {
  const [title, setTitle] = useState(bookTitle);
  const [author, setAuthor] = useState(bookAuthor);
  const [externalLink, setExternalLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.post('/book-requests', {
        title,
        author,
        external_link: externalLink,
      });
      onSuccess();
      showNotification({
        title: 'Book Request Submitted',
        message: `Your request for "${title}" has been submitted successfully.`,
        type: 'book_request',
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Request Book</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Book Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={Boolean(bookTitle)}
              required
              className={`w-full px-3 py-2 border rounded-md ${
                Boolean(bookTitle) ? 'bg-gray-100' : 'bg-white'
              }`}
              placeholder="Enter book title"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Author
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              disabled={Boolean(bookAuthor)}
              required
              className={`w-full px-3 py-2 border rounded-md ${
                Boolean(bookAuthor) ? 'bg-gray-100' : 'bg-white'
              }`}
              placeholder="Enter author name"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Goodreads/Amazon Link (Optional)
            </label>
            <input
              type="url"
              value={externalLink}
              onChange={(e) => setExternalLink(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          {error && (
            <div className="mb-4 text-red-500 text-sm">{error}</div>
          )}

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RequestBookModal; 