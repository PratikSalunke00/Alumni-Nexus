/**
 * PostCard.jsx
 * ──────────────────────────────────────────────────────────────────────────────
 * Renders a single community post with:
 *   – Author avatar, name, role badge, headline/branch/company, follower counts
 *   – Post timestamp (relative + absolute) with edited marker
 *   – Category badge, text content, image
 *   – Like count / comment count bar
 *   – Like, Comment, Share, Follow action buttons
 *   – Inline comment section (via CommentSection)
 *   – Edit-in-place textarea (for post owner)
 *   – Three-dot options menu (Edit / Delete)
 *
 * Props
 *   post            – full post object returned by the API
 *   currentUser     – { _id, id, name, profilePhoto }
 *   userRole        – "student" | "alumni" | "admin"
 *   comments        – Comment[]  for this post (managed by parent)
 *   commentHasMore  – boolean
 *   commentLoading  – boolean
 *   commentsOpen    – boolean
 *   onToggleComments()
 *   onLoadMoreComments()
 *   onCommentAdded(comment)
 *   onCommentDeleted(comment)
 *   onLike()
 *   onFollow()
 *   onDelete()
 *   onEditSave(editedPost)
 *   likeLoading     – boolean
 *   followLoading   – boolean
 *   apiBaseUrl
 *   getAuthConfig()
 */

import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import CommentSection from './CommentSection';

/* ── helpers ── */
const safeImage = (value) => {
  if (!value) return '';
  if (typeof value === 'object' && value?.url) return safeImage(value.url);
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

const CATEGORIES = [
  'General Discussion',
  'Achievement',
  'Project',
  'Internship / Job',
  'Event',
  'Technical Knowledge',
  'Announcement',
];

/* ── Avatar ── */
const Avatar = ({ user, size = 'h-11 w-11' }) => {
  const src = safeImage(user?.profilePhoto || '');
  return (
    <div
      className={`flex ${size} shrink-0 items-center justify-center overflow-hidden rounded-full bg-sky-100 text-sm font-bold text-sky-800`}
    >
      {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : initials(user?.name)}
    </div>
  );
};

/* ── PostCard ── */
const PostCard = ({
  post,
  currentUser = {},
  userRole = '',
  comments = [],
  commentHasMore = false,
  commentLoading = false,
  commentsOpen = false,
  onToggleComments,
  onLoadMoreComments,
  onCommentAdded,
  onCommentDeleted,
  onLike,
  onFollow,
  onDelete,
  onEditSave,
  likeLoading = false,
  followLoading = false,
  apiBaseUrl = '',
  getAuthConfig,
}) => {
  const [editMode, setEditMode] = useState(false);
  const [editContent, setEditContent] = useState(post.content || '');
  const [editCategory, setEditCategory] = useState(post.category || 'General Discussion');
  const [saving, setSaving] = useState(false);

  const currentUserId = currentUser?._id || currentUser?.id;
  const ownsPost = String(post.author?._id) === String(currentUserId);
  const isAdmin = userRole === 'admin';
  const canAnnounce = isAdmin;

  const canFollow =
    !ownsPost &&
    ['student', 'alumni', 'admin'].includes(userRole) &&
    ['student', 'alumni', 'admin'].includes(post.author?.role);

  /* ── edit save ── */
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editContent.trim()) {
      toast.error('Post content cannot be empty.');
      return;
    }
    setSaving(true);
    try {
      const { data } = await axios.put(
        `${apiBaseUrl}/api/community/posts/${post._id}`,
        { content: editContent.trim(), category: editCategory },
        getAuthConfig()
      );
      setEditMode(false);
      onEditSave?.(data.data);
      toast.success('Post updated.');
    } catch (error) {
      toast.error(
        error.response?.data?.message || error.message || 'Failed to update post.'
      );
    } finally {
      setSaving(false);
    }
  };

  /* ── share ── */
  const handleShare = async () => {
    const url = new URL(`/community/posts/${post._id}`, window.location.origin).toString();
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Alumni Nexus Community', url });
        toast.success('Post shared.');
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        toast.success('Post link copied to clipboard.');
      } else {
        window.prompt('Copy this post link:', url);
      }
    } catch (err) {
      if (err.name !== 'AbortError') toast.error('Could not share the post.');
    }
  };

  const handleCopyLink = async () => {
    const url = new URL(`/community/posts/${post._id}`, window.location.origin).toString();
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Post link copied to clipboard.');
    } catch (error) {
      toast.error(error.message || 'Could not copy the post link.');
    }
  };

  return (
    <article
      id={`post-${post._id}`}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="p-5 sm:p-6">

        {/* ── Author row ── */}
        <div className="flex items-start gap-3">
          <Avatar user={post.author} />

          <div className="min-w-0 flex-1">
            {/* Name + role badge */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-semibold text-slate-900">
                {post.author?.name || 'Community member'}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                  post.author?.role === 'admin'
                    ? 'bg-indigo-50 text-indigo-700'
                    : post.author?.role === 'alumni'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {post.author?.role || 'member'}
              </span>
            </div>

            {/* Headline / company / branch */}
            <p className="mt-0.5 text-xs text-slate-500">
              {post.author?.headline ||
                post.author?.company ||
                post.author?.jobTitle ||
                post.author?.branch ||
                'Alumni Nexus member'}
            </p>
            {post.author?.collegeId?.name && (
              <p className="mt-0.5 text-xs text-slate-500">
                {post.author.collegeId.name}
              </p>
            )}

            {/* Follower / following counts */}
            <p className="mt-0.5 text-xs text-slate-400">
              {post.author?.followerCount || 0} followers ·{' '}
              {post.author?.followingCount || 0} following
            </p>

            {/* Timestamp */}
            <time dateTime={post.createdAt} className="mt-1 block text-xs text-slate-400">
              {relativeTime(post.createdAt)} ·{' '}
              {new Date(post.createdAt).toLocaleString()}
              {post.updatedAt !== post.createdAt && ' · edited'}
            </time>
          </div>

          {/* Options menu */}
          {(ownsPost || isAdmin) && (
            <details className="relative">
              <summary
                aria-label="Post options"
                className="cursor-pointer list-none rounded-lg px-2 py-1 text-xl leading-none text-slate-500 hover:bg-slate-100"
              >
                ···
              </summary>
              <div className="absolute right-0 z-10 mt-1 w-40 rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
                {ownsPost && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditContent(post.content || '');
                      setEditCategory(post.category || 'General Discussion');
                      setEditMode(true);
                    }}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Edit post
                  </button>
                )}
                <button
                  type="button"
                  onClick={onDelete}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  {isAdmin && !ownsPost ? 'Remove post' : 'Delete post'}
                </button>
              </div>
            </details>
          )}
        </div>

        {/* ── Body ── */}
        {editMode ? (
          /* Edit form */
          <form onSubmit={handleSaveEdit} className="mt-5 space-y-3">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              maxLength={5000}
              rows={5}
              className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
              >
                {CATEGORIES.filter((c) => c !== 'Announcement' || canAnnounce).map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditMode(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <>
            {/* Category badge + content + image */}
            <div className="mt-4">
              <span className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                {post.category}
              </span>
              {post.content && (
                <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
                  {post.content}
                </p>
              )}
              {safeImage(post.image?.url || post.imageUrl || post.image) && (
                <img
                  src={safeImage(post.image?.url || post.imageUrl || post.image)}
                  alt={post.image?.name || 'Community post image'}
                  loading="lazy"
                  className="mt-4 max-h-[34rem] w-full rounded-xl bg-slate-100 object-contain"
                />
              )}
            </div>

            {/* Like / comment count summary */}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 text-xs text-slate-500">
              <span>
                {post.likeCount} {post.likeCount === 1 ? 'like' : 'likes'}
              </span>
              <button
                type="button"
                onClick={onToggleComments}
                className="hover:text-sky-700"
              >
                {post.commentCount} {post.commentCount === 1 ? 'comment' : 'comments'}
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-1 pt-2">
              {/* Like */}
              <button
                type="button"
                disabled={likeLoading}
                onClick={onLike}
                className={`rounded-xl px-3 py-2 text-sm font-semibold transition hover:bg-slate-50 disabled:opacity-50 ${
                  post.likedByMe ? 'text-sky-700' : 'text-slate-600'
                }`}
              >
                {post.likedByMe ? '♥ Liked' : '♡ Like'}
              </button>

              {/* Comment toggle */}
              <button
                type="button"
                onClick={onToggleComments}
                className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                💬 Comment
              </button>

              {/* Share */}
              <button
                type="button"
                onClick={handleShare}
                className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                ↗ Share
              </button>
              <button
                type="button"
                onClick={handleCopyLink}
                className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Copy link
              </button>

              {/* Follow */}
              {canFollow && (
                <button
                  type="button"
                  disabled={followLoading}
                  onClick={onFollow}
                  className="ml-auto rounded-xl px-3 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-50 disabled:opacity-50"
                >
                  {post.followingAuthor ? '✓ Following' : '+ Follow'}
                </button>
              )}
            </div>

            {/* Comment section */}
            {commentsOpen && (
              <CommentSection
                post={post}
                currentUser={currentUser}
                userRole={userRole}
                comments={comments}
                hasMore={commentHasMore}
                loading={commentLoading}
                onLoadMore={onLoadMoreComments}
                onAdd={onCommentAdded}
                onDelete={onCommentDeleted}
                apiBaseUrl={apiBaseUrl}
                getAuthConfig={getAuthConfig}
              />
            )}
          </>
        )}
      </div>
    </article>
  );
};

export default PostCard;
