import Opportunity from "../models/Opportunity.js";
import Referral from "../models/Referral.js";
import MentorshipRequest from "../models/MentorshipRequest.js";
import mongoose from "mongoose";
import User from "../models/User.js";
import Post, { COMMUNITY_CATEGORIES } from "../models/Post.js";
import Comment from "../models/Comment.js";
import PostLike from "../models/PostLike.js";
import Follow from "../models/Follow.js";
import StudentProfile from "../models/StudentProfile.js";

const COMMUNITY_ROLES = ["student", "alumni", "admin"];
const AUTHOR_FIELDS = "name role profilePhoto headline branch department company jobTitle collegeId";
const COMMUNITY_AUTHOR_POPULATE = {
  path: "author",
  select: AUTHOR_FIELDS,
  match: { isActive: true },
  populate: { path: "collegeId", select: "name" },
};
const isValidId = (id) => mongoose.isValidObjectId(id);
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const hasValidPostId = (req, res) => {
  if (isValidId(req.params.postId)) return true;
  res.status(400).json({ success: false, message: "Invalid post ID" });
  return false;
};

const getCommunityUser = async (req, res) => {
  const userId = req.user?.userId || req.user?.id || req.user?._id;
  if (!isValidId(userId)) {
    res.status(401).json({ success: false, message: "Authentication required" });
    return null;
  }

  const user = await User.findById(userId)
    .select("name role collegeId profilePhoto headline branch department company jobTitle verificationStatus isActive")
    .lean();
  if (!user || !user.isActive || !COMMUNITY_ROLES.includes(user.role) || !user.collegeId) {
    res.status(403).json({ success: false, message: "You cannot access the community feed" });
    return null;
  }
  return user;
};

const attachStudentProfilePhotos = async (records) => {
  const missingPhotos = records
    .map((record) => record.author)
    .filter((author) => author?._id && !author.profilePhoto);
  const userIds = [...new Set(missingPhotos.map((author) => String(author._id)))];
  if (!userIds.length) return records;

  const profiles = await StudentProfile.find({
    user: { $in: userIds },
    photo: { $type: "string", $ne: "" },
  })
    .select("user photo")
    .lean();
  const photos = new Map(profiles.map((profile) => [String(profile.user), profile.photo]));

  return records.map((record) => {
    const photo = record.author && photos.get(String(record.author._id));
    return photo
      ? { ...record, author: { ...record.author, profilePhoto: photo } }
      : record;
  });
};

const getCollegePost = async (postId, collegeId) => {
  if (!isValidId(postId)) return null;
  return Post.findOne({ _id: postId, collegeId })
    .populate(COMMUNITY_AUTHOR_POPULATE)
    .lean();
};

const postStats = async (posts, userId) => {
  posts = await attachStudentProfilePhotos(posts);
  const postIds = posts.map((post) => post._id);
  if (!postIds.length) return [];

  const authorIds = [...new Set(posts.map((post) => post.author?._id).filter(Boolean).map(String))];
  const [likes, comments, ownLikes, follows, followerCounts, followingCounts] = await Promise.all([
    PostLike.aggregate([
      { $match: { postId: { $in: postIds }, collegeId: posts[0].collegeId } },
      { $group: { _id: "$postId", count: { $sum: 1 } } },
    ]),
    Comment.aggregate([
      { $match: { postId: { $in: postIds }, collegeId: posts[0].collegeId } },
      { $group: { _id: "$postId", count: { $sum: 1 } } },
    ]),
    PostLike.find({ postId: { $in: postIds }, userId, collegeId: posts[0].collegeId }).distinct("postId"),
    Follow.find({
      followerId: userId,
      collegeId: posts[0].collegeId,
      followingId: { $in: authorIds },
    }).distinct("followingId"),
    Follow.aggregate([
      { $match: { collegeId: posts[0].collegeId, followingId: { $in: authorIds.map((id) => new mongoose.Types.ObjectId(id)) } } },
      { $group: { _id: "$followingId", count: { $sum: 1 } } },
    ]),
    Follow.aggregate([
      { $match: { collegeId: posts[0].collegeId, followerId: { $in: authorIds.map((id) => new mongoose.Types.ObjectId(id)) } } },
      { $group: { _id: "$followerId", count: { $sum: 1 } } },
    ]),
  ]);
  const likeCounts = new Map(likes.map((item) => [String(item._id), item.count]));
  const commentCounts = new Map(comments.map((item) => [String(item._id), item.count]));
  const likedIds = new Set(ownLikes.map(String));
  const followingIds = new Set(follows.map(String));
  const followerCountByUser = new Map(followerCounts.map((item) => [String(item._id), item.count]));
  const followingCountByUser = new Map(followingCounts.map((item) => [String(item._id), item.count]));

  return posts.map((post) => ({
    ...post,
    likeCount: likeCounts.get(String(post._id)) || 0,
    commentCount: commentCounts.get(String(post._id)) || 0,
    likedByMe: likedIds.has(String(post._id)),
    followingAuthor: followingIds.has(String(post.author?._id)),
    author: post.author
      ? {
          ...post.author,
          followerCount: followerCountByUser.get(String(post.author._id)) || 0,
          followingCount: followingCountByUser.get(String(post.author._id)) || 0,
        }
      : post.author,
  }));
};

const serializePost = async (post, userId) => {
  const [serialized] = await postStats([post], userId);
  return serialized;
};

export const getCommunityPosts = async (req, res) => {
  try {
    const user = await getCommunityUser(req, res);
    if (!user) return;

    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(30, Math.max(1, Number.parseInt(req.query.limit, 10) || 10));
    const category = typeof req.query.category === "string" ? req.query.category.trim() : "";
    const search = typeof req.query.search === "string" ? req.query.search.trim().slice(0, 100) : "";
    const authorId = typeof req.query.authorId === "string" ? req.query.authorId.trim() : "";

    if (category && category !== "All Posts" && !COMMUNITY_CATEGORIES.includes(category)) {
      return res.status(400).json({ success: false, message: "Invalid post category" });
    }
    if (authorId && !isValidId(authorId)) {
      return res.status(400).json({ success: false, message: "Invalid author ID" });
    }

    const filter = { collegeId: user.collegeId };
    if (authorId) filter.author = authorId;
    if (category && category !== "All Posts") filter.category = category;
    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      const authors = await User.find({
        collegeId: user.collegeId,
        isActive: true,
        $or: [
          { name: regex },
          { headline: regex },
          { role: regex },
          { branch: regex },
          { company: regex },
          { jobTitle: regex },
        ],
      }).distinct("_id");
      filter.$or = [{ content: regex }, { author: { $in: authors } }];
    }

    const [foundPosts, total] = await Promise.all([
      Post.find(filter)
        .populate(COMMUNITY_AUTHOR_POPULATE)
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Post.countDocuments(filter),
    ]);
    const posts = foundPosts.filter((post) => post.author);
    const data = await postStats(posts, user._id);

    return res.json({
      success: true,
      data,
      posts: data,
      pagination: { page, limit, total, hasMore: page * limit < total },
    });
  } catch (error) {
    console.error("getCommunityPosts error:", error);
    return res.status(500).json({ success: false, message: "Failed to load community posts" });
  }
};

export const getCommunityPost = async (req, res) => {
  try {
    const user = await getCommunityUser(req, res);
    if (!user) return;
    if (!hasValidPostId(req, res)) return;
    const post = await getCollegePost(req.params.postId, user.collegeId);
    if (!post?.author) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }
    return res.json({ success: true, data: await serializePost(post, user._id) });
  } catch (error) {
    console.error("getCommunityPost error:", error);
    return res.status(500).json({ success: false, message: "Failed to load post" });
  }
};

export const createCommunityPost = async (req, res) => {
  try {
    const user = await getCommunityUser(req, res);
    if (!user) return;
    const content = typeof req.body?.content === "string" ? req.body.content.trim() : (typeof req.body?.text === "string" ? req.body.text.trim() : "");
    const category = req.body?.category || "General Discussion";
    const imageInput = req.body?.image;
    let image;
    if (imageInput !== undefined && imageInput !== null) {
      if (typeof imageInput !== "object" || Array.isArray(imageInput)) {
        return res.status(400).json({ success: false, message: "Invalid image metadata" });
      }

      const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];
      const fileName = typeof imageInput.name === "string" ? imageInput.name.trim() : "";
      let imageUrl;
      try {
        imageUrl = new URL(imageInput.url);
      } catch {
        return res.status(400).json({ success: false, message: "A valid ImageKit image URL is required" });
      }
      if (
        imageUrl.protocol !== "https:" ||
        imageUrl.hostname !== "ik.imagekit.io" ||
        imageUrl.username ||
        imageUrl.password ||
        typeof imageInput.fileId !== "string" ||
        !imageInput.fileId.trim() ||
        !allowedImageTypes.includes(imageInput.mimeType) ||
        !(
          (imageInput.mimeType === "image/jpeg" && /\.(jpe?g)$/i.test(fileName)) ||
          (imageInput.mimeType === "image/png" && /\.png$/i.test(fileName)) ||
          (imageInput.mimeType === "image/webp" && /\.webp$/i.test(fileName))
        ) ||
        !Number.isInteger(imageInput.size) ||
        imageInput.size < 1 ||
        imageInput.size > 5 * 1024 * 1024
      ) {
        return res.status(400).json({ success: false, message: "Image must be a JPG, PNG, or WebP file no larger than 5 MB uploaded to ImageKit" });
      }
      image = {
        url: imageUrl.href,
        fileId: imageInput.fileId.trim(),
        name: fileName.slice(0, 255),
        size: imageInput.size,
        mimeType: imageInput.mimeType,
        ...(typeof imageInput.filePath === "string" ? { filePath: imageInput.filePath.slice(0, 1024) } : {}),
        ...(Number.isInteger(imageInput.width) && imageInput.width > 0 ? { width: imageInput.width } : {}),
        ...(Number.isInteger(imageInput.height) && imageInput.height > 0 ? { height: imageInput.height } : {}),
      };
    }
    if (content.length > 5000 || (!content && !image)) {
      return res.status(400).json({ success: false, message: "A post must include text (up to 5,000 characters), an image, or both" });
    }
    if (!COMMUNITY_CATEGORIES.includes(category)) {
      return res.status(400).json({ success: false, message: "Invalid post category" });
    }
    if (category === "Announcement" && user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Only admins can publish announcements" });
    }

    const post = await Post.create({
      author: user._id,
      collegeId: user.collegeId,
      content,
      ...(image ? { image } : {}),
      category,
    });
    const populated = await Post.findById(post._id)
      .populate(COMMUNITY_AUTHOR_POPULATE)
      .lean();
    return res.status(201).json({
      success: true,
      message: "Post published",
      data: await serializePost(populated, user._id),
    });
  } catch (error) {
    console.error("createCommunityPost error:", error);
    return res.status(500).json({ success: false, message: "Failed to publish post" });
  }
};

export const updateCommunityPost = async (req, res) => {
  try {
    const user = await getCommunityUser(req, res);
    if (!user) return;
    if (!isValidId(req.params.postId)) {
      return res.status(400).json({ success: false, message: "Invalid post ID" });
    }
    const post = await Post.findOne({ _id: req.params.postId, collegeId: user.collegeId });
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });
    if (String(post.author) !== String(user._id)) {
      return res.status(403).json({ success: false, message: "You can only edit your own posts" });
    }

    const updates = {};
    if (req.body?.content !== undefined) {
      if (typeof req.body.content !== "string" || !req.body.content.trim() || req.body.content.trim().length > 5000) {
        return res.status(400).json({ success: false, message: "Post content is required and must be 5,000 characters or fewer" });
      }
      updates.content = req.body.content.trim();
    }
    if (req.body?.category !== undefined) {
      if (!COMMUNITY_CATEGORIES.includes(req.body.category)) {
        return res.status(400).json({ success: false, message: "Invalid post category" });
      }
      if (req.body.category === "Announcement" && user.role !== "admin") {
        return res.status(403).json({ success: false, message: "Only admins can publish announcements" });
      }
      updates.category = req.body.category;
    }
    if (!Object.keys(updates).length) {
      return res.status(400).json({ success: false, message: "No editable post fields were provided" });
    }
    Object.assign(post, updates);
    await post.save();
    const updated = await getCollegePost(post._id, user.collegeId);
    return res.json({ success: true, message: "Post updated", data: await serializePost(updated, user._id) });
  } catch (error) {
    console.error("updateCommunityPost error:", error);
    return res.status(500).json({ success: false, message: "Failed to update post" });
  }
};

export const deleteCommunityPost = async (req, res) => {
  try {
    const user = await getCommunityUser(req, res);
    if (!user) return;
    if (!hasValidPostId(req, res)) return;
    const post = await Post.findOne({ _id: req.params.postId, collegeId: user.collegeId }).lean();
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });
    if (String(post.author) !== String(user._id) && user.role !== "admin") {
      return res.status(403).json({ success: false, message: "You cannot remove this post" });
    }

    await Promise.all([
      Post.deleteOne({ _id: post._id }),
      Comment.deleteMany({ postId: post._id, collegeId: user.collegeId }),
      PostLike.deleteMany({ postId: post._id, collegeId: user.collegeId }),
    ]);
    return res.json({ success: true, message: "Post removed" });
  } catch (error) {
    console.error("deleteCommunityPost error:", error);
    return res.status(500).json({ success: false, message: "Failed to remove post" });
  }
};

export const likeCommunityPost = async (req, res) => {
  try {
    const user = await getCommunityUser(req, res);
    if (!user) return;
    if (!hasValidPostId(req, res)) return;
    const post = await getCollegePost(req.params.postId, user.collegeId);
    if (!post?.author) return res.status(404).json({ success: false, message: "Post not found" });
    await PostLike.updateOne(
      { postId: post._id, userId: user._id, collegeId: user.collegeId },
      { $setOnInsert: { postId: post._id, userId: user._id, collegeId: user.collegeId } },
      { upsert: true }
    );
    const likeCount = await PostLike.countDocuments({ postId: post._id, collegeId: user.collegeId });
    return res.json({ success: true, data: { likedByMe: true, likeCount } });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(200).json({ success: true, data: { likedByMe: true } });
    }
    console.error("likeCommunityPost error:", error);
    return res.status(500).json({ success: false, message: "Failed to like post" });
  }
};

export const unlikeCommunityPost = async (req, res) => {
  try {
    const user = await getCommunityUser(req, res);
    if (!user) return;
    if (!hasValidPostId(req, res)) return;
    const post = await getCollegePost(req.params.postId, user.collegeId);
    if (!post?.author) return res.status(404).json({ success: false, message: "Post not found" });
    await PostLike.deleteOne({ postId: post._id, userId: user._id, collegeId: user.collegeId });
    const likeCount = await PostLike.countDocuments({ postId: post._id, collegeId: user.collegeId });
    return res.json({ success: true, data: { likedByMe: false, likeCount } });
  } catch (error) {
    console.error("unlikeCommunityPost error:", error);
    return res.status(500).json({ success: false, message: "Failed to unlike post" });
  }
};

export const getCommunityComments = async (req, res) => {
  try {
    const user = await getCommunityUser(req, res);
    if (!user) return;
    if (!hasValidPostId(req, res)) return;
    const post = await getCollegePost(req.params.postId, user.collegeId);
    if (!post?.author) return res.status(404).json({ success: false, message: "Post not found" });
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
    const [comments, total] = await Promise.all([
      Comment.find({ postId: post._id, collegeId: user.collegeId })
        .populate(COMMUNITY_AUTHOR_POPULATE)
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Comment.countDocuments({ postId: post._id, collegeId: user.collegeId }),
    ]);
    return res.json({
      success: true,
      data: (await attachStudentProfilePhotos(
        comments.filter((comment) => comment.author).reverse()
      )),
      pagination: { page, limit, total, hasMore: page * limit < total },
    });
  } catch (error) {
    console.error("getCommunityComments error:", error);
    return res.status(500).json({ success: false, message: "Failed to load comments" });
  }
};

export const createCommunityComment = async (req, res) => {
  try {
    const user = await getCommunityUser(req, res);
    if (!user) return;
    if (!hasValidPostId(req, res)) return;
    const post = await getCollegePost(req.params.postId, user.collegeId);
    if (!post?.author) return res.status(404).json({ success: false, message: "Post not found" });
    const content = typeof req.body?.content === "string" ? req.body.content.trim() : "";
    if (!content || content.length > 2000) {
      return res.status(400).json({ success: false, message: "Comment is required and must be 2,000 characters or fewer" });
    }
    const comment = await Comment.create({
      postId: post._id,
      author: user._id,
      collegeId: user.collegeId,
      content,
    });
    const populated = await Comment.findById(comment._id)
      .populate(COMMUNITY_AUTHOR_POPULATE)
      .lean();
    const [commentWithPhoto] = await attachStudentProfilePhotos([populated]);
    return res.status(201).json({ success: true, message: "Comment added", data: commentWithPhoto });
  } catch (error) {
    console.error("createCommunityComment error:", error);
    return res.status(500).json({ success: false, message: "Failed to add comment" });
  }
};

export const deleteCommunityComment = async (req, res) => {
  try {
    const user = await getCommunityUser(req, res);
    if (!user) return;
    if (!isValidId(req.params.commentId)) {
      return res.status(400).json({ success: false, message: "Invalid comment ID" });
    }
    const comment = await Comment.findOne({
      _id: req.params.commentId,
      collegeId: user.collegeId,
    });
    if (!comment) return res.status(404).json({ success: false, message: "Comment not found" });
    const post = await Post.findOne({ _id: comment.postId, collegeId: user.collegeId })
      .select("author")
      .lean();
    if (
      String(comment.author) !== String(user._id) &&
      String(post?.author) !== String(user._id) &&
      user.role !== "admin"
    ) {
      return res.status(403).json({ success: false, message: "You cannot remove this comment" });
    }
    await comment.deleteOne();
    return res.json({ success: true, message: "Comment removed" });
  } catch (error) {
    console.error("deleteCommunityComment error:", error);
    return res.status(500).json({ success: false, message: "Failed to remove comment" });
  }
};

const updateFollow = async (req, res, following) => {
  try {
    const user = await getCommunityUser(req, res);
    if (!user) return;
    if (!isValidId(req.params.userId)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }
    if (String(user._id) === String(req.params.userId)) {
      return res.status(400).json({ success: false, message: "You cannot follow yourself" });
    }
    const target = await User.findOne({
      _id: req.params.userId,
      collegeId: user.collegeId,
      isActive: true,
    }).select("_id role");
    if (!target) return res.status(404).json({ success: false, message: "User not found in your college community" });
    if (!COMMUNITY_ROLES.includes(target.role)) {
      return res.status(403).json({ success: false, message: "This account cannot be followed" });
    }

    if (following) {
      await Follow.updateOne(
        { followerId: user._id, followingId: target._id },
        { $setOnInsert: { followerId: user._id, followingId: target._id, collegeId: user.collegeId } },
        { upsert: true }
      );
    } else {
      await Follow.deleteOne({ followerId: user._id, followingId: target._id });
    }
    return res.json({ success: true, data: { following } });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(200).json({ success: true, data: { following: true } });
    }
    console.error("updateFollow error:", error);
    return res.status(500).json({ success: false, message: "Failed to update follow" });
  }
};

export const followCommunityUser = (req, res) => updateFollow(req, res, true);
export const unfollowCommunityUser = (req, res) => updateFollow(req, res, false);

export const getCommunityFollowStatus = async (req, res) => {
  try {
    const user = await getCommunityUser(req, res);
    if (!user) return;
    if (!isValidId(req.params.userId)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }
    const target = await User.findOne({
      _id: req.params.userId,
      collegeId: user.collegeId,
      isActive: true,
    }).select("_id");
    if (!target) return res.status(404).json({ success: false, message: "User not found in your college community" });

    const [following, followerCount, followingCount] = await Promise.all([
      Follow.exists({ followerId: user._id, followingId: target._id, collegeId: user.collegeId }),
      Follow.countDocuments({ followingId: target._id, collegeId: user.collegeId }),
      Follow.countDocuments({ followerId: target._id, collegeId: user.collegeId }),
    ]);
    return res.json({
      success: true,
      data: { following: Boolean(following), followerCount, followingCount },
    });
  } catch (error) {
    console.error("getCommunityFollowStatus error:", error);
    return res.status(500).json({ success: false, message: "Failed to load follow status" });
  }
};

const getOpportunities = async (req, res) => {
  try {
    const opportunities = await Opportunity.find().sort({ createdAt: -1 }).populate("postedBy", "name company role");
    return res.json({ success: true, data: opportunities });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createOpportunity = async (req, res) => {
  try {
    const { title, company, type, location, description, salary, remote, tags } = req.body;

    if (!title || !company) {
      return res.status(400).json({ success: false, message: "Title and company are required" });
    }

    if (!req.user || !["alumni", "admin"].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Only alumni and admins can post opportunities" });
    }

    const opportunity = await Opportunity.create({
      title,
      company,
      type: type || "Internship",
      location: location || "Remote",
      description: description || "",
      salary: salary || "",
      remote: Boolean(remote),
      tags: Array.isArray(tags) ? tags : [],
      postedBy: req.user.id,
    });

    return res.status(201).json({ success: true, message: "Opportunity created", data: opportunity });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getReferrals = async (req, res) => {
  try {
    const userId = req.user.id;
    const filter = {};
    if (req.user.role === "student") filter.student = userId;
    if (req.user.role === "alumni") filter.alumni = userId;

    const referrals = await Referral.find(filter)
      .populate("student", "name email")
      .populate("alumni", "name email company")
      .populate("opportunity", "title company type");

    return res.json({ success: true, data: referrals });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createReferral = async (req, res) => {
  try {
    const { opportunity, alumni, message } = req.body;

    if (!req.user || req.user.role !== "student") {
      return res.status(403).json({ success: false, message: "Students can request referrals" });
    }

    if (!opportunity || !alumni) {
      return res.status(400).json({ success: false, message: "Opportunity and alumni are required" });
    }

    const referral = await Referral.create({
      student: req.user.id,
      alumni,
      opportunity,
      message: message || "",
    });

    return res.status(201).json({ success: true, message: "Referral requested", data: referral });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getMentorshipRequests = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === "student") filter.student = req.user.id;
    if (req.user.role === "alumni") filter.mentor = req.user.id;

    const requests = await MentorshipRequest.find(filter)
      .populate("student", "name email")
      .populate("mentor", "name email company")
      .sort({ createdAt: -1 });

    return res.json({ success: true, data: requests });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createMentorshipRequest = async (req, res) => {
  try {
    const { mentor, topic, availableTime, message } = req.body;

    if (!req.user || req.user.role !== "student") {
      return res.status(403).json({ success: false, message: "Students can request mentorship" });
    }

    if (!mentor || !topic) {
      return res.status(400).json({ success: false, message: "Mentor and topic are required" });
    }

    const request = await MentorshipRequest.create({
      student: req.user.id,
      mentor,
      topic,
      availableTime: availableTime || "",
      message: message || "",
    });

    return res.status(201).json({ success: true, message: "Mentorship request created", data: request });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export {
  getOpportunities,
  createOpportunity,
  getReferrals,
  createReferral,
  getMentorshipRequests,
  createMentorshipRequest,
};
