import { useEffect, useState } from 'react';
import api from '../../services/api';
import BookForm from './BookForm';
import BorrowModal from './BorrowModal';
import BookScanner from './BookScanner';
import { useAppSelector } from '../../store/hooks';
import RequestBookModal from './RequestBookModal';
import { FaPlus, FaQrcode, FaEdit, FaTrash, FaBook } from 'react-icons/fa';

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
  const { user } = useAppSelector((state) => state.auth);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [bookToRequest, setBookToRequest] = useState<Book | null>(null);

  console.log('Current user role:', user?.role);

  const isAdmin = user?.role === 'admin';

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

  const handleEdit = async (book: Book) => {
    try {
      if (!isAdmin) {
        setError('Only administrators can edit books');
        return;
      }
      setSelectedBook(book);
      setIsFormOpen(true);
    } catch (error) {
      console.error('Error handling edit:', error);
      setError('Failed to edit book');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (!isAdmin) {
        setError('Only administrators can delete books');
        return;
      }
      
      if (window.confirm('Are you sure you want to delete this book?')) {
        await api.delete(`/books/${id}`);
        fetchBooks();
      }
    } catch (error: any) {
      console.error('Error deleting book:', error);
      setError(error.response?.data?.message || 'Failed to delete book');
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

  const handleRequestBook = (book: Book) => {
    setBookToRequest({
      ...book,
      title: book.title || '',
      author: book.author || ''
    });
    setIsRequestModalOpen(true);
  };

  const handleRequestSuccess = () => {
    setIsRequestModalOpen(false);
    setBookToRequest(null);
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

  console.log('Current user:', user);

  const renderHeader = () => (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold">Books</h1>
      <div className="flex space-x-4">
        {isAdmin ? (
          <>
            <button 
              onClick={() => setIsFormOpen(true)}
              className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 flex items-center justify-center"
              title="Add New Book"
            >
              <FaPlus className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setIsScannerOpen(true)}
              className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600 flex items-center justify-center"
              title="Scan Book"
            >
              <FaQrcode className="w-5 h-5" />
            </button>
          </>
        ) : (
          <button
            onClick={() => handleRequestBook({ title: '', author: '', id: '', isbn: '', quantity: 0, available_quantity: 0, book_category: '', createdAt: '', updatedAt: '' })}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Request New Book
          </button>
        )}
      </div>
    </div>
  );

  const renderActionButtons = (book: Book) => (
    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
      {isAdmin && (
        <>
          <button 
            onClick={() => handleEdit(book)}
            className="text-indigo-600 hover:text-indigo-900 mr-4"
            title="Edit Book"
          >
            <FaEdit className="w-5 h-5" />
          </button>
          <button 
            onClick={() => handleDelete(book.id)}
            className="text-red-600 hover:text-red-900 mr-4"
            title="Delete Book"
          >
            <FaTrash className="w-5 h-5" />
          </button>
        </>
      )}
      {book.available_quantity > 0 && (
        <button
          onClick={() => handleBorrow(book)}
          className="text-green-600 hover:text-green-900"
          title="Borrow Book"
        >
          <FaBook className="w-5 h-5" />
        </button>
      )}
    </td>
  );

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
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
          <button 
            onClick={() => setError(null)} 
            className="float-right"
          >
            ×
          </button>
        </div>
      )}
      {renderHeader()}

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
                      {renderActionButtons(book)}
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

      {isRequestModalOpen && bookToRequest && (
        <RequestBookModal
          bookTitle={bookToRequest.title}
          bookAuthor={bookToRequest.author}
          onSuccess={handleRequestSuccess}
          onClose={() => {
            setIsRequestModalOpen(false);
            setBookToRequest(null);
          }}
        />
      )}
    </div>
  );
};

export default BookList; 