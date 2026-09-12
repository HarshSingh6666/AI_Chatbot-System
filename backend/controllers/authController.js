import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../models/User.js';
import cloudinary from '../config/cloudinary.js';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// --- HELPER FUNCTIONS ---
const validatePassword = (pwd) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,16}$/.test(pwd);
const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });
const formatUser = (user) => ({
  id: user._id, name: user.name, email: user.email, 
  profileImage: user.profileImage, isTwoFactorEnabled: user.isTwoFactorEnabled
});

// ======================================================
// 1. SIGNUP
// ======================================================
export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required' });
    if (!validatePassword(password)) return res.status(400).json({ error: 'Password must be 8-16 characters and contain at least one uppercase letter, one lowercase letter, one number and one special character (@$!%*?&).' });
    if (await User.findOne({ email })) return res.status(400).json({ error: 'Email already in use' });

    const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt(10));
    const user = await User.create({
      name, email, password: hashedPassword,
      profileImage: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
    });

    res.status(201).json({ token: generateToken(user._id), user: formatUser(user) });
  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).json({ error: 'Server error during signup' });
  }
};

// ======================================================
// 2. LOGIN
// ======================================================
export const login = async (req, res) => {
  try {
    const { email, password, twoFactorToken } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    if (user.isTwoFactorEnabled) {
      if (!twoFactorToken) return res.status(200).json({ requires2FA: true, message: '2FA code is required to complete login' });
      const verified = speakeasy.totp.verify({ secret: user.twoFactorSecret, encoding: 'base32', token: twoFactorToken, window: 1 });
      if (!verified) return res.status(400).json({ error: 'Invalid 2FA verification code' });
    }

    res.json({ token: generateToken(user._id), user: formatUser(user) });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
};

// ======================================================
// 3. GOOGLE LOGIN
// ======================================================
export const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Google token is required' });

    const ticket = await client.verifyIdToken({ idToken: token, audience: process.env.GOOGLE_CLIENT_ID });
    const { email, name, picture } = ticket.getPayload();
    if (!email) return res.status(400).json({ error: 'Google account email not available' });

    let user = await User.findOne({ email });
    if (!user) {
      const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(randomPassword, await bcrypt.genSalt(10));
      user = await User.create({
        name: name || 'Google User', email, password: hashedPassword,
        profileImage: picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
      });
    }

    res.json({ token: generateToken(user._id), user: formatUser(user) });
  } catch (error) {
    console.error('Google Verification Error:', error);
    res.status(400).json({ error: 'Google authentication failed' });
  }
};

// ======================================================
// 4. GET ME
// ======================================================
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: formatUser(user) });
  } catch (error) {
    console.error('Get Me Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ======================================================
// 5. UPDATE PROFILE
// ======================================================
export const updateProfile = async (req, res) => {
  try {
    const { name, profileImage } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (name) user.name = name;

    if (profileImage && profileImage.startsWith('data:image')) {
      const uploadResponse = await cloudinary.uploader.upload(profileImage, { folder: 'chatai_profiles' });
      user.profileImage = uploadResponse.secure_url;
    } else if (profileImage !== undefined) {
      user.profileImage = profileImage;
    }

    await user.save();
    res.json({ message: 'Profile updated successfully', user: formatUser(user) });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

// ======================================================
// 6. CHANGE PASSWORD
// ======================================================
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Current password and new password are required' });
    if (!validatePassword(newPassword)) return res.status(400).json({ error: 'New password must meet complexity requirements.' });

    const user = await User.findById(req.user.id);
    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(400).json({ error: 'Incorrect current password' });
    }

    user.password = await bcrypt.hash(newPassword, await bcrypt.genSalt(10));
    await user.save();
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change Password Error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
};

// ======================================================
// 7. SETUP 2FA
// ======================================================
export const setup2fa = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const secret = speakeasy.generateSecret({ name: `ChatAI (${user.email})` });
    user.twoFactorSecret = secret.base32;
    await user.save();

    QRCode.toDataURL(secret.otpauth_url, (err, dataUrl) => {
      if (err) return res.status(500).json({ error: 'Failed to generate QR code' });
      res.json({ secret: secret.base32, qrUri: dataUrl });
    });
  } catch (error) {
    console.error('2FA Setup Error:', error);
    res.status(500).json({ error: 'Failed to setup 2FA' });
  }
};

// ======================================================
// 8. VERIFY & ENABLE 2FA
// ======================================================
export const verify2fa = async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findById(req.user.id);

    if (!user || !user.twoFactorSecret) return res.status(400).json({ error: '2FA setup not initialized' });

    const verified = speakeasy.totp.verify({ secret: user.twoFactorSecret, encoding: 'base32', token, window: 1 });
    if (!verified) return res.status(400).json({ error: 'Invalid verification code' });

    user.isTwoFactorEnabled = true;
    await user.save();
    res.json({ message: '2FA enabled successfully' });
  } catch (error) {
    console.error('2FA Verify Error:', error);
    res.status(500).json({ error: 'Failed to verify 2FA' });
  }
};