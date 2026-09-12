import express from "express";
import { signup, login, googleLogin, getMe, updateProfile, changePassword, setup2fa, verify2fa } from "../controllers/authController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { loginRateLimiter, signupRateLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// --- Public Auth Routes ---
router.post("/signup", signupRateLimiter, signup); // Max 5 attempts / 15 mins
router.post("/login", loginRateLimiter, login);    // Max 10 attempts / 15 mins
router.post("/google", googleLogin);

// --- Protected Routes Middleware ---
// Yahan verifyToken lagane se neeche ke sabhi routes automatically secure ho jayenge
router.use(verifyToken);

router.get("/me", getMe);
router.put("/profile", updateProfile);
router.put("/change-password", changePassword);
router.post("/2fa/setup", setup2fa);
router.post("/2fa/verify", verify2fa); // Rate limiter yahan bhi add kar sakte hain agar zaroorat ho

export default router;