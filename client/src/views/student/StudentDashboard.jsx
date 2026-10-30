import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';

import DashboardShell from '../../components/DashboardShell';
import StatCard from '../../components/StatCard';
import StudentNavbar from '../../components/studentNavbar';
import ProfileCompletion from '../../components/ProfileCompletion';
import CreatePost from '../../components/community/CreatePost';
import PostCard from '../../components/community/PostCard';

import {
  studentStats,
  featuredOpportunities,
  alumniRecommendations,
  recentUpdates,
} from '../../data/mockData';

const API_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const StudentDashboard = () => {
  const navigate = useNavigate();

  const [studentName, setStudentName] = useState('Student');
  const [profile, setProfile] = useState({});
  const [profileLoading, setProfileLoading] = useState(true);

  // Community posts state on student dashboard
  const [recentPosts, setRecentPosts] = useState([]);
  const [communityLoading, setCommunityLoading] = useState(true);
  const [comments, setComments] = useState({});
  const [commentsOpen, setCommentsOpen] = useState({});
  const [commentLoading, setCommentLoading] = useState({});
  const [commentHasMore, setCommentHasMore] = useState({});
  const [likeLoading, setLikeLoading] = useState({});
  const [followLoading, setFollowLoading] = useState({});

  const getAuthConfig = useCallback(() => {
    const token =
      localStorage.getItem('token') ||
      localStorage.getItem('userJwtToken') ||
      '';
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  }, []);

  // Get the logged-in student's name from localStorage.
  useEffect(() => {
    try {
      const user = JSON.parse(
        localStorage.getItem('user') || 'null'
      ) || {};

      const userData = JSON.parse(
        localStorage.getItem('userData') || 'null'
      ) || {};

      const storedName =
        localStorage.getItem('name') ||
        user.name ||
        user.fullName ||
        userData.name ||
        userData.fullName ||
        userData.user?.name ||
        userData.user?.fullName;

      if (typeof storedName === 'string' && storedName.trim()) {
        setStudentName(storedName.trim());
      }
    } catch (error) {
      console.error(
        'Unable to read student information:',
        error
      );
    }
  }, []);

  // Fetch the saved profile from the API
  const fetchProfile = useCallback(async () => {
    setProfileLoading(true);

    try {
      const token =
        localStorage.getItem('userJwtToken') ||
        localStorage.getItem('token');

      if (!token) {
        setProfile({});
        return;
      }

      const response = await axios.get(
        `${API_URL}/api/student/profile/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const responseData = response.data;

      const savedProfile =
        responseData?.profile ||
        responseData?.student ||
        responseData?.data?.profile ||
        responseData?.data?.student ||
        responseData?.data ||
        responseData;

      const profileData =
        savedProfile &&
        typeof savedProfile === 'object' &&
        !Array.isArray(savedProfile)
          ? savedProfile
          : {};

      setProfile(profileData);

      // Keep localStorage verificationStatus in sync
      if (profileData?.verificationStatus) {
        try {
          const current = JSON.parse(localStorage.getItem('userData') || '{}');
          current.verificationStatus = profileData.verificationStatus;
          localStorage.setItem('userData', JSON.stringify(current));
        } catch {}
      }
    } catch (error) {
      console.error(
        'Unable to fetch student profile:',
        error.response?.data || error.message
      );

      setProfile({});
    } finally {
      setProfileLoading(false);
    }
  }, []);

  // Fetch recent community posts for the student dashboard
  const fetchRecentPosts = useCallback(async () => {
    setCommunityLoading(true);
    try {
      const token =
        localStorage.getItem('token') ||
        localStorage.getItem('userJwtToken') ||
        '';

      if (!token) {
        setRecentPosts([]);
        return;
      }

      const response = await axios.get(`${API_URL}/api/community/posts`, {
        ...getAuthConfig(),
        params: { limit: 3, page: 1 },
      });

      const list = response.data?.data || response.data?.posts || [];
      setRecentPosts(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error('Failed to load recent community posts:', error);
    } finally {
      setCommunityLoading(false);
    }
  }, [getAuthConfig]);

  // Fetch on page load and refresh when the user returns to the tab.
  useEffect(() => {
    fetchProfile();
    fetchRecentPosts();

    const handleFocus = () => {
      fetchProfile();
      fetchRecentPosts();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchProfile, fetchRecentPosts]);

  // Current logged in user info for posts and comments
  const localUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('userData') || '{}');
    } catch {
      return {};
    }
  })();
  const userRole = (
    localStorage.getItem('role') ||
    localUser.role ||
    'student'
  ).toLowerCase();

  const currentUser = {
    _id: localUser._id || localUser.id || localStorage.getItem('userId'),
    id: localUser._id || localUser.id || localStorage.getItem('userId'),
    name: studentName,
    profilePhoto:
      profile.photo ||
      profile.profilePhoto ||
      localUser.profilePhoto ||
      '',
  };

  const canCreatePost =
    userRole === 'admin' ||
    localUser.verificationStatus === 'verified' ||
    localUser.verified === true ||
    profile.verificationStatus === 'verified';

  // Handler when a post is published from the Student Dashboard
  const handlePostCreated = (newPost) => {
    setRecentPosts((prev) => [newPost, ...prev.filter((p) => p._id !== newPost._id)]);
    toast.success('Your post is live on the Update Post page! 🎉');
  };

  // Like / Unlike handler
  const handleLike = async (post) => {
    if (likeLoading[post._id]) return;
    const likedByMe = !post.likedByMe;
    setLikeLoading((prev) => ({ ...prev, [post._id]: true }));

    setRecentPosts((prev) =>
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
      setRecentPosts((prev) =>
        prev.map((p) =>
          p._id === post._id
            ? { ...p, likedByMe: post.likedByMe, likeCount: post.likeCount }
            : p
        )
      );
      toast.error(error.response?.data?.message || 'Unable to update like');
    } finally {
      setLikeLoading((prev) => ({ ...prev, [post._id]: false }));
    }
  };

  // Toggle comments
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
      toast.error('Unable to load comments');
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
      toast.error('Unable to load more comments');
    } finally {
      setCommentLoading((prev) => ({ ...prev, [post._id]: false }));
    }
  };

  const handleCommentAdded = (post, comment) => {
    setComments((prev) => ({
      ...prev,
      [post._id]: [...(prev[post._id] || []), comment],
    }));
    setRecentPosts((prev) =>
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
    setRecentPosts((prev) =>
      prev.map((p) =>
        p._id === post._id
          ? { ...p, commentCount: Math.max(0, p.commentCount - 1) }
          : p
      )
    );
  };

  // Follow / Unfollow handler
  const handleFollow = async (post) => {
    const authorId = post.author?._id;
    if (!authorId || followLoading[authorId]) return;

    const following = !post.followingAuthor;
    setFollowLoading((prev) => ({ ...prev, [authorId]: true }));

    setRecentPosts((prev) =>
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
        following ? 'Following this member.' : 'Unfollowed member.'
      );
    } catch (error) {
      // Revert optimistic update
      setRecentPosts((prev) =>
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
      toast.error(error.response?.data?.message || 'Unable to update follow');
    } finally {
      setFollowLoading((prev) => ({ ...prev, [authorId]: false }));
    }
  };

  const handleDeletePost = async (post) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await axios.delete(
        `${API_URL}/api/community/posts/${post._id}`,
        getAuthConfig()
      );
      setRecentPosts((prev) => prev.filter((p) => p._id !== post._id));
      toast.success('Post deleted');
    } catch (error) {
      toast.error('Unable to delete post');
    }
  };

  const handleEditSave = (updatedPost) => {
    setRecentPosts((prev) =>
      prev.map((p) => (p._id === updatedPost._id ? updatedPost : p))
    );
  };

  return (
    <>
      <StudentNavbar />
      <Toaster position="top-right" />

      <DashboardShell
        role="student"
        pageTitle={`Welcome back, ${studentName}`}
      >
        <div className="space-y-6">
          {/* Shared profile completion component */}
          <ProfileCompletion
            profile={profile}
            loading={profileLoading}
          />

          {/* Student statistics */}
          <section className="grid gap-4 md:grid-cols-3">
            {studentStats.map((stat, index) => (
              <StatCard
                key={stat.label}
                {...stat}
                accent={
                  index % 2 === 0
                    ? 'indigo'
                    : index === 1
                      ? 'emerald'
                      : 'amber'
                }
              />
            ))}
          </section>

          {/* ═════════════════════════════════════════════════════════════════════
              COMMUNITY POSTS SECTION (Connected to Common Posts page & backend)
          ═════════════════════════════════════════════════════════════════════ */}
          <section className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50/70 p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">
                  College Network
                </p>
                <h3 className="mt-1 text-xl font-bold text-slate-900">Update Post</h3>
                <p className="mt-0.5 text-sm text-slate-600">
                  Publish updates, achievements, or opportunities visible to all students and alumni on the Update Post page.
                </p>
              </div>

              <Link
                to="/community/posts"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-sky-700 shadow-sm transition hover:bg-sky-50"
              >
                <span>Open Update Post page</span>
                <span>→</span>
              </Link>
            </div>

            {/* Post Composer connected to ImageKit & /api/community/posts */}
            <CreatePost
              onPostCreated={handlePostCreated}
              currentUser={currentUser}
              canCreate={canCreatePost}
              canAnnounce={userRole === 'admin'}
              apiBaseUrl={API_URL}
              getAuthConfig={getAuthConfig}
            />

            {/* Live Feed Preview */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-semibold text-slate-800">
                  Recent Updates & Posts
                </h4>
                <button
                  type="button"
                  onClick={fetchRecentPosts}
                  disabled={communityLoading}
                  className="text-xs font-medium text-slate-500 hover:text-sky-600 disabled:opacity-50"
                >
                  {communityLoading ? 'Refreshing…' : '↻ Refresh'}
                </button>
              </div>

              {communityLoading ? (
                <div className="space-y-3">
                  {[0, 1].map((i) => (
                    <div
                      key={i}
                      className="h-32 animate-pulse rounded-2xl bg-white border border-slate-200"
                    />
                  ))}
                </div>
              ) : recentPosts.length > 0 ? (
                <div className="space-y-4">
                  {recentPosts.slice(0, 3).map((post) => (
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

                  <div className="pt-2 text-center">
                    <Link
                      to="/community/posts"
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-sky-700 shadow-sm transition hover:bg-sky-50"
                    >
                      <span>View all on Update Post page</span>
                      <span>→</span>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
                  <div className="text-3xl">💬</div>
                  <p className="mt-2 text-sm font-medium text-slate-700">
                    No posts yet.
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Be the first to share an update with your college network!
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Opportunities and status updates */}
          <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-900">
                  Recommended opportunities
                </h3>

                <button
                  type="button"
                  onClick={() => navigate('/student/opportunities')}
                  className="text-sm font-medium text-sky-600"
                >
                  View all
                </button>
              </div>

              <div className="space-y-4">
                {featuredOpportunities.map((item) => (
                  <div
                    key={item.title}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div>
                      <p className="text-lg font-semibold text-slate-900">
                        {item.title}
                      </p>

                      <p className="text-sm text-slate-600">
                        {item.company} · {item.type} · {item.location}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        {item.match}
                      </div>

                      <button
                        type="button"
                        onClick={() => navigate('/student/opportunities')}
                        className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-900">
                  Recent status updates
                </h3>

                <button
                  type="button"
                  onClick={() => navigate('/student/opportunities')}
                  className="text-sm font-medium text-indigo-600"
                >
                  Track
                </button>
              </div>

              <div className="space-y-3">
                {recentUpdates.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl bg-slate-50 p-3"
                  >
                    <p className="font-medium text-slate-800">
                      {item.title}
                    </p>

                    <div className="mt-2 flex items-center justify-between text-sm text-slate-600">
                      <span>{item.company}</span>

                      <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Alumni recommendations and quick actions */}
          <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-900">
                  Verified alumni
                </h3>

                <button
                  type="button"
                  onClick={() => navigate('/student/alumni')}
                  className="text-sm font-medium text-sky-600"
                >
                  Explore
                </button>
              </div>

              <div className="space-y-4">
                {alumniRecommendations.map((alumni) => (
                  <div
                    key={alumni.name}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        {alumni.name}
                      </p>

                      <p className="text-sm text-slate-600">
                        {alumni.role} · {alumni.company}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => navigate('/student/alumni')}
                      className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700 hover:bg-sky-100"
                    >
                      Connect
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-900">
                  Quick actions
                </h3>

                <button
                  type="button"
                  onClick={() => navigate('/student/alumni')}
                  className="text-sm font-medium text-sky-600"
                >
                  Open alumni hub
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  {
                    label: 'Find alumni',
                    path: '/student/alumni',
                  },
                  {
                    label: 'Browse opportunities',
                    path: '/student/opportunities',
                  },
                  {
                    label: 'Request referral',
                    path: '/student/referrals',
                  },
                ].map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => navigate(action.path)}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left text-sm font-medium text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>
      </DashboardShell>
    </>
  );
};

export default StudentDashboard;
