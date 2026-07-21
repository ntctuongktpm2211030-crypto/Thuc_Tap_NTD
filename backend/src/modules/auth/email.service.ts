import fs from 'fs';
import path from 'path';

export class EmailService {
  async sendVerificationEmail(to: string, token: string): Promise<boolean> {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?email=${encodeURIComponent(to)}&token=${token}`;
    const subject = 'Xác minh tài khoản Terraholic';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #2563eb; text-align: center;">Chào mừng bạn đến với Terraholic!</h2>
        <p>Cảm ơn bạn đã đăng ký tài khoản trên nền tảng mạng xã hội du lịch thông minh Terraholic.</p>
        <p>Vui lòng click vào nút bên dưới để xác minh tài khoản của bạn:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Xác Minh Tài Khoản</a>
        </div>
        <p>Hoặc bạn có thể sao chép liên kết này và dán vào trình duyệt:</p>
        <p style="word-break: break-all; color: #6b7280;">${verificationUrl}</p>
        <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">Đây là email tự động, vui lòng không trả lời email này.</p>
      </div>
    `;

    // Load động nodemailer để tránh crash khi chưa cài đặt package ở local
    let nodemailer: any = null;
    try {
      nodemailer = require('nodemailer');
    } catch (_) {
      // nodemailer package not installed
    }

    if (nodemailer && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.EMAIL_PORT || '587', 10),
          secure: process.env.EMAIL_PORT === '465',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        });
        await transporter.sendMail({
          from: `"Terraholic Support" <${process.env.EMAIL_USER}>`,
          to,
          subject,
          html
        });
        console.log(`[EmailService] Verification email sent successfully to ${to} via SMTP`);
        return true;
      } catch (err) {
        console.error('[EmailService] Failed to send email via SMTP, falling back to mock mode:', err);
      }
    }

    // Mock Mode Fallback: Ghi ra file log
    const mockEmailPath = path.resolve(__dirname, '../../../../mock_emails.log');
    const mockContent = `[${new Date().toISOString()}] To: ${to} | Subject: ${subject} | Link: ${verificationUrl}\n`;
    try {
      fs.appendFileSync(mockEmailPath, mockContent);
      console.log(`[EmailService] [MOCK] Verification link written to mock_emails.log: ${verificationUrl}`);
      return true;
    } catch (e) {
      console.error('[EmailService] Failed to write mock email:', e);
      return false;
    }
  }

  async sendResetPasswordOtp(to: string, otp: string): Promise<boolean> {
    const subject = 'Mã OTP đặt lại mật khẩu Terraholic';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #d97706; text-align: center;">Mã OTP Đặt Lại Mật Khẩu</h2>
        <p>Chào bạn,</p>
        <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn trên Terraholic.</p>
        <p>Vui lòng sử dụng mã OTP dưới đây để hoàn tất quá trình xác thực. Mã có hiệu lực trong vòng 15 phút:</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #d97706; border: 2px dashed #d97706; padding: 10px 20px; border-radius: 5px; display: inline-block;">${otp}</span>
        </div>
        <p>Nếu bạn không gửi yêu cầu này, vui lòng bỏ qua email này để bảo vệ tài khoản của bạn.</p>
        <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">Đây là email tự động, vui lòng không trả lời email này.</p>
      </div>
    `;

    // Load động nodemailer để tránh crash khi chưa cài đặt package ở local
    let nodemailer: any = null;
    try {
      nodemailer = require('nodemailer');
    } catch (_) {
      // nodemailer package not installed
    }

    if (nodemailer && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.EMAIL_PORT || '587', 10),
          secure: process.env.EMAIL_PORT === '465',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        });
        await transporter.sendMail({
          from: `"Terraholic Support" <${process.env.EMAIL_USER}>`,
          to,
          subject,
          html
        });
        console.log(`[EmailService] OTP email sent successfully to ${to} via SMTP`);
        return true;
      } catch (err) {
        console.error('[EmailService] Failed to send OTP email via SMTP, falling back to mock mode:', err);
      }
    }

    // Mock Mode Fallback: Ghi ra file log
    const mockEmailPath = path.resolve(__dirname, '../../../../mock_emails.log');
    const mockContent = `[${new Date().toISOString()}] To: ${to} | Subject: ${subject} | OTP Code: ${otp}\n`;
    try {
      fs.appendFileSync(mockEmailPath, mockContent);
      console.log(`[EmailService] [MOCK] OTP code written to mock_emails.log: ${otp}`);
      return true;
    } catch (e) {
      console.error('[EmailService] Failed to write mock email:', e);
      return false;
    }
  }
}
