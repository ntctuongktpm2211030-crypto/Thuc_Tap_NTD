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

/**
 * POST /api/v1/auth/send-register-otp
 * Send 6-digit OTP for inline Registration Form
 */
router.post('/send-register-otp', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Vui lòng nhập email.' });
    }

    const inputEmail = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: inputEmail } });

    if (existing && existing.isVerified) {
      return res.status(409).json({ error: 'Email này đã được đăng ký tài khoản.' });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 15 * 60 * 1000;
    const tokenStr = `${otpCode}|${expires}`;

    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { verificationToken: tokenStr }
      });
    } else {
      const dummyPasswordHash = await bcrypt.hash('Pending@2026', 10);
      await prisma.user.create({
        data: {
          email: inputEmail,
          passwordHash: dummyPasswordHash,
          isVerified: false,
          verificationToken: tokenStr,
          profile: {
            create: { fullName: inputEmail.split('@')[0] }
          }
        }
      });
    }

    const sent = await emailService.sendRegisterOtpEmail(inputEmail, otpCode).catch(err => {
      console.error('[send-register-otp] Error sending email:', err);
      return false;
    });

    console.log(`[REGISTER OTP DISPATCH] 📧 Mã OTP [${otpCode}] sent to ${inputEmail}, success: ${sent}`);

    return res.json({
      success: true,
      message: `Mã OTP 6 số đã được gửi tới email ${inputEmail}`,
      otpDemo: otpCode
    });
  } catch (err) {
    console.error('[send-register-otp] Exception:', err);
    return res.status(500).json({ error: 'Không thể gửi mã OTP qua email.' });
  }
});

// ─────────────────────────────────────────────────────────
// POST /api/v1/auth/register
// ─────────────────────────────────────────────────────────
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, fullName, otpCode } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'Họ tên, Email và Mật khẩu là bắt buộc.' });
    }

    if (!otpCode || String(otpCode).trim().length !== 6) {
      return res.status(400).json({ error: 'Vui lòng nhập mã OTP xác thực 6 số đã gửi về email.' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.isVerified) {
      return res.status(409).json({ error: 'Email này đã được đăng ký tài khoản.' });
    }

    // Verify OTP code if user exists from send-register-otp or check token
    if (existing?.verificationToken) {
      const [savedOtp, expiresStr] = existing.verificationToken.split('|');
      if (savedOtp !== String(otpCode).trim()) {
        return res.status(400).json({ error: 'Mã OTP không chính xác. Vui lòng kiểm tra lại email.' });
      }
      if (expiresStr && Date.now() > parseInt(expiresStr, 10)) {
        return res.status(400).json({ error: 'Mã OTP đã hết hạn. Vui lòng bấm nút Gửi mã OTP mới.' });
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);

    let user;
    if (existing) {
      user = await prisma.user.update({
        where: { id: existing.id },
        data: {
          passwordHash,
          isVerified: true,
          verificationToken: null,
          profile: {
            update: { fullName }
          }
        },
        include: { profile: true }
      });
    } else {
      user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          isVerified: true,
          verificationToken: null,
          profile: {
            create: { fullName },
          },
        },
        include: { profile: true },
      });
    }

    const accessToken = signAccessToken(user.id, user.role);
    const refreshToken = signRefreshToken(user.id);

    return res.status(201).json({
      message: '🎉 Đăng ký và kích hoạt tài khoản thành công!',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.profile?.fullName,
        avatarUrl: user.profile?.avatarUrl,
        coverUrl: user.profile?.coverUrl,
        role: user.role,
        isVerified: true,
      },
      accessToken,
      refreshToken,
    });
  } catch (err: any) {
    console.error('[auth/register]', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * POST /api/v1/auth/verify-otp
 * Verify 6-digit OTP code for Registration or Password Reset
 */
router.post('/verify-otp', async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email và mã OTP là bắt buộc.' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản.' });
    }

    const tokenString = user.verificationToken || user.resetPasswordToken || '';
    const [savedOtp, expiresStr] = tokenString.split('|');

    if (savedOtp !== String(otp).trim()) {
      return res.status(400).json({ error: 'Mã OTP không chính xác. Vui lòng kiểm tra lại email.' });
    }

    if (expiresStr && Date.now() > parseInt(expiresStr, 10)) {
      return res.status(400).json({ error: 'Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null,
        resetPasswordToken: null
      },
      include: { profile: true }
    });

    const accessToken = signAccessToken(updatedUser.id, updatedUser.role);
    const refreshToken = signRefreshToken(updatedUser.id);

    return res.status(200).json({
      message: '🎉 Xác thực mã OTP thành công! Đã kích hoạt tài khoản.',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.profile?.fullName,
        avatarUrl: updatedUser.profile?.avatarUrl,
        coverUrl: updatedUser.profile?.coverUrl,
        role: updatedUser.role,
        isVerified: true
      },
      accessToken,
      refreshToken
    });
  } catch (err: any) {
    console.error('[auth/verify-otp]', err);
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
