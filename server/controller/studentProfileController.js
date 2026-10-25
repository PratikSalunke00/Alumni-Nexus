
import StudentProfile from '../models/StudentProfile.js';

const profileFields = [
  'fullName',
  'email',
  'mobile',
  'dateOfBirth',
  'gender',
  'address',
  'city',
  'state',
  'country',
  'postalCode',
  'headline',
  'about',
  'showMobile',
  'showAddress',
  'education',
  'skills',
  'projects',
  'certifications',
  'linkedin',
  'github',
  'portfolio',
  'leetcode',
  'photo',
  'resume',
];

// Your authentication middleware must set req.user.
const getAuthenticatedUserId = (req) =>
  req.user?.userId || req.user?.id || req.user?._id;

export const getStudentProfile = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      return res.status(401).json({
        message: 'Authentication required.',
      });
    }

    const profile = await StudentProfile.findOne({
      user: userId,
    }).lean();

    // First-time users can start with an empty profile.
    if (!profile) {
      return res.status(200).json({
        profile: null,
        message: 'Profile not created yet.',
      });
    }

    return res.status(200).json({ profile });
  } catch (error) {
    console.error('Get student profile error:', error);

    return res.status(500).json({
      message: 'Failed to load student profile.',
    });
  }
};

export const saveStudentProfile = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      return res.status(401).json({
        message: 'Authentication required.',
      });
    }

    // Only allow profile fields; never let the client
    // change the owner of the profile.
    const updates = {};

    for (const field of profileFields) {
      if (
        Object.prototype.hasOwnProperty.call(
          req.body,
          field
        )
      ) {
        updates[field] = req.body[field];
      }
    }

    const profile = await StudentProfile.findOneAndUpdate(
      { user: userId },
      {
        $set: updates,
        $setOnInsert: { user: userId },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.status(200).json({
      message: 'Profile saved successfully.',
      profile,
    });
  } catch (error) {
    console.error('Save student profile error:', error);

    return res.status(500).json({
      message: 'Failed to save student profile.',
    });
  }
};
