
import { useEffect, useState } from "react";

const API_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const getAuthData = () => {
  try {
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");

    return {
      token: userData.token || localStorage.getItem("token"),
      userId: userData.userId || userData._id,
    };
  } catch {
    return {
      token: localStorage.getItem("token"),
      userId: null,
    };
  }
};

const getHeaders = () => {
  const { token } = getAuthData();

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

const formatDate = (date) => {
  if (!date) return "";

  const time = new Date(date);
  return time.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function CommonPost() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [commentInputs, setCommentInputs] = useState({});
  const [submittingComment, setSubmittingComment] = useState(null);

  const { userId } = getAuthData();

  // Fetch all college posts
  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/api/posts`, {
        method: "GET",
        headers: getHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load posts");
      }

      setPosts(Array.isArray(data) ? data : data.posts || []);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Like / Unlike post
  const handleLike = async (postId) => {
    try {
      const response = await fetch(
        `${API_URL}/api/posts/${postId}/like`,
        {
          method: "POST",
          headers: getHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to like post");
      }

      // Refresh post data from database
      await fetchPosts();
    } catch (err) {
      alert(err.message);
    }
  };

  // Add comment
  const handleComment = async (postId) => {
    const comment = commentInputs[postId]?.trim();

    if (!comment) return;

    try {
      setSubmittingComment(postId);

      const response = await fetch(
        `${API_URL}/api/posts/${postId}/comments`,
        {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({ text: comment }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to add comment");
      }

      setCommentInputs((prev) => ({
        ...prev,
        [postId]: "",
      }));

      await fetchPosts();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmittingComment(null);
    }
  };

  // Share post
  const handleShare = async (postId) => {
    const postUrl = `${window.location.origin}/posts/${postId}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Alumni Nexus",
          text: "Check out this college community post!",
          url: postUrl,
        });
      } else {
        await navigator.clipboard.writeText(postUrl);
        alert("Post link copied successfully!");
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        alert("Unable to share this post");
      }
    }
  };

  const getAuthor = (post) => {
    return post.author || post.user || {};
  };

  const getAuthorName = (post) => {
    const author = getAuthor(post);
    return author.name || author.fullName || "College Member";
  };

  const getAuthorImage = (post) => {
    const author = getAuthor(post);

    return (
      author.profilePhoto ||
      author.profileImage ||
      author.avatar ||
      ""
    );
  };

  const getComments = (post) => {
    return Array.isArray(post.comments) ? post.comments : [];
  };

  const getLikes = (post) => {
    return Array.isArray(post.likes) ? post.likes : [];
  };

  const isLiked = (post) => {
    return getLikes(post).some((like) => {
      const id =
        typeof like === "object"
          ? like._id || like.userId
          : like;

      return String(id) === String(userId);
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-5xl">

        {/* Page heading */}
        <div className="mb-7">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">
            Alumni Nexus
          </p>
          

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Community Posts
          </h1>

          <p className="mt-2 text-slate-500">
            Connect, share knowledge, and grow with your college community.
          </p>
        </div>

        {/* Posts header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">
            Latest Posts
          </h2>

          <button
            onClick={fetchPosts}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            ↻ Refresh
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <p className="text-slate-500">Loading community posts...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-center">
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchPosts}
              className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-white"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && posts.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="mb-4 text-5xl">💬</div>

            <h3 className="text-xl font-bold text-slate-800">
              No posts yet
            </h3>

            <p className="mt-2 text-slate-500">
              Be the first to share something with your college community!
            </p>
          </div>
        )}

        {/* Posts feed */}
        <div className="space-y-6">
          {!loading && posts.map((post) => {
            const author = getAuthor(post);
            const authorImage = getAuthorImage(post);
            const authorName = getAuthorName(post);
            const comments = getComments(post);
            const likes = getLikes(post);

            return (
              <article
                key={post._id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
              >
                {/* Author details */}
                <div className="flex items-center gap-3 p-5">
                  {authorImage ? (
                    <img
                      src={authorImage}
                      alt={authorName}
                      className="h-12 w-12 rounded-full border border-slate-200 object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-lg font-bold text-violet-700">
                      {authorName.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-900">
                      {authorName}
                    </h3>

                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="rounded-full bg-sky-50 px-2 py-1 font-medium capitalize text-sky-700">
                        {author.role || "Member"}
                      </span>

                      <span>•</span>

                      <span>
                        {formatDate(post.createdAt)}
                      </span>
                    </div>
                  </div>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    {post.category || "General Discussion"}
                  </span>
                </div>

                {/* Post content */}
                {post.content && (
                  <div className="px-5 pb-4">
                    <p className="whitespace-pre-wrap break-words text-[15px] leading-7 text-slate-700">
                      {post.content}
                    </p>
                  </div>
                )}

                {/* Post image */}
                {(post.image || post.imageUrl) && (
                  <div className="px-5 pb-4">
                    <img
                      src={post.image || post.imageUrl}
                      alt="Community post"
                      className="max-h-[550px] w-full rounded-xl border border-slate-100 object-contain"
                      loading="lazy"
                    />
                  </div>
                )}

                {/* Like and comment count */}
                <div className="mx-5 flex items-center justify-between border-b border-slate-100 py-3 text-sm text-slate-500">
                  <span>
                    ❤️ {likes.length} Likes
                  </span>

                  <span>
                    {comments.length} Comments
                  </span>
                </div>

                {/* Action buttons */}
                <div className="grid grid-cols-3 gap-2 px-5 py-3">
                  <button
                    onClick={() => handleLike(post._id)}
                    className={`rounded-lg py-2.5 text-sm font-semibold transition ${
                      isLiked(post)
                        ? "bg-sky-50 text-sky-700"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {isLiked(post) ? "❤️ Liked" : "♡ Like"}
                  </button>

                  <button
                    onClick={() =>
                      document
                        .getElementById(`comment-${post._id}`)
                        ?.focus()
                    }
                    className="rounded-lg py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    💬 Comment
                  </button>

                  <button
                    onClick={() => handleShare(post._id)}
                    className="rounded-lg py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    ↗ Share
                  </button>
                </div>

                {/* Comments section */}
                <div className="border-t border-slate-100 bg-slate-50 p-5">
                  <h4 className="mb-4 text-sm font-bold text-slate-800">
                    Comments
                  </h4>

                  <div className="mb-4 space-y-3">
                    {comments.map((comment, index) => {
                      const commentAuthor =
                        comment.user || comment.author || {};

                      return (
                        <div
                          key={comment._id || index}
                          className="flex gap-3"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-700">
                            {(commentAuthor.name || "U")
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div className="flex-1 rounded-xl bg-white p-3">
                            <p className="text-sm font-semibold text-slate-800">
                              {commentAuthor.name || "College Member"}
                            </p>

                            <p className="mt-1 break-words text-sm text-slate-600">
                              {comment.text || comment.content}
                            </p>
                          </div>
                        </div>
                      );
                    })}

                    {comments.length === 0 && (
                      <p className="text-sm text-slate-400">
                        No comments yet. Start the conversation!
                      </p>
                    )}
                  </div>

                  {/* Add comment */}
                  <div className="flex gap-2">
                    <input
                      id={`comment-${post._id}`}
                      type="text"
                      placeholder="Write a comment..."
                      value={commentInputs[post._id] || ""}
                      onChange={(e) =>
                        setCommentInputs((prev) => ({
                          ...prev,
                          [post._id]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleComment(post._id);
                        }
                      }}
                      className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-sky-400"
                    />

                    <button
                      onClick={() => handleComment(post._id)}
                      disabled={
                        submittingComment === post._id ||
                        !commentInputs[post._id]?.trim()
                      }
                      className="rounded-xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {submittingComment === post._id
                        ? "..."
                        : "Send"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
