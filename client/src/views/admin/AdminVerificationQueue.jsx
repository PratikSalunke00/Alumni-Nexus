import { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardShell from '../../components/DashboardShell';
import toast, { Toaster } from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

/** Read JWT from whichever key Login.jsx stored it under. */
const getAuthConfig = () => {
  const token =
    localStorage.getItem('token') || localStorage.getItem('userJwtToken') || '';
  return { headers: { Authorization: `Bearer ${token}` } };
};

const STATUS_BADGE = {
  pending:  'bg-amber-100 text-amber-700 border-amber-200',
  approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  rejected: 'bg-rose-100 text-rose-700 border-rose-200',
};

const ROLE_BADGE = {
  student: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  alumni:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  admin:   'bg-sky-50 text-sky-700 border-sky-200',
};

const AdminVerificationQueue = () => {
  const [requests, setRequests]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [updating, setUpdating]     = useState({}); // { [id]: true } while in-flight
  const [activeTab, setActiveTab]   = useState('pending'); // 'pending' | 'approved' | 'rejected' | 'all'

  /* ── Fetch all verification requests ── */
  const loadRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.get(
        `${API_URL}/api/admin/verification-requests`,
        getAuthConfig()
      );
      setRequests(data?.data || []);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Unable to load verification requests';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  /* ── Approve or reject a request ── */
  const updateRequest = async (id, status) => {
    setUpdating((prev) => ({ ...prev, [id]: true }));
    try {
      await axios.patch(
        `${API_URL}/api/admin/verification-requests/${id}`,
        { status },
        getAuthConfig()
      );
      toast.success(
        status === 'approved'
          ? 'User verified successfully! 🎉'
          : 'User verification rejected.'
      );
      /* Update local state instantly */
      setRequests((prev) =>
        prev.map((r) => (r._id === id ? { ...r, status } : r))
      );
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          err.message ||
          'Unable to update verification status'
      );
    } finally {
      setUpdating((prev) => ({ ...prev, [id]: false }));
    }
  };

  const counts = {
    all: requests.length,
    pending: requests.filter((r) => r.status === 'pending').length,
    approved: requests.filter((r) => r.status === 'approved').length,
    rejected: requests.filter((r) => r.status === 'rejected').length,
  };

  const displayedRequests = requests.filter((r) => {
    if (activeTab === 'all') return true;
    return r.status === activeTab;
  });

  return (
    <DashboardShell role="admin" pageTitle="Verification queue">
      <Toaster position="top-right" />

      <div className="space-y-6">
        {/* Header row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">
              Review and verify student and alumni accounts for your college.
            </p>
          </div>
          <button
            type="button"
            onClick={loadRequests}
            disabled={loading}
            className="self-start rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {loading ? 'Refreshing…' : '↻ Refresh queue'}
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          {[
            { key: 'pending',  label: 'Pending' },
            { key: 'approved', label: 'Approved' },
            { key: 'rejected', label: 'Rejected' },
            { key: 'all',      label: 'All requests' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
                activeTab === tab.key
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  activeTab === tab.key
                    ? 'bg-white/20 text-white'
                    : 'bg-white text-slate-700'
                }`}
              >
                {counts[tab.key]}
              </span>
            </button>
          ))}
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-2xl bg-slate-100"
              />
            ))}
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
            <p className="font-semibold text-rose-900">Failed to load requests</p>
            <p className="mt-1 text-sm text-rose-700">{error}</p>
            <button
              type="button"
              onClick={loadRequests}
              className="mt-4 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && displayedRequests.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-2xl text-emerald-600">
              ✓
            </div>
            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              {activeTab === 'pending'
                ? 'No pending verification requests'
                : activeTab === 'approved'
                ? 'No approved requests found'
                : activeTab === 'rejected'
                ? 'No rejected requests'
                : 'No verification requests found'}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {activeTab === 'pending'
                ? 'All accounts are verified and up to date.'
                : 'Items will appear here once submitted or processed.'}
            </p>
            {activeTab !== 'all' && counts.all > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className="mt-4 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                View all ({counts.all})
              </button>
            )}
          </div>
        )}

        {/* Requests list */}
        {!loading && !error && displayedRequests.length > 0 && (
          <div className="space-y-4">
            {displayedRequests.map((request) => {
              const user = request.user || {};
              const userRole = user.role || request.type || 'student';
              const isUpdating = !!updating[request._id];

              return (
                <div
                  key={request._id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    {/* User Info */}
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      {user.profilePhoto ? (
                        <img
                          src={user.profilePhoto}
                          alt={user.name || 'User'}
                          className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-slate-100"
                        />
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-800">
                          {(user.name || '?')
                            .split(/\s+/)
                            .slice(0, 2)
                            .map((p) => p[0] || '')
                            .join('')
                            .toUpperCase()}
                        </div>
                      )}

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-900 text-base">
                            {user.name || 'Unknown user'}
                          </p>
                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${
                              ROLE_BADGE[userRole] || 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {userRole}
                          </span>
                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${
                              STATUS_BADGE[request.status] || 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {request.status}
                          </span>
                        </div>

                        <p className="text-sm text-slate-600">
                          {user.email || 'No email on file'}
                        </p>

                        {(user.branch || user.company || user.headline) && (
                          <p className="text-xs text-slate-500">
                            {[user.headline, user.company, user.branch]
                              .filter(Boolean)
                              .join(' · ')}
                          </p>
                        )}

                        {request.evidence && (
                          <div className="mt-2 rounded-xl bg-slate-50 px-3.5 py-2 text-xs text-slate-700 border border-slate-100">
                            <span className="font-semibold text-slate-600">Reason / Evidence: </span>
                            {request.evidence}
                          </div>
                        )}

                        {request.rejectionReason && (
                          <p className="text-xs text-rose-600">
                            Rejection reason: {request.rejectionReason}
                          </p>
                        )}

                        <p className="text-xs text-slate-400 pt-1">
                          Created {new Date(request.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex shrink-0 items-center gap-2 self-start lg:self-center">
                      {request.status === 'pending' ? (
                        <>
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => updateRequest(request._id, 'approved')}
                            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50"
                          >
                            {isUpdating ? '…' : '✓ Verify & Approve'}
                          </button>
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => updateRequest(request._id, 'rejected')}
                            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 active:bg-rose-200 disabled:opacity-50"
                          >
                            {isUpdating ? '…' : '✕ Reject'}
                          </button>
                        </>
                      ) : request.status === 'approved' ? (
                        <>
                          <span className="rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                            ✓ Verified
                          </span>
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => updateRequest(request._id, 'rejected')}
                            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
                          >
                            {isUpdating ? '…' : 'Revoke'}
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="rounded-xl bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 border border-rose-200">
                            ✕ Rejected
                          </span>
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => updateRequest(request._id, 'approved')}
                            className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                          >
                            {isUpdating ? '…' : 'Re-verify'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  );
};

export default AdminVerificationQueue;
