import { useState } from 'react';
import api from '../../services/api';

interface BookFormProps {
  initialData?: {
    id?: string;
    title: string;
    author: string;
    isbn: string;
    quantity: number;
    book_category: string;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

const BookForm = ({ initialData, onSuccess, onCancel }: BookFormProps) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [author, setAuthor] = useState(initialData?.author || '');
  const [isbn, setIsbn] = useState(initialData?.isbn || '');
  const [quantity, setQuantity] = useState(initialData?.quantity || 1);
  const [book_category, setBookCategory] = useState(initialData?.book_category || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const bookData = {
        title,
        author,
        isbn,
        quantity,
        book_category,
      };

      if (initialData?.id) {
        await api.put(`/books/${initialData.id}`, bookData);
      } else {
        await api.post('/books', bookData);
      }
      
      onSuccess();
    } catch (error) {
      console.error('Error saving book:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Author</label>
        <input
          type="text"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">ISBN</label>
        <input
          type="text"
          value={isbn}
          onChange={(e) => setIsbn(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Quantity</label>
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          min="0"
          required
        />
      </div>
      
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">
          Category
        </label>
        <input
          type="text"
          value={book_category}
          onChange={(e) => setBookCategory(e.target.value)}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          required
        />
      </div>
      
      <div className="mt-4">
        <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Save
        </button>
        <button type="button" onClick={onCancel} className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded ml-2">
          Cancel
        </button>
      </div>
    </form>
  );
};

export default BookForm; 