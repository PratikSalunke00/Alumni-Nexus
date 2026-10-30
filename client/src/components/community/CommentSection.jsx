/**
 * CommentSection.jsx
 * ──────────────────────────────────────────────────────────────────────────────
 * Renders the comment list + input form for a single community post.
 *
 * Props
 *   post            – the full post object (needs _id, author._id)
 *   currentUser     – { _id, id, name, profilePhoto }
 *   userRole        – "student" | "alumni" | "admin"
 *   comments        – Comment[]  (array already fetched by parent)
 *   hasMore         – boolean  (whether older comments can be loaded)
 *   loading         – boolean  (spinner while loading)
 *   onLoadMore()    – fetch next page
 *   onAdd(comment)  – called after a comment is successfully created
 *   onDelete(comment) – called after a comment is successfully deleted
 *   apiBaseUrl      – e.g. "http://localhost:8080"
 *   getAuthConfig() – returns Axios headers with JWT
 */

import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

/* ── helpers ── */
const safeImage = (value) => {
  try {
    const u = new URL(value);
    return ['http:', 'https:'].includes(u.protocol) ? u.href : '';
  } catch {
    return '';
  }
};

const initials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0] || '')
    .join('')
    .toUpperCase() || '?';

const relativeTime = (date) => {
  const ts = new Date(date).getTime();
  if (!Number.isFinite(ts)) return '';
  const secs = Math.round((ts - Date.now()) / 1000);
  const units = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];
  for (const [unit, size] of units) {
    const amt = Math.round(secs / size);
    if (Math.abs(amt) >= 1)
      return new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' }).format(amt, unit);
  }
  return 'just now';
};

/* ── Avatar ── */
const Avatar = ({ user, size = 'h-8 w-8' }) => {
  const src = safeImage(user?.profilePhoto || '');
  return (
    <div
      className={`flex ${size} shrink-0 items-center justify-center overflow-hidden rounded-full bg-sky-100 text-xs font-bold text-sky-800`}
    >
      {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : initials(user?.name)}
    </div>
  );
};

/* ── Comment item ── */
const CommentItem = ({ comment, canDelete, onDelete }) => (
  <div className="flex items-start gap-2.5">
    <Avatar user={comment.author} />
    <div className="min-w-0 flex-1 rounded-2xl bg-slate-50 px-3.5 py-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-slate-800">
          {comment.author?.name || 'Community member'}
        </span>
        <span className="text-xs capitalize text-slate-400">{comment.author?.role}</span>
        <time dateTime={comment.createdAt} className="text-xs text-slate-400">
          {relativeTime(comment.createdAt)} · {new Date(comment.createdAt).toLocaleString()}
        </time>
        {canDelete && (
          <button
            type="button"
            onClick={() => onDelete(comment)}
            className="ml-auto text-xs text-slate-400 transition hover:text-red-600"
          >
            Delete
          </button>
        )}
      </div>
      <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-700">
        {comment.content}
      </p>
    </div>
  </div>
);

/* ── Main component ── */
const CommentSection = ({
  post,
  currentUser = {},
  userRole = '',
  comments = [],
  hasMore = false,
  loading = false,
  onLoadMore,
  onAdd,
  onDelete,
  apiBaseUrl = '',
  getAuthConfig,
}) => {
  const [input, setInput] = useState('');
  const [posting, setPosting] = useState(false);

  const currentUserId = currentUser?._id || currentUser?.id;
  const ownsPost = String(post?.author?._id) === String(currentUserId);
  const isAdmin = userRole === 'admin';

  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) {
      toast.error('Write a comment before submitting.');
      return;
    }
    setPosting(true);
    try {
      const { data } = await axios.post(
        `${apiBaseUrl}/api/community/posts/${post._id}/comments`,
        { content: text },
        getAuthConfig()
      );
      setInput('');
      onAdd?.(data.data);
    } catch (error) {
      toast.error(
        error.response?.data?.message || error.message || 'Failed to add comment.'
      );
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (comment) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await axios.delete(
        `${apiBaseUrl}/api/community/comments/${comment._id}`,
        getAuthConfig()
      );
      onDelete?.(comment);
      toast.success('Comment deleted.');
    } catch (error) {
      toast.error(
        error.response?.data?.message || error.message || 'Failed to delete comment.'
      );
    }
  };

  return (
    <section className="mt-4 border-t border-slate-100 pt-4 space-y-4">
      {/* Loading spinner */}
      {loading && !comments.length && (
        <p className="py-4 text-center text-sm text-slate-500">Loading comments…</p>
      )}

      {/* Comment list */}
      {comments.length > 0 && (
        <div className="space-y-4">
          {/* Load older button */}
          {hasMore && (
            <button
              type="button"
              disabled={loading}
              onClick={onLoadMore}
              className="text-sm font-medium text-sky-700 hover:underline disabled:opacity-50"
            >
              {loading ? 'Loading…' : 'Load older comments'}
            </button>
          )}

          {comments.map((comment) => {
            const isAuthor = String(comment.author?._id) === String(currentUserId);
            const canDelete = isAuthor || ownsPost || isAdmin;
            return (
              <CommentItem
                key={comment._id}
                comment={comment}
                canDelete={canDelete}
                onDelete={handleDelete}
              />
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!loading && !comments.length && (
        <p className="py-2 text-sm text-slate-500">Be the first to comment.</p>
      )}

      {/* Comment input form */}
      <form onSubmit={handleSubmit} className="flex items-start gap-2.5">
        <Avatar user={currentUser} />
        <div className="flex min-w-0 flex-1 gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={2000}
            placeholder="Write a comment…"
            className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          />
          <button
            type="submit"
            disabled={posting || !input.trim()}
            className="rounded-xl bg-sky-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {posting ? '…' : 'Send'}
          </button>
        </div>
      </form>
    </section>
  );
};

export default CommentSection;

