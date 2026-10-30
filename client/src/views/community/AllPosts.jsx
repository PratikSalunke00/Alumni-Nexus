/**
 * client/src/views/community/AllPosts.jsx
 * ──────────────────────────────────────────────────────────────────────────────
 * Community feed page – accessible to students, alumni, and admins.
 *
 * Features
 *   ✓ Create posts (text, image, or both) via ImageKit upload
 *   ✓ Paginated feed (newest-first)
 *   ✓ Category filter + keyword search
 *   ✓ Like / unlike with optimistic UI update
 *   ✓ Comments (add, delete, paginate)
 *   ✓ Follow / unfollow authors
 *   ✓ Edit and delete own posts (admins can delete any)
 *   ✓ Share post (Web Share API or clipboard fallback)
 *   ✓ Loading skeletons, empty states, and error states
 *   ✓ Responsive (mobile-first, desktop sidebar via DashboardShell)
 *
 * All data is fetched from the existing MERN backend using the /api/community/*
 * endpoints with JWT Bearer authentication (token stored in localStorage).
 */

import { useCallback, useDeferredValue, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { Link, useNavigate, useParams } from 'react-router-dom';

import DashboardShell from '../../components/DashboardShell';
import CreatePost from '../../components/community/CreatePost';
import PostCard from '../../components/community/PostCard';

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

/** Returns Axios config with JWT Bearer header. */
const getAuthConfig = () => ({
  headers: {
    Authorization: `Bearer ${
      localStorage.getItem('token') || localStorage.getItem('userJwtToken') || ''
    }`,
  },
});

const getErrorMessage = (error) =>
  error.response?.data?.message || error.message || 'Something went wrong. Please try again.';

/** Read the saved user object from localStorage. */
const getLocalUser = () => {
  try {
    return JSON.parse(localStorage.getItem('userData') || '{}');
  } catch {
    return {};
  }
};

/* ── Loading skeleton ── */
const PostSkeleton = () => (
  <div className="animate-pulse space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
    <div className="flex items-start gap-3">
      <div className="h-11 w-11 shrink-0 rounded-full bg-slate-200" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-32 rounded bg-slate-200" />
        <div className="h-3 w-48 rounded bg-slate-100" />
        <div className="h-3 w-24 rounded bg-slate-100" />
      </div>
    </div>
    <div className="h-3 w-full rounded bg-slate-100" />
    <div className="h-3 w-4/5 rounded bg-slate-100" />
    <div className="h-44 w-full rounded-xl bg-slate-100" />
  </div>
);

/* ══════════════════════════════════════════════════════════════════════════════
   AllPosts Component
══════════════════════════════════════════════════════════════════════════════ */
const AllPosts = () => {
  const { postId } = useParams();
  const navigate = useNavigate();

  /* ── Session data ── */
  const localUser = getLocalUser();
  const userRole = (
    localStorage.getItem('role') || localUser.role || ''
  ).toLowerCase();
  const currentUser = {
    _id: localUser._id || localUser.id || localStorage.getItem('userId'),
    id:  localUser._id || localUser.id || localStorage.getItem('userId'),
    name: localStorage.getItem('name') || localUser.name || 'You',
    profilePhoto: localUser.profilePhoto || '',
  };
  const canCreatePost =
    userRole === 'admin' || localUser.verificationStatus === 'verified';
  const canAnnounce = userRole === 'admin';

  /* ── Feed state ── */
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  /* ── Filter / search state ── */
  const [category, setCategory] = useState('All Posts');
  const [searchInput, setSearchInput] = useState('');
  const search = useDeferredValue(searchInput.trim());

  /* ── Comment state (per post) ── */
  const [comments, setComments] = useState({});         // { [postId]: Comment[] }
  const [commentsOpen, setCommentsOpen] = useState({});  // { [postId]: boolean }
  const [commentLoading, setCommentLoading] = useState({});
  const [commentHasMore, setCommentHasMore] = useState({});

  /* ── Like / follow loading ── */
  const [likeLoading, setLikeLoading] = useState({});   // { [postId]: boolean }
  const [followLoading, setFollowLoading] = useState({}); // { [authorId]: boolean }

  /* Abort-stale-request counter */
  const requestId = useRef(0);

  /* ═══════════ Data fetching ═══════════ */

  const fetchFeed = useCallback(
    async (requestedPage = 1, append = false) => {
      const rid = ++requestId.current;
      if (append) setLoadingMore(true);
      else {
        setLoading(true);
        setLoadError('');
      }
      try {
        const { data } = await axios.get(`${API_URL}/api/community/posts`, {
          ...getAuthConfig(),
          params: {
            page: requestedPage,
            limit: PAGE_SIZE,
            category,
            ...(search ? { search } : {}),
          },
        });
        if (rid !== requestId.current) return;
        setPosts((prev) => (append ? [...prev, ...data.data] : data.data));
        setPage(requestedPage);
        setHasMore(Boolean(data.pagination?.hasMore));
      } catch (error) {
        if (rid !== requestId.current) return;
        const msg = getErrorMessage(error);
        setLoadError(msg);
        toast.error(msg);
      } finally {
        if (rid === requestId.current) {
          setLoading(false);
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
      if (rid === requestId.current) setPosts([data.data]);
    } catch (error) {
      if (rid !== requestId.current) return;
      const msg = getErrorMessage(error);
      setLoadError(msg);
    } finally {
      if (rid === requestId.current) setLoading(false);
    }
  }, [postId]);

  /* Initial load + re-fetch on filter / search change */
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (postId) fetchSinglePost();
      else fetchFeed(1);
    }, 0);
    return () => {
      window.clearTimeout(timer);
      requestId.current += 1;
    };
  }, [postId, fetchFeed, fetchSinglePost]);

  /* ═══════════ Create post ═══════════ */

  const handlePostCreated = (newPost) => {
    /* Optimistically prepend if it matches the current feed filter */
    if (
      !postId &&
      (category === 'All Posts' || category === newPost.category) &&
      (!search || newPost.content?.toLowerCase().includes(search.toLowerCase()))
    ) {
      setPosts((prev) => [newPost, ...prev.filter((p) => p._id !== newPost._id)]);
    } else if (!postId) {
      fetchFeed(1);
    }
  };

  /* ═══════════ Like / Unlike ═══════════ */

  const handleLike = async (post) => {
    if (likeLoading[post._id]) return;
    const likedByMe = !post.likedByMe;
    setLikeLoading((prev) => ({ ...prev, [post._id]: true }));
    setPosts((prev) =>
      prev.map((p) =>
        p._id === post._id
          ? { ...p, likedByMe, likeCount: Math.max(0, p.likeCount + (likedByMe ? 1 : -1)) }
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
      /* Revert optimistic update on failure */
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

  /* ═══════════ Comments ═══════════ */

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
      setComments((prev) => ({ ...prev, [post._id]: data.data }));
      setCommentHasMore((prev) => ({ ...prev, [post._id]: Boolean(data.pagination?.hasMore) }));
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
        [post._id]: [...data.data, ...list],
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
        p._id === post._id ? { ...p, commentCount: p.commentCount + 1 } : p
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
          ? { ...p, commentCount: Math.max(0, p.commentCount - 1) }
          : p
      )
    );
  };

  /* ═══════════ Follow / Unfollow ═══════════ */

  const handleFollow = async (post) => {
    const authorId = post.author?._id;
    if (!authorId || followLoading[authorId]) return;

    const following = !post.followingAuthor;
    setFollowLoading((prev) => ({ ...prev, [authorId]: true }));
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
      toast.success(following ? 'Following this member.' : 'Unfollowed this member.');
    } catch (error) {
      /* Revert optimistic update */
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

  /* ═══════════ Delete post ═══════════ */

  const handleDeletePost = async (post) => {
    if (!window.confirm('Delete this post and all its comments? This cannot be undone.'))
      return;
    try {
      await axios.delete(
        `${API_URL}/api/community/posts/${post._id}`,
        getAuthConfig()
      );
      setPosts((prev) => prev.filter((p) => p._id !== post._id));
      toast.success('Post deleted.');
      if (postId) navigate('/community');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  /* ═══════════ Edit post ═══════════ */

  const handleEditSave = (updatedPost) => {
    setPosts((prev) =>
      prev.map((p) => (p._id === updatedPost._id ? updatedPost : p))
    );
  };

  /* ═══════════ Render ═══════════ */

  return (
    <DashboardShell role={userRole} pageTitle="Community">
      <Toaster position="top-right" />

      <div className="mx-auto max-w-4xl space-y-6">

        {/* ── Page header ── */}
        <header>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Community</h1>
          <p className="mt-2 text-sm text-slate-600">
            Connect, share knowledge, and grow with your college community.
          </p>
        </header>

        {/* ── Single-post back link ── */}
        {postId && (
          <Link
            to="/community"
            className="inline-flex items-center gap-1 text-sm font-semibold text-sky-700 hover:underline"
          >
            ← Back to Community
          </Link>
        )}

        {/* ── Post composer (feed view only) ── */}
        {!postId && (
          <CreatePost
            onPostCreated={handlePostCreated}
            currentUser={currentUser}
            canCreate={canCreatePost}
            canAnnounce={canAnnounce}
            apiBaseUrl={API_URL}
            getAuthConfig={getAuthConfig}
          />
        )}

        {/* ── Filter / search bar (feed view only) ── */}
        {!postId && (
          <section className="space-y-3">
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row">
              <label htmlFor="community-search" className="sr-only">
                Search posts and authors
              </label>
              <input
                id="community-search"
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search posts and people…"
                className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />
              <label htmlFor="community-filter" className="sr-only">
                Filter by category
              </label>
              <select
                id="community-filter"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
              >
                {FILTERS.map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            </div>

            {/* Category pills */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setCategory(f)}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                    category === f
                      ? 'bg-sky-600 text-white'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ── Feed ── */}
        {loading ? (
          /* Loading skeletons */
          <div className="space-y-4" aria-label="Loading community posts">
            {[0, 1, 2].map((i) => (
              <PostSkeleton key={i} />
            ))}
          </div>
        ) : loadError ? (
          /* Error state */
          <section className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
            <p className="font-semibold text-rose-900">Could not load the community feed</p>
            <p className="mt-2 text-sm text-rose-700">{loadError}</p>
            <button
              type="button"
              onClick={() => (postId ? fetchSinglePost() : fetchFeed(1))}
              className="mt-4 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700"
            >
              Try again
            </button>
          </section>
        ) : posts.length ? (
          /* Posts list */
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
                onCommentAdded={(comment) => handleCommentAdded(post, comment)}
                onCommentDeleted={(comment) => handleCommentDeleted(post, comment)}
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

            {/* Load more */}
            {!postId && hasMore && (
              <div className="text-center">
                <button
                  type="button"
                  disabled={loadingMore}
                  onClick={() => fetchFeed(page + 1, true)}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-sky-700 hover:bg-sky-50 disabled:opacity-50"
                >
                  {loadingMore ? 'Loading…' : 'Load older posts'}
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Empty state */
          <section className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sky-50 text-2xl text-sky-600">
              ✦
            </div>
            <h2 className="mt-4 font-semibold text-slate-900">
              {postId
                ? 'Post not found'
                : search || category !== 'All Posts'
                ? 'No matching posts'
                : 'Start the conversation'}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              {postId
                ? 'This post may have been removed or belongs to another college community.'
                : search || category !== 'All Posts'
                ? 'Try a different search or category filter.'
                : 'Be the first to share an achievement, project, opportunity, or idea with your college community.'}
            </p>
            {(search || category !== 'All Posts') && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setCategory('All Posts');
                }}
                className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Clear filters
              </button>
            )}
          </section>
        )}
      </div>
    </DashboardShell>
  );
};

export default AllPosts;

