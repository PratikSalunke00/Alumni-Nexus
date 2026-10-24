import { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Button from '../../components/Button';

const AdminVerificationQueue = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRequests = async () => {
    const token = localStorage.getItem('userJwtToken');
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/admin/verification-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(response.data?.data || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load verification requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const updateRequest = async (id, status) => {
    const token = localStorage.getItem('userJwtToken');
    try {
      await axios.patch(`${import.meta.env.VITE_API_BASE_URL}/admin/verification-requests/${id}`, { status }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await loadRequests();
    } catch (requestError) {
      alert(requestError.response?.data?.message || 'Unable to update verification status');
    }
  };

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Admin</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">Verification queue</h1>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">Loading requests...</div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>
        ) : requests.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">No verification requests available.</div>
        ) : (
          <div className="grid gap-4">
            {requests.map((request) => (
              <div key={request._id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{request.user?.name || 'Unknown user'}</p>
                    <p className="text-sm text-slate-600">{request.user?.email || 'No email'} · {request.type}</p>
                    <p className="mt-2 text-sm text-slate-600">{request.evidence || 'No evidence provided.'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">{request.status}</span>
                    <Button title="Approve" size="sm" varient="primary" onClick={() => updateRequest(request._id, 'approved')} />
                    <Button title="Reject" size="sm" varient="outline" onClick={() => updateRequest(request._id, 'rejected')} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default AdminVerificationQueue;
