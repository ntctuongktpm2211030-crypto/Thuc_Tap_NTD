import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../config/db';
import { firebaseAuth } from '../../config/firebase';
import { EmailService } from './email.service';
import crypto from 'crypto';
const emailService = new EmailService();

const router = Router();

// ─────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_dev';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_dev';

function signAccessToken(userId: string, role: string) {
  return jwt.sign({ sub: userId, role }, JWT_SECRET, { expiresIn: '15m' });
}

function signRefreshToken(userId: string) {
  return jwt.sign({ sub: userId }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

// ─────────────────────────────────────────────────────────
// POST /api/v1/auth/register
// ─────────────────────────────────────────────────────────
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'email, password and fullName are required.' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        isVerified: false,
        verificationToken,
        profile: {
          create: { fullName },
        },
      },
      include: { profile: true },
    });



    // Gửi email xác thực tài khoản (chạy ngầm không block luồng phản hồi đăng ký)
    emailService.sendVerificationEmail(email, verificationToken).catch(err => {
      console.error('[auth/register] Gửi email xác thực thất bại:', err);
    });

    const accessToken = signAccessToken(user.id, user.role);
    const refreshToken = signRefreshToken(user.id);

    return res.status(201).json({
      message: 'Account created successfully. Please check your email to verify your account.',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.profile?.fullName,
        avatarUrl: user.profile?.avatarUrl,
        coverUrl: user.profile?.coverUrl,
        role: user.role,
        isVerified: user.isVerified,
      },
      accessToken,
      refreshToken,
    });
  } catch (err: any) {
    console.error('[auth/register]', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─────────────────────────────────────────────────────────
// POST /api/v1/auth/login
// ─────────────────────────────────────────────────────────
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required.' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const accessToken = signAccessToken(user.id, user.role);
    const refreshToken = signRefreshToken(user.id);

    return res.status(200).json({
      message: 'Login successful.',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.profile?.fullName,
        avatarUrl: user.profile?.avatarUrl,
        coverUrl: user.profile?.coverUrl,
        role: user.role,
      },
      accessToken,
      refreshToken,
    });
  } catch (err: any) {
    console.error('[auth/login]', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─────────────────────────────────────────────────────────
// POST /api/v1/auth/refresh
// ─────────────────────────────────────────────────────────
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required.' });
    }

    let payload: any;
    try {
      payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({ error: 'Invalid or expired refresh token.' });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      return res.status(401).json({ error: 'User not found.' });
    }

    const newAccessToken = signAccessToken(user.id, user.role);

    return res.status(200).json({ accessToken: newAccessToken });
  } catch (err: any) {
    console.error('[auth/refresh]', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─────────────────────────────────────────────────────────
// GET /api/v1/auth/me  — requires Authorization header
// ─────────────────────────────────────────────────────────
router.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization header missing.' });
    }

    const token = authHeader.split(' ')[1];
    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Invalid or expired access token.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { profile: true, preferences: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.status(200).json({
      id: user.id,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      fullName: user.profile?.fullName,
      avatarUrl: user.profile?.avatarUrl,
      coverUrl: user.profile?.coverUrl,
      bio: user.profile?.bio,
      homeLocation: user.profile?.homeLocation,
      preferences: user.preferences,
      createdAt: user.createdAt,
    });
  } catch (err: any) {
    console.error('[auth/me]', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─────────────────────────────────────────────────────────
// POST /api/v1/auth/google
// ─────────────────────────────────────────────────────────
router.post('/google', async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: 'idToken is required.' });
    }

    if (!process.env.FIREBASE_PROJECT_ID) {
      console.error('[Firebase] FIREBASE_PROJECT_ID is not configured in backend .env');
      return res.status(500).json({ error: 'Google authentication is not configured on the server.' });
    }

    // Verify Firebase ID token
    let decodedToken;
    try {
      decodedToken = await firebaseAuth.verifyIdToken(idToken);
    } catch (err: any) {
      console.error('[Firebase] verifyIdToken failed:', err.message);
      return res.status(401).json({ error: 'Invalid or expired Google auth token.' });
    }

    const { email, name, picture } = decodedToken;

    if (!email) {
      return res.status(400).json({ error: 'Email not provided by Google account.' });
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (!user) {
      // Generate a secure random password since passwordHash is required in schema
      const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
      const passwordHash = await bcrypt.hash(randomPassword, 12);

      // Create new user & profile
      user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          isVerified: true, // Google email is verified
          profile: {
            create: {
              fullName: name || email.split('@')[0],
              avatarUrl: picture || null,
            },
          },
        },
        include: { profile: true },
      });
    }

    // Generate tokens for app session
    const accessToken = signAccessToken(user.id, user.role);
    const refreshToken = signRefreshToken(user.id);

    return res.status(200).json({
      message: 'Google login successful.',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.profile?.fullName,
        avatarUrl: user.profile?.avatarUrl,
        coverUrl: user.profile?.coverUrl,
        role: user.role,
      },
      accessToken,
      refreshToken,
    });
  } catch (err: any) {
    console.error('[auth/google]', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─────────────────────────────────────────────────────────
// POST /api/v1/auth/verify-email
// ─────────────────────────────────────────────────────────
router.post('/verify-email', async (req: Request, res: Response) => {
  try {
    const { email, token } = req.body;

    if (!email || !token) {
      return res.status(400).json({ error: 'Email and token are required.' });
    }

    const user = await prisma.user.findFirst({
      where: {
        email,
        verificationToken: token,
      },
    });

    if (!user) {
      return res.status(400).json({ error: 'Mã xác thực hoặc email không hợp lệ.' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null,
      },
    });

    return res.status(200).json({ message: 'Tài khoản đã được xác thực thành công. Bạn có thể sử dụng đầy đủ tính năng.' });
  } catch (err: any) {
    console.error('[auth/verify-email]', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─────────────────────────────────────────────────────────
// POST /api/v1/auth/forgot-password
// ─────────────────────────────────────────────────────────
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản với email này.' });
    }

    // Generate a 6-digit OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 15 * 60 * 1000; // 15 minutes expiration

    // Store in resetPasswordToken as code|expires
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: `${otp}|${expires}`
      }
    });

    // Send OTP email
    await emailService.sendResetPasswordOtp(email, otp);

    return res.status(200).json({ message: 'Mã OTP đặt lại mật khẩu đã được gửi đến email của bạn.' });
  } catch (err: any) {
    console.error('[auth/forgot-password]', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─────────────────────────────────────────────────────────
// POST /api/v1/auth/verify-otp
// ─────────────────────────────────────────────────────────
router.post('/verify-otp', async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.resetPasswordToken) {
      return res.status(400).json({ error: 'Mã OTP không hợp lệ hoặc đã hết hạn.' });
    }

    const parts = user.resetPasswordToken.split('|');
    if (parts.length !== 2) {
      return res.status(400).json({ error: 'Mã OTP không hợp lệ hoặc đã hết hạn.' });
    }

    const [storedOtp, expiresStr] = parts;
    const expires = parseInt(expiresStr, 10);

    if (storedOtp !== otp.trim() || Date.now() > expires) {
      return res.status(400).json({ error: 'Mã OTP không hợp lệ hoặc đã hết hiệu lực.' });
    }

    // OTP is valid! Now generate a cryptographically secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Update user with the new secure token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken
      }
    });

    return res.status(200).json({
      message: 'Mã OTP hợp lệ. Vui lòng thiết lập mật khẩu mới.',
      resetToken
    });
  } catch (err: any) {
    console.error('[auth/verify-otp]', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─────────────────────────────────────────────────────────
// POST /api/v1/auth/reset-password
// ─────────────────────────────────────────────────────────
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { email, token, newPassword } = req.body;

    if (!email || !token || !newPassword) {
      return res.status(400).json({ error: 'Email, token and newPassword are required.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Mật khẩu mới phải có tối thiểu 8 ký tự.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.resetPasswordToken !== token) {
      return res.status(400).json({ error: 'Yêu cầu đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.' });
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update the password and clear the reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordToken: null
      }
    });

    return res.status(200).json({ message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới.' });
  } catch (err: any) {
    console.error('[auth/reset-password]', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
