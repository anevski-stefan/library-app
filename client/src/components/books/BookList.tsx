import { useEffect, useState } from 'react';
import api from '../../services/api';
import BookForm from './BookForm';
import BorrowModal from './BorrowModal';
import BookScanner from './BookScanner';

interface Book {
    id: string;
    title: string;
    author: string;
    isbn: string;
    quantity: number;
    available_quantity: number;
    book_category: string;
    barcode?: string;
    createdAt: string;
    updatedAt: string;
  }

const BookList = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isBorrowModalOpen, setIsBorrowModalOpen] = useState(false);
  const [bookToBorrow, setBookToBorrow] = useState<Book | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const response = await api.get('/books');
      setBooks(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch books');
      setLoading(false);
    }
  };

  const handleEdit = (book: Book) => {
    setSelectedBook(book);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this book?')) {
      try {
        await api.delete(`/books/${id}`);
        fetchBooks();
      } catch (error) {
        console.error('Error deleting book:', error);
      }
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setSelectedBook(null);
    fetchBooks();
  };

  const handleBorrow = (book: Book) => {
    setBookToBorrow(book);
    setIsBorrowModalOpen(true);
  };

  const handleBorrowSuccess = () => {
    setIsBorrowModalOpen(false);
    setBookToBorrow(null);
    fetchBooks();
  };

  const filteredBooks = books.filter(book => {
    const matchesSearch = 
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.isbn.includes(searchTerm) ||
      book.book_category.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesCategory = !selectedCategory || book.book_category === selectedCategory;
      
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(books.map(book => book.book_category))];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Books</h1>
        <div className="flex space-x-4">
          <button 
            onClick={() => setIsFormOpen(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Add New Book
          </button>
          <button 
            onClick={() => setIsScannerOpen(true)}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 ml-2"
          >
            Scan Book
          </button>
        </div>
      </div>

      <div className="mb-4 flex space-x-4">
        <input
          type="text"
          placeholder="Search books..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
        
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {selectedBook ? 'Edit Book' : 'Add New Book'}
            </h2>
            <BookForm
              initialData={selectedBook || undefined}
              onSuccess={handleFormSuccess}
              onCancel={() => {
                setIsFormOpen(false);
                setSelectedBook(null);
              }}
            />
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Title</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Author</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Category</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Available</th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredBooks.map((book) => (
                    <tr key={book.id}>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{book.title}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{book.author}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{book.book_category}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {book.available_quantity} of {book.quantity}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button 
                          onClick={() => handleEdit(book)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(book.id)}
                          className="text-red-600 hover:text-red-900 mr-4"
                        >
                          Delete
                        </button>
                        {book.available_quantity > 0 && (
                          <button
                            onClick={() => handleBorrow(book)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Borrow
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {isBorrowModalOpen && bookToBorrow && (
        <BorrowModal
          bookId={bookToBorrow.id}
          bookTitle={bookToBorrow.title}
          onSuccess={handleBorrowSuccess}
          onClose={() => {
            setIsBorrowModalOpen(false);
            setBookToBorrow(null);
          }}
        />
      )}

      {isScannerOpen && (
        <BookScanner
          onSuccess={() => {
            setIsScannerOpen(false);
            fetchBooks();
          }}
          onClose={() => setIsScannerOpen(false)}
        />
      )}
    </div>
  );
};

export default BookList; 