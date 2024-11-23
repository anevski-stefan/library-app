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
      value: stats?.totalBooks ?? 0,
      change: `${stats?.availableBooks ?? 0} available`
    },
    booksRead: {
      value: stats?.borrowedBooks ?? 0,
      change: `${stats?.overdueBooks ?? 0} overdue`
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
      const booksResponse = await api.get('/books');
      setBooks(booksResponse.data);
      console.log('Books from API:', booksResponse.data);

      const borrowsResponse = await api.get('/borrows/user');
      setRecentBorrows(borrowsResponse.data);
      console.log('Borrows from API:', borrowsResponse.data);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (books.length > 0) {
      const calculatedStats = {
        totalBooks: books.length,
        availableBooks: books.filter(book => book.available_quantity > 0).length,
        borrowedBooks: recentBorrows.filter(borrow => borrow.status === 'borrowed').length,
        overdueBooks: recentBorrows.filter(borrow => borrow.status === 'overdue').length
      };
      console.log('Calculated stats:', calculatedStats);
      setStats(calculatedStats);
    }
  }, [books, recentBorrows]);

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
      <div className="space-y-8">
        {/* Recent Borrows */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Recent Borrows</h2>
          <div className="space-y-4">
            {recentBorrows.map((borrow) => (
              <div key={borrow.id} className="flex items-center">
                <Book className="h-9 w-9 text-gray-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium">{borrow.book.title}</p>
                  <p className="text-sm text-gray-500">{borrow.book.author}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Book Inventory - Now full width */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Book Inventory</h2>
          <div className="bg-white rounded-lg shadow">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase">Title</th>
                    <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase">Author</th>
                    <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase">Genre</th>
                    <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {books.map((book) => (
                    <tr key={book.id} className="border-b border-gray-200">
                      <td className="p-4 text-sm text-gray-900 whitespace-nowrap">{book.title}</td>
                      <td className="p-4 text-sm text-gray-500 whitespace-nowrap">{book.author}</td>
                      <td className="p-4 text-sm text-gray-500 whitespace-nowrap">{book.book_category}</td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <div className={`inline-block rounded-full px-2 py-1 text-xs font-semibold whitespace-nowrap ${
                            book.available_quantity > 0
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}>
                            {book.available_quantity > 0 ? "Available" : "Not Available"}
                          </div>
                          <span className="text-sm text-gray-500 whitespace-nowrap">
                            ({book.available_quantity}/{book.quantity})
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 