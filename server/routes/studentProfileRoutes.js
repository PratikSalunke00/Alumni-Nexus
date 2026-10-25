
import express from 'express';

import {
  getStudentProfile,
  saveStudentProfile,
} from '../controller/studentProfileController.js';

// Replace this import with your existing JWT authentication
// middleware and its actual file path.
import { checkJWT } from '../middleware/jwt.js';

const router = express.Router();

router.get(['/profile', '/profile/me'], checkJWT, getStudentProfile);
router.put(['/profile', '/profile/me'], checkJWT, saveStudentProfile);

export default router;
