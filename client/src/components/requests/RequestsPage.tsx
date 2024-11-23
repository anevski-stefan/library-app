import { useEffect, useState } from 'react';
import api from '../../services/api';
import { showNotification } from '../../services/notificationService';
import RejectRequestModal from './RejectRequestModal';
import { useAppSelector } from '../../store/hooks';

interface BookRequest {
  id: string;
  title: string;
  author: string;
  status: 'pending' | 'in_progress' | 'approved' | 'rejected';
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
  const [activeTab, setActiveTab] = useState<'pending' | 'in_progress' | 'approved' | 'rejected'>('pending');
  const [loadingRequests, setLoadingRequests] = useState<Set<string>>(new Set());
  const { user } = useAppSelector((state) => state.auth);

  const groupedRequests = {
    pending: requests.filter(req => req.status === 'pending'),
    in_progress: requests.filter(req => req.status === 'in_progress'),
    approved: requests.filter(req => req.status === 'approved'),
    rejected: requests.filter(req => req.status === 'rejected')
  };

  const tabs = [
    { id: 'pending', label: 'Pending' },
    { id: 'in_progress', label: 'Acquisition In Progress' },
    { id: 'approved', label: 'Approved' },
    { id: 'rejected', label: 'Declined' }
  ] as const;

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
      setLoadingRequests(prev => new Set(prev).add(request.id));
      await api.put(`/book-requests/${request.id}/approve`);
      fetchRequests();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to approve request');
    } finally {
      setLoadingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(request.id);
        return newSet;
      });
    }
  };

  const handleReject = async (requestId: string, comment: string) => {
    try {
      await api.put(`/book-requests/${requestId}/reject`, { comment });
      setRejectModalRequest(null);
      fetchRequests();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reject request');
    }
  };

  const handleStartAcquisition = async (request: BookRequest) => {
    try {
      setLoadingRequests(prev => new Set(prev).add(request.id));
      await api.put(`/book-requests/${request.id}/start-acquisition`);
      fetchRequests();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to start acquisition');
    } finally {
      setLoadingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(request.id);
        return newSet;
      });
    }
  };

  const handleComplete = async (request: BookRequest) => {
    try {
      setLoadingRequests(prev => new Set(prev).add(request.id));
      await api.put(`/book-requests/${request.id}/complete-acquisition`);
      fetchRequests();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to complete acquisition');
      showNotification({
        title: 'Error',
        message: 'Failed to complete acquisition',
        type: 'error'
      });
    } finally {
      setLoadingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(request.id);
        return newSet;
      });
    }
  };

  const RequestList = ({ requests }: { requests: BookRequest[] }) => (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      {requests.length === 0 ? (
        <div className="p-4 text-gray-500">No requests found in this category.</div>
      ) : (
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
                      disabled={loadingRequests.has(request.id)}
                      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
                    >
                      {loadingRequests.has(request.id) ? (
                        <div className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Approving...
                        </div>
                      ) : (
                        'Approve'
                      )}
                    </button>
                    <button
                      onClick={() => setRejectModalRequest(request)}
                      disabled={loadingRequests.has(request.id)}
                      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                )}

                {request.status === 'approved' && (
                  <div className="flex space-x-4">
                    <button
                      onClick={() => handleStartAcquisition(request)}
                      disabled={loadingRequests.has(request.id)}
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                    >
                      {loadingRequests.has(request.id) ? (
                        <div className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Starting...
                        </div>
                      ) : (
                        'Start Acquisition'
                      )}
                    </button>
                  </div>
                )}

                {request.status === 'in_progress' && (
                  <div className="flex space-x-4">
                    <button
                      onClick={() => handleComplete(request)}
                      disabled={loadingRequests.has(request.id)}
                      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
                    >
                      {loadingRequests.has(request.id) ? (
                        <div className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Completing...
                        </div>
                      ) : (
                        'Complete Acquisition'
                      )}
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

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

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {label}
              <span className="ml-2 bg-gray-100 text-gray-700 py-0.5 px-2.5 rounded-full text-xs">
                {groupedRequests[id].length}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <RequestList requests={groupedRequests[activeTab]} />

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