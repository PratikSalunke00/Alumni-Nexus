/**
 * CreatePost.jsx
 * ──────────────────────────────────────────────────────────────────────────────
 * Self-contained post composer used at the top of the Community feed.
 *
 * Props
 *   onPostCreated(newPost)  – called after a successful publish; the parent
 *                             should prepend `newPost` to its posts list.
 *   currentUser             – { name, profilePhoto }  (used for avatar)
 *   canCreate               – boolean; when false a "must be verified" notice
 *                             is shown instead of the composer.
 *   canAnnounce             – boolean; when true the "Announcement" category
 *                             is visible in the dropdown.
 *   apiBaseUrl              – base URL, e.g. "http://localhost:8080"
 *   getAuthConfig()         – returns Axios headers object with JWT bearer token
 */

import { useRef, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { upload } from '@imagekit/javascript';

const CATEGORIES = [
  'General Discussion',
  'Achievement',
  'Project',
  'Internship / Job',
  'Event',
  'Technical Knowledge',
  'Announcement',
];

const MAX_CHARS = 5000;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** Derive initials from a name string. */
const initials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0] || '')
    .join('')
    .toUpperCase() || '?';

/** Avatar component – shows photo if available, otherwise initials. */
const Avatar = ({ user, size = 'h-11 w-11' }) => {
  const src =
    user?.profilePhoto &&
    (() => {
      try {
        const u = new URL(user.profilePhoto);
        return ['http:', 'https:'].includes(u.protocol) ? u.href : '';
      } catch {
        return '';
      }
    })();

  return (
    <div
      className={`flex ${size} shrink-0 items-center justify-center overflow-hidden rounded-full bg-sky-100 text-sm font-bold text-sky-800`}
    >
      {src ? (
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        initials(user?.name)
      )}
    </div>
  );
};

const CreatePost = ({
  onPostCreated,
  currentUser = {},
  canCreate = true,
  canAnnounce = false,
  apiBaseUrl = '',
  getAuthConfig,
}) => {
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [category, setCategory] = useState('General Discussion');
  const [posting, setPosting] = useState(false);

  const previewUrlRef = useRef('');
  const fileInputRef = useRef(null);

  const visibleCategories = CATEGORIES.filter(
    (c) => c !== 'Announcement' || canAnnounce
  );

  /* ── image selection ── */
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error('Please choose a JPG, PNG, or WebP image.');
      return;
    }
    if (file.size < 1 || file.size > MAX_IMAGE_BYTES) {
      toast.error('Image must be between 1 byte and 5 MB.');
      return;
    }

    clearImage();
    const url = URL.createObjectURL(file);
    previewUrlRef.current = url;
    setImagePreview(url);
    setImageFile(file);
  };

  const clearImage = () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = '';
    setImagePreview('');
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /* ── form submission ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed && !imageFile) {
      toast.error('Write a post or attach an image before publishing.');
      return;
    }

    setPosting(true);
    try {
      let image;

      /* Upload image to ImageKit if one was selected */
      if (imageFile) {
        const { data: auth } = await axios.get(
          `${apiBaseUrl}/api/student/imagekit-auth/auth`,
          getAuthConfig()
        );
        if (!auth.token || !auth.signature || !auth.expire || !auth.publicKey) {
          throw new Error('ImageKit authentication credentials are incomplete.');
        }

        const result = await upload({
          file: imageFile,
          fileName: imageFile.name,
          token: auth.token,
          signature: auth.signature,
          expire: auth.expire,
          publicKey: auth.publicKey,
          folder: '/community-posts',
          useUniqueFileName: true,
        });

        if (!result.url || !result.fileId) {
          throw new Error('ImageKit did not return the uploaded image details.');
        }

        image = {
          url: result.url,
          fileId: result.fileId,
          name: result.name || imageFile.name,
          size: result.size || imageFile.size,
          mimeType: imageFile.type,
          filePath: result.filePath,
          width: result.width,
          height: result.height,
        };
      }

      /* Publish the post */
      const { data } = await axios.post(
        `${apiBaseUrl}/api/community/posts`,
        {
          content: trimmed,
          category,
          ...(image ? { image } : {}),
        },
        getAuthConfig()
      );

      /* Reset form */
      setContent('');
      clearImage();
      setCategory('General Discussion');

      toast.success('Your post is live! 🎉');
      onPostCreated?.(data.data);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          'Failed to publish post. Please try again.'
      );
    } finally {
      setPosting(false);
    }
  };

  /* ── render ── */
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <Avatar user={currentUser} />

        <form onSubmit={handleSubmit} className="min-w-0 flex-1">
          <label htmlFor="cp-content" className="sr-only">
            Write a community post
          </label>

          {!canCreate ? (
            /* Unverified notice */
            <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <span className="font-semibold">Account not verified.</span>{' '}
              Your account must be verified by an admin before you can publish
              community posts.
            </div>
          ) : (
            <>
              {/* Text area */}
              <textarea
                id="cp-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={MAX_CHARS}
                rows={4}
                placeholder="What's happening in your college community?"
                className="w-full resize-y rounded-xl border border-slate-200 p-3.5 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              />

              {/* Image preview */}
              {imagePreview && (
                <div className="relative mt-3 inline-block max-w-full">
                  <img
                    src={imagePreview}
                    alt="Selected post preview"
                    className="max-h-72 max-w-full rounded-xl object-contain"
                  />
                  <button
                    type="button"
                    onClick={clearImage}
                    aria-label="Remove selected image"
                    className="absolute right-2 top-2 rounded-full bg-slate-900/80 px-2.5 py-1 text-xs font-semibold text-white hover:bg-slate-900"
                  >
                    ✕ Remove
                  </button>
                </div>
              )}

              {/* Controls row */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Category picker */}
                  <label htmlFor="cp-category" className="sr-only">
                    Post category
                  </label>
                  <select
                    id="cp-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="max-w-56 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-sky-500 focus:outline-none"
                  >
                    {visibleCategories.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>

                  {/* Image picker */}
                  <label
                    htmlFor="cp-image"
                    className="cursor-pointer rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 active:bg-slate-100"
                  >
                    📷 Add image
                  </label>
                  <input
                    ref={fileInputRef}
                    id="cp-image"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageSelect}
                    className="sr-only"
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={posting || (!content.trim() && !imageFile)}
                  className="rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {posting
                    ? imageFile
                      ? 'Uploading & publishing…'
                      : 'Publishing…'
                    : 'Publish post'}
                </button>
              </div>

              {/* Character count */}
              <p className="mt-1.5 text-right text-xs text-slate-400">
                {content.length}/{MAX_CHARS}
              </p>
            </>
          )}
        </form>
      </div>
    </section>
  );
};

export default CreatePost;

