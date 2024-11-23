'use client'

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
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    author: initialData?.author || '',
    isbn: initialData?.isbn || '',
    quantity: initialData?.quantity || 1,
    book_category: initialData?.book_category || ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: name === 'quantity' ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      if (initialData?.id) {
        await api.put(`/books/${initialData.id}`, formData);
      } else {
        await api.post('/books', formData);
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving book:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg px-8 pt-6 pb-8">
      <div className="mb-6">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
          Title
        </label>
        <input
          className="appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-indigo-500 transition duration-300"
          id="title"
          type="text"
          placeholder="Enter book title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
        />
      </div>
      
      <div className="mb-6">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="author">
          Author
        </label>
        <input
          className="appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-indigo-500 transition duration-300"
          id="author"
          type="text"
          placeholder="Enter author name"
          name="author"
          value={formData.author}
          onChange={handleChange}
          required
        />
      </div>
      
      <div className="mb-6">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="isbn">
          ISBN
        </label>
        <input
          className="appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-indigo-500 transition duration-300"
          id="isbn"
          type="text"
          placeholder="Enter ISBN"
          name="isbn"
          value={formData.isbn}
          onChange={handleChange}
          required
        />
      </div>
      
      <div className="mb-6">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="quantity">
          Quantity
        </label>
        <input
          className="appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-indigo-500 transition duration-300"
          id="quantity"
          type="number"
          placeholder="Enter quantity"
          name="quantity"
          value={formData.quantity}
          onChange={handleChange}
          min="0"
          required
        />
      </div>
      
      <div className="mb-6">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="book_category">
          Category
        </label>
        <input
          className="appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-indigo-500 transition duration-300"
          id="book_category"
          type="text"
          placeholder="Enter book category"
          name="book_category"
          value={formData.book_category}
          onChange={handleChange}
          required
        />
      </div>
      
      <div className="flex items-center justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-600 hover:text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300"
        >
          Cancel
        </button>
        <button
          className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300 transform hover:scale-105"
          type="submit"
        >
          {initialData ? 'Save Changes' : 'Add Book'}
        </button>
      </div>
    </form>
  );
};

export default BookForm; 