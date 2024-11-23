import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import { Calendar, Book, Heart, Share2 } from 'lucide-react';

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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="w-full">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">{book.title}</h1>
          <p className="text-xl text-gray-600 mb-4">by {book.author}</p>
          
          <div className="flex items-center text-gray-600 mb-6">
            <Calendar className="h-5 w-5 mr-2" />
            <span>ISBN: {book.isbn}</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 mb-8">
            <button className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition duration-300">
              <Book className="h-5 w-5 mr-2" />
              Add to My Library
            </button>
            <button className="flex items-center px-6 py-3 border border-gray-600 text-gray-600 rounded-full hover:bg-gray-100 transition duration-300">
              <Heart className="h-5 w-5 mr-2" />
              Add to Favorites
            </button>
            <button className="flex items-center px-6 py-3 border border-gray-600 text-gray-600 rounded-full hover:bg-gray-100 transition duration-300">
              <Share2 className="h-5 w-5 mr-2" />
              Share
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Book Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600 font-semibold">ISBN</p>
                <p className="text-gray-800">{book.isbn}</p>
              </div>
              <div>
                <p className="text-gray-600 font-semibold">Author</p>
                <p className="text-gray-800">{book.author}</p>
              </div>
              <div>
                <p className="text-gray-600 font-semibold">Total Copies</p>
                <p className="text-gray-800">{book.quantity}</p>
              </div>
              <div>
                <p className="text-gray-600 font-semibold">Available Copies</p>
                <p className="text-gray-800">{book.available_quantity}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetails; 