'use client'

import { useState, useEffect } from 'react'
import { Search, Book, BookOpen, Users } from 'lucide-react'
import { useAppSelector } from '../../store/hooks'
import api from '../../services/api'

interface DashboardStats {
  totalBooks: number;
  availableBooks: number;
  borrowedBooks: number;
  overdueBooks: number;
}

interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  quantity: number;
  available_quantity: number;
  book_category: string;
  barcode?: string;
}

interface RecentBorrow {
  id: string;
  book: {
    title: string;
    author: string;
  };
  borrowDate: string;
  returnDate: string;
  status: 'borrowed' | 'returned' | 'overdue';
}

export default function Dashboard() {
  const { user } = useAppSelector((state) => state.auth);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentBorrows, setRecentBorrows] = useState<RecentBorrow[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  const displayStats = {
    totalBooks: {
      value: stats?.totalBooks || 0,
      change: `${stats?.availableBooks || 0} available`
    },
    booksRead: {
      value: stats?.borrowedBooks || 0,
      change: `${stats?.overdueBooks || 0} overdue`
    },
    activeReaders: {
      value: user ? 1 : 0,
      change: `Last active: ${new Date().toLocaleDateString()}`
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, borrowsResponse, booksResponse] = await Promise.all([
        api.get('/api/books/stats'),
        api.get('/api/borrows/user'),
        api.get('/api/books')
      ]);
      
      console.log('Books response:', booksResponse.data);
      
      setStats(statsResponse.data);
      setRecentBorrows(borrowsResponse.data);
      setBooks(booksResponse.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold">Book Library Dashboard</h1>
      
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search books..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      {/* Book Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-500">Total Books</h2>
            <Book className="h-5 w-5 text-gray-400" />
          </div>
          <div className="mt-2">
            <p className="text-3xl font-semibold">{displayStats.totalBooks.value}</p>
            <p className="text-sm text-gray-500">{displayStats.totalBooks.change}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-500">Books Borrowed</h2>
            <BookOpen className="h-5 w-5 text-gray-400" />
          </div>
          <div className="mt-2">
            <p className="text-3xl font-semibold">{displayStats.booksRead.value}</p>
            <p className="text-sm text-gray-500">{displayStats.booksRead.change}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-500">User Info</h2>
            <Users className="h-5 w-5 text-gray-400" />
          </div>
          <div className="mt-2">
            <p className="text-xl font-semibold">{user?.firstName} {user?.lastName}</p>
            <p className="text-sm text-gray-500">Role: {user?.role}</p>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
        {/* Recently Added Books */}
        <div className="bg-white p-6 rounded-lg shadow md:col-span-1 lg:col-span-4">
          <h2 className="text-xl font-semibold mb-4">Recent Borrows</h2>
          <div className="space-y-4">
            {recentBorrows.map((borrow) => (
              <div key={borrow.id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <Book className="h-9 w-9 text-gray-400" />
                  <div className="ml-4">
                    <p className="text-sm font-medium">{borrow.book.title}</p>
                    <p className="text-sm text-gray-500">{borrow.book.author}</p>
                  </div>
                </div>
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                  ${borrow.status === 'borrowed' ? 'bg-yellow-100 text-yellow-800' : 
                    borrow.status === 'returned' ? 'bg-green-100 text-green-800' : 
                    'bg-red-100 text-red-800'}`}>
                  {borrow.status}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Book Inventory */}
        <div className="space-y-4 md:col-span-1 lg:col-span-3">
          <h2 className="text-2xl font-bold">Book Inventory</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Genre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {books && books.length > 0 ? (
                  books.map((book) => (
                    <tr key={book.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{book.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{book.author}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{book.book_category}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          book.available_quantity > 0 ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {book.available_quantity > 0 ? "Available" : "Checked Out"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                      No books found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
} 