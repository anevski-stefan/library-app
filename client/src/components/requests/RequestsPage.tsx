import { useEffect, useState } from 'react';
import api from '../../services/api';
import { showNotification } from '../../services/notificationService';
import RejectRequestModal from './RejectRequestModal';
import { useAppSelector } from '../../store/hooks';

interface BookRequest {
  id: string;
  title: string;
  author: string;
  status: 'pending' | 'approved' | 'rejected';
  external_link?: string;
  admin_comment?: string;
  user: {
    firstName: string;
    lastName: string;
  };
}

const RequestsPage = () => {
  const [requests, setRequests] = useState<BookRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectModalRequest, setRejectModalRequest] = useState<BookRequest | null>(null);
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/book-requests');
      setRequests(response.data);
    } catch (err: any) {
      console.error('Error fetching requests:', err);
      setError(err.response?.data?.message || 'Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request: BookRequest) => {
    try {
      await api.put(`/book-requests/${request.id}/approve`);
      fetchRequests();
      showNotification({
        title: 'Request Approved',
        message: `Request for "${request.title}" has been approved.`,
        type: 'request_approved',
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to approve request');
    }
  };

  const handleReject = async (requestId: string, comment: string) => {
    try {
      await api.put(`/book-requests/${requestId}/reject`, { comment });
      setRejectModalRequest(null);
      fetchRequests();
      showNotification({
        title: 'Request Rejected',
        message: `Request rejected successfully.`,
        type: 'request_rejected',
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reject request');
    }
  };

  if (!user) {
    return <div className="p-4">Please log in to view requests.</div>;
  }

  if (user.role !== 'admin') {
    return <div className="p-4">You don't have permission to view this page.</div>;
  }

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Book Requests</h1>

      {requests.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-4">
          No book requests found.
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <ul className="divide-y divide-gray-200">
            {requests.map((request) => (
              <li key={request.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">{request.title}</h3>
                    <p className="text-sm text-gray-500">by {request.author}</p>
                    <p className="text-sm text-gray-500">
                      Requested by: {request.user.firstName} {request.user.lastName}
                    </p>
                    {request.external_link && (
                      <a
                        href={request.external_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        External Link
                      </a>
                    )}
                    <p className="text-sm text-gray-500">
                      Status: <span className="font-medium">{request.status}</span>
                    </p>
                    {request.admin_comment && (
                      <p className="text-sm text-gray-500">
                        Comment: {request.admin_comment}
                      </p>
                    )}
                  </div>
                  
                  {request.status === 'pending' && (
                    <div className="flex space-x-4">
                      <button
                        onClick={() => handleApprove(request)}
                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => setRejectModalRequest(request)}
                        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {rejectModalRequest && (
        <RejectRequestModal
          request={rejectModalRequest}
          onReject={handleReject}
          onClose={() => setRejectModalRequest(null)}
        />
      )}
    </div>
  );
};

export default RequestsPage; 