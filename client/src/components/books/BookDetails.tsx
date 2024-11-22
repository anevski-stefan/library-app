import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';

interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  quantity: number;
  available_quantity: number;
}

const BookDetails = () => {
  const { id } = useParams();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const response = await api.get(`/books/${id}`);
        setBook(response.data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch book details');
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!book) return <div>Book not found</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{book.title}</h1>
      <div className="bg-white shadow rounded-lg p-6">
        <div className="mb-4">
          <label className="font-semibold">Author:</label>
          <p>{book.author}</p>
        </div>
        <div className="mb-4">
          <label className="font-semibold">ISBN:</label>
          <p>{book.isbn}</p>
        </div>
        <div className="mb-4">
          <label className="font-semibold">Available Copies:</label>
          <p>{book.available_quantity} of {book.quantity}</p>
        </div>
      </div>
    </div>
  );
};

export default BookDetails; 