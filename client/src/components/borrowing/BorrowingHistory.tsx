import { useEffect, useState } from 'react';
import api from '../../services/api';

interface Borrow {
  id: string;
  bookId: string;
  borrowDate: string;
  returnDate: string;
  actualReturnDate?: string;
  status: 'borrowed' | 'returned' | 'overdue';
  book: {
    title: string;
    author: string;
  };
}

const BorrowingHistory = () => {
  const [borrows, setBorrows] = useState<Borrow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBorrows();
  }, []);

  const fetchBorrows = async () => {
    try {
      const response = await api.get('/borrows/user');
      const borrowsWithStatus = response.data.map((borrow: any) => {
        let status: 'borrowed' | 'returned' | 'overdue';
        const today = new Date();
        const returnDate = new Date(borrow.returnDate);
        
        if (borrow.actualReturnDate) {
          status = 'returned';
        } else if (returnDate < today) {
          status = 'overdue';
        } else {
          status = 'borrowed';
        }
        
        return { ...borrow, status };
      });
      
      setBorrows(borrowsWithStatus);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching borrows:', error);
      setLoading(false);
    }
  };

  const handleReturn = async (borrowId: string) => {
    try {
      await api.put(`/borrows/${borrowId}/return`);
      fetchBorrows();
    } catch (error) {
      console.error('Error returning book:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Borrowing History</h1>
      {borrows.length === 0 && (
        <p className="text-gray-500 text-center py-4">No borrowing history found.</p>
      )}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Book</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Borrow Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Return Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {borrows.map((borrow) => (
              <tr key={borrow.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{borrow.book.title}</div>
                  <div className="text-sm text-gray-500">{borrow.book.author}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(borrow.borrowDate).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(borrow.returnDate).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                    ${borrow.status === 'borrowed' ? 'bg-yellow-100 text-yellow-800' : 
                      borrow.status === 'returned' ? 'bg-green-100 text-green-800' : 
                      'bg-red-100 text-red-800'}`}>
                    {borrow.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {(borrow.status === 'borrowed' || borrow.status === 'overdue') && (
                    <button
                      onClick={() => handleReturn(borrow.id)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Return
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BorrowingHistory; 