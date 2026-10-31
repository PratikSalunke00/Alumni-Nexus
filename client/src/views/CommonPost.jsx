/**
 * client/src/views/CommonPost.jsx
 * ──────────────────────────────────────────────────────────────────────────────
 * Common Posts Feed – A separate, dedicated college-wide feed page where ONLY
 * posts are visible (no upload / post composer on this page).
 *
 * Features:
 *   ✓ Separate standalone page layout with top navigation bar (no left sidebar).
 *   ✓ No upload / post creation options on this page (posts are created on Update Post / Dashboard).
 *   ✓ Real-time MongoDB synchronization: fetches and displays all student & alumni posts.
 *   ✓ Reverse chronological order (latest posts first).
 *   ✓ For each post:
 *       • User profile picture & fallback avatar
 *       • User name & role badge (Student / Alumni / Admin)
 *       • Headline / Branch / Department / Company
 *       • Post creation date & formatted timestamp
 *       • Post category badge
 *       • Post description / text
 *       • Uploaded image (if available) with click preview
 *       • Like button with total like count & persistence
 *       • Comment button with total comment count, comment list, and submission
 *       • Share button with unique URL copy & toast notification
 *       • Follow / Following button with follower count & self-follow prevention
 *       • Edit & Delete controls for author / admin
 *   ✓ Search & Category filter pills.
 *   ✓ Refresh button (↻ Refresh).
 *   ✓ Direct single-post view when routed to /community/posts/:postId.
 *   ✓ Loading skeleton, empty state, and pagination.
 */

import { useCallback, useDeferredValue, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { Link, useNavigate, useParams } from 'react-router-dom';

import StudentNavbar from '../components/StudentNavbar.jsx';
import PostCard from '../components/community/PostCard.jsx';

/* ── Constants ── */
const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const PAGE_SIZE = 10;
const CATEGORIES = [
  'General Discussion',
  'Achievement',
  'Project',
  'Internship / Job',
  'Event',
  'Technical Knowledge',
  'Announcement',
];
const FILTERS = ['All Posts', ...CATEGORIES];

/* ── Helpers ── */
const getAuthConfig = () => ({
  headers: {
    Authorization: `Bearer ${
      localStorage.getItem('token') || localStorage.getItem('userJwtToken') || ''
    }`,
  },
});

const getLocalUser = () => {
  try {
    return (
      JSON.parse(localStorage.getItem('userData') || 'null') ||
      JSON.parse(localStorage.getItem('user') || 'null') ||
      {}
    );
  } catch {
    return {};
  }
};

const getErrorMessage = (error) =>
  error.response?.data?.message || error.message || 'Something went wrong. Please try again.';

/* ── Loading Skeleton ── */
const PostSkeleton = () => (
  <div className="animate-pulse space-y-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
    <div className="flex items-start gap-3">
      <div className="h-11 w-11 shrink-0 rounded-full bg-slate-200" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-36 rounded bg-slate-200" />
        <div className="h-3 w-48 rounded bg-slate-100" />
        <div className="h-3 w-28 rounded bg-slate-100" />
      </div>
    </div>
    <div className="space-y-2">
      <div className="h-3.5 w-full rounded bg-slate-100" />
      <div className="h-3.5 w-4/5 rounded bg-slate-100" />
    </div>
    <div className="h-52 w-full rounded-xl bg-slate-100" />
    <div className="flex justify-between pt-2">
      <div className="h-8 w-20 rounded-lg bg-slate-100" />
      <div className="h-8 w-20 rounded-lg bg-slate-100" />
      <div className="h-8 w-20 rounded-lg bg-slate-100" />
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════════════════════════════
   CommonPost Component (Separate standalone page, posts only)
══════════════════════════════════════════════════════════════════════════════ */
const CommonPost = () => {
  const { postId } = useParams();
  const navigate = useNavigate();

  /* ── Current User & Role ── */
  const localUser = getLocalUser();
  const userRole = (
    localStorage.getItem('role') || localUser.role || 'student'
  ).toLowerCase();

  const currentUser = {
    _id: localUser._id || localUser.id || localStorage.getItem('userId'),
    id: localUser._id || localUser.id || localStorage.getItem('userId'),
    name: localStorage.getItem('name') || localUser.name || 'You',
    profilePhoto: localUser.profilePhoto || '',
  };

  const dashboardPath =
    userRole === 'alumni'
      ? '/alumni/dashboard'
      : userRole === 'admin'
        ? '/admin/dashboard'
        : '/student/dashboard';

  /* ── Feed State ── */
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  /* ── Filter & Search State ── */
  const [category, setCategory] = useState('All Posts');
  const [searchInput, setSearchInput] = useState('');
  const search = useDeferredValue(searchInput.trim());

  /* ── Comment State per post ── */
  const [comments, setComments] = useState({});
  const [commentsOpen, setCommentsOpen] = useState({});
  const [commentLoading, setCommentLoading] = useState({});
  const [commentHasMore, setCommentHasMore] = useState({});

  /* ── Action Loading States ── */
  const [likeLoading, setLikeLoading] = useState({});
  const [followLoading, setFollowLoading] = useState({});

  const requestId = useRef(0);

  /* ═══════════ Fetch Posts from MongoDB ═══════════ */

  const fetchFeed = useCallback(
    async (requestedPage = 1, append = false, quiet = false) => {
      const rid = ++requestId.current;
      if (append) setLoadingMore(true);
      else if (!quiet) {
        setLoading(true);
        setLoadError('');
      }

      try {
        const { data } = await axios.get(`${API_URL}/api/community/posts`, {
          ...getAuthConfig(),
          params: {
            page: requestedPage,
            limit: PAGE_SIZE,
            category: category !== 'All Posts' ? category : undefined,
            ...(search ? { search } : {}),
          },
        });

        if (rid !== requestId.current) return;

        const fetchedPosts = Array.isArray(data.data)
          ? data.data
          : Array.isArray(data.posts)
          ? data.posts
          : [];

        setPosts((prev) => {
          if (append) return [...prev, ...fetchedPosts];
          if (!quiet) return fetchedPosts;
          const refreshedIds = new Set(fetchedPosts.map((p) => p._id));
          return [
            ...fetchedPosts,
            ...prev.filter((p) => !refreshedIds.has(p._id)),
          ];
        });

        if (!quiet) setPage(requestedPage);
        setHasMore(Boolean(data.pagination?.hasMore));
      } catch (error) {
        if (rid !== requestId.current) return;
        const msg = getErrorMessage(error);
        if (!quiet) setLoadError(msg);
        toast.error(quiet ? `Feed update failed: ${msg}` : msg);
      } finally {
        if (rid === requestId.current) {
          if (!quiet) setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [category, search]
  );

  const fetchSinglePost = useCallback(async () => {
    const rid = ++requestId.current;
    setLoading(true);
    setLoadError('');
    try {
      const { data } = await axios.get(
        `${API_URL}/api/community/posts/${postId}`,
        getAuthConfig()
      );
      if (rid === requestId.current && data.data) {
        setPosts([data.data]);
      }
    } catch (error) {
      if (rid !== requestId.current) return;
      setLoadError(getErrorMessage(error));
    } finally {
      if (rid === requestId.current) setLoading(false);
    }
  }, [postId]);

  /* Initial fetch & re-fetch on filter change */
  useEffect(() => {
    if (postId) {
      fetchSinglePost();
    } else {
      fetchFeed(1);
    }
  }, [postId, fetchFeed, fetchSinglePost]);

  /* Refresh on window focus */
  useEffect(() => {
    if (postId) return undefined;
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchFeed(1, false, true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchFeed, postId]);

  /* ═══════════ Like / Unlike Handler ═══════════ */

  const handleLike = async (post) => {
    if (likeLoading[post._id]) return;
    const likedByMe = !post.likedByMe;
    setLikeLoading((prev) => ({ ...prev, [post._id]: true }));

    // Optimistic update
    setPosts((prev) =>
      prev.map((p) =>
        p._id === post._id
          ? {
              ...p,
              likedByMe,
              likeCount: Math.max(0, p.likeCount + (likedByMe ? 1 : -1)),
            }
          : p
      )
    );

    try {
      if (likedByMe) {
        await axios.post(
          `${API_URL}/api/community/posts/${post._id}/like`,
          {},
          getAuthConfig()
        );
      } else {
        await axios.delete(
          `${API_URL}/api/community/posts/${post._id}/like`,
          getAuthConfig()
        );
      }
    } catch (error) {
      // Revert optimistic update
      setPosts((prev) =>
        prev.map((p) =>
          p._id === post._id
            ? { ...p, likedByMe: post.likedByMe, likeCount: post.likeCount }
            : p
        )
      );
      toast.error(getErrorMessage(error));
    } finally {
      setLikeLoading((prev) => ({ ...prev, [post._id]: false }));
    }
  };

  /* ═══════════ Comment Handlers ═══════════ */

  const toggleComments = async (post) => {
    const opening = !commentsOpen[post._id];
    setCommentsOpen((prev) => ({ ...prev, [post._id]: opening }));
    if (!opening || comments[post._id]) return;

    setCommentLoading((prev) => ({ ...prev, [post._id]: true }));
    try {
      const { data } = await axios.get(
        `${API_URL}/api/community/posts/${post._id}/comments`,
        { ...getAuthConfig(), params: { limit: 20 } }
      );
      setComments((prev) => ({ ...prev, [post._id]: data.data || [] }));
      setCommentHasMore((prev) => ({
        ...prev,
        [post._id]: Boolean(data.pagination?.hasMore),
      }));
    } catch (error) {
      toast.error(getErrorMessage(error));
      setCommentsOpen((prev) => ({ ...prev, [post._id]: false }));
    } finally {
      setCommentLoading((prev) => ({ ...prev, [post._id]: false }));
    }
  };

  const loadMoreComments = async (post) => {
    const list = comments[post._id] || [];
    setCommentLoading((prev) => ({ ...prev, [post._id]: true }));
    try {
      const { data } = await axios.get(
        `${API_URL}/api/community/posts/${post._id}/comments`,
        {
          ...getAuthConfig(),
          params: { page: Math.floor(list.length / 20) + 1, limit: 20 },
        }
      );
      setComments((prev) => ({
        ...prev,
        [post._id]: [...(data.data || []), ...list],
      }));
      setCommentHasMore((prev) => ({
        ...prev,
        [post._id]: Boolean(data.pagination?.hasMore),
      }));
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setCommentLoading((prev) => ({ ...prev, [post._id]: false }));
    }
  };

  const handleCommentAdded = (post, comment) => {
    setComments((prev) => ({
      ...prev,
      [post._id]: [...(prev[post._id] || []), comment],
    }));
    setPosts((prev) =>
      prev.map((p) =>
        p._id === post._id ? { ...p, commentCount: (p.commentCount || 0) + 1 } : p
      )
    );
  };

  const handleCommentDeleted = (post, comment) => {
    setComments((prev) => ({
      ...prev,
      [post._id]: (prev[post._id] || []).filter((c) => c._id !== comment._id),
    }));
    setPosts((prev) =>
      prev.map((p) =>
        p._id === post._id
          ? { ...p, commentCount: Math.max(0, (p.commentCount || 1) - 1) }
          : p
      )
    );
  };

  /* ═══════════ Follow / Unfollow Handler ═══════════ */

  const handleFollow = async (post) => {
    const authorId = post.author?._id;
    if (!authorId || followLoading[authorId]) return;

    const following = !post.followingAuthor;
    setFollowLoading((prev) => ({ ...prev, [authorId]: true }));

    // Optimistic update
    setPosts((prev) =>
      prev.map((p) =>
        p.author?._id === authorId
          ? {
              ...p,
              followingAuthor: following,
              author: {
                ...p.author,
                followerCount: Math.max(
                  0,
                  (p.author.followerCount || 0) + (following ? 1 : -1)
                ),
              },
            }
          : p
      )
    );

    try {
      if (following) {
        await axios.post(
          `${API_URL}/api/community/users/${authorId}/follow`,
          {},
          getAuthConfig()
        );
      } else {
        await axios.delete(
          `${API_URL}/api/community/users/${authorId}/follow`,
          getAuthConfig()
        );
      }
      toast.success(
        following
          ? `You are now following ${post.author?.name || 'this member'}! 🤝`
          : `Unfollowed ${post.author?.name || 'this member'}.`
      );
    } catch (error) {
      // Revert optimistic update
      setPosts((prev) =>
        prev.map((p) =>
          p.author?._id === authorId
            ? {
                ...p,
                followingAuthor: !following,
                author: {
                  ...p.author,
                  followerCount: Math.max(
                    0,
                    (p.author.followerCount || 0) + (following ? -1 : 1)
                  ),
                },
              }
            : p
        )
      );
      toast.error(getErrorMessage(error));
    } finally {
      setFollowLoading((prev) => ({ ...prev, [authorId]: false }));
    }
  };

  /* ═══════════ Delete & Edit Handlers ═══════════ */

  const handleDeletePost = async (post) => {
    if (!window.confirm('Delete this post? This cannot be undone.')) return;
    try {
      await axios.delete(
        `${API_URL}/api/community/posts/${post._id}`,
        getAuthConfig()
      );
      setPosts((prev) => prev.filter((p) => p._id !== post._id));
      toast.success('Post deleted successfully');
      if (postId) navigate('/community/posts');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleEditSave = (updatedPost) => {
    setPosts((prev) =>
      prev.map((p) => (p._id === updatedPost._id ? updatedPost : p))
    );
  };

  /* ═══════════ Render View ═══════════ */

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900">
      {/* Standalone Top Navigation Bar */}
      <StudentNavbar />
      <Toaster position="top-right" />

      {/* Main Content Area (Centered Feed, No Sidebar, No Upload Option) */}
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">

        {/* ── Page Header ── */}
        <header className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">
                Alumni Nexus Community
              </p>
            </div>
            <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
              Common Posts
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              College-wide feed featuring all updates, stories, and insights from students and alumni.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => (postId ? fetchSinglePost() : fetchFeed(1))}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 disabled:opacity-50"
            >
              <span>{loading ? 'Refreshing…' : '↻ Refresh'}</span>
            </button>

            <Link
              to={dashboardPath}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              <span>Dashboard</span>
            </Link>

            <Link
              to="/community"
              className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-sky-700"
            >
              <span>Update Post</span>
              <span>→</span>
            </Link>
          </div>
        </header>

        {/* ── Single-post Back Banner ── */}
        {postId && (
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-3.5 shadow-xs">
            <Link
              to="/community/posts"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-700 transition hover:underline"
            >
              <span>← Back to all Common Posts</span>
            </Link>
            <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
              Viewing Single Post
            </span>
          </div>
        )}

        {/* ── Search & Filter Controls (Feed View Only) ── */}
        {!postId && (
          <section className="space-y-3">
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row">
              {/* Search box */}
              <div className="relative min-w-0 flex-1">
                <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-400">
                  🔍
                </span>
                <input
                  id="common-search"
                  type="search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search posts, authors, or topics…"
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                />
              </div>

              {/* Category dropdown */}
              <select
                id="common-filter"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              >
                {FILTERS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            {/* Category pills */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setCategory(f)}
                  className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                    category === f
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── Error Banner ── */}
        {loadError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center justify-between">
            <p>
              <strong className="font-semibold">Unable to load posts:</strong>{' '}
              {loadError}
            </p>
            <button
              type="button"
              onClick={() => (postId ? fetchSinglePost() : fetchFeed(1))}
              className="ml-3 shrink-0 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Posts Stream (Only Posts are visible) ── */}
        {loading ? (
          <div className="space-y-4">
            <PostSkeleton />
            <PostSkeleton />
            <PostSkeleton />
          </div>
        ) : posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                currentUser={currentUser}
                userRole={userRole}
                comments={comments[post._id] || []}
                commentHasMore={commentHasMore[post._id] || false}
                commentLoading={commentLoading[post._id] || false}
                commentsOpen={commentsOpen[post._id] || false}
                onToggleComments={() => toggleComments(post)}
                onLoadMoreComments={() => loadMoreComments(post)}
                onCommentAdded={(c) => handleCommentAdded(post, c)}
                onCommentDeleted={(c) => handleCommentDeleted(post, c)}
                onLike={() => handleLike(post)}
                onFollow={() => handleFollow(post)}
                onDelete={() => handleDeletePost(post)}
                onEditSave={handleEditSave}
                likeLoading={likeLoading[post._id] || false}
                followLoading={followLoading[post.author?._id] || false}
                apiBaseUrl={API_URL}
                getAuthConfig={getAuthConfig}
              />
            ))}

            {/* Pagination / Load More button */}
            {!postId && hasMore && (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => fetchFeed(page + 1, true)}
                  disabled={loadingMore}
                  className="rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-sky-700 shadow-xs transition hover:bg-sky-50 disabled:opacity-50"
                >
                  {loadingMore ? 'Loading more posts…' : 'Load more posts'}
                </button>
              </div>
            )}
          </div>
        ) : (
          /* ── Empty State ── */
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-xs">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-50 text-3xl">
              💬
            </div>
            <h2 className="mt-4 text-xl font-bold text-slate-800">
              No Community Posts Found
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              {search || category !== 'All Posts'
                ? 'No posts matched your current search and filter criteria. Try clearing filters or searching for something else.'
                : 'No posts published yet in your college community.'}
            </p>

            {search || category !== 'All Posts' ? (
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setCategory('All Posts');
                    setSearchInput('');
                  }}
                  className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Link
                  to="/community"
                  className="rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-sky-700"
                >
                  Create Post on Update Post Page →
                </Link>
                <Link
                  to={dashboardPath}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Back to Dashboard
                </Link>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
};

export default CommonPost;
