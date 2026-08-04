import fs from 'fs';
import path from 'path';
import tls from 'tls';

function sendNativeSmtpEmail(options: { host: string; port: number; user: string; pass: string; to: string; subject: string; html: string }): Promise<boolean> {
  return new Promise((resolve) => {
    const user = options.user.trim();
    const pass = options.pass.replace(/\s+/g, '');
    const host = options.host || 'smtp.gmail.com';
    const port = options.port || 465;

    try {
      const socket = tls.connect(port, host, { rejectUnauthorized: false }, () => {
        let step = 0;
        const send = (str: string) => socket.write(str + '\r\n');

        socket.on('data', (buffer) => {
          const response = buffer.toString();
          
          if (step === 0 && response.startsWith('220')) {
            step = 1;
            send(`EHLO localhost`);
          } else if (step === 1 && response.includes('250')) {
            step = 2;
            send(`AUTH LOGIN`);
          } else if (step === 2 && response.startsWith('334')) {
            step = 3;
            send(Buffer.from(user).toString('base64'));
          } else if (step === 3 && response.startsWith('334')) {
            step = 4;
            send(Buffer.from(pass).toString('base64'));
          } else if (step === 4 && response.startsWith('235')) {
            step = 5;
            send(`MAIL FROM:<${user}>`);
          } else if (step === 5 && response.startsWith('250')) {
            step = 6;
            send(`RCPT TO:<${options.to}>`);
          } else if (step === 6 && response.startsWith('250')) {
            step = 7;
            send(`DATA`);
          } else if (step === 7 && response.startsWith('354')) {
            step = 8;
            const mimeData = [
              `From: "Terraholic System Admin" <${user}>`,
              `To: ${options.to}`,
              `Subject: =?UTF-8?B?${Buffer.from(options.subject).toString('base64')}?=`,
              `MIME-Version: 1.0`,
              `Content-Type: text/html; charset=UTF-8`,
              ``,
              options.html,
              `.`
            ].join('\r\n');
            send(mimeData);
          } else if (step === 8 && response.startsWith('250')) {
            step = 9;
            send(`QUIT`);
            socket.end();
            console.log(`[EmailService] 🚀 REAL GMAIL SMTP EMAIL SENT SUCCESSFULLY TO ${options.to}`);
            resolve(true);
          } else if (response.startsWith('5') || response.startsWith('4')) {
            console.error('[EmailService] SMTP Server Error Response:', response);
            socket.end();
            resolve(false);
          }
        });

        socket.on('error', (err) => {
          console.error('[EmailService] SMTP TLS Socket Error:', err);
          resolve(false);
        });
      });
    } catch (e) {
      console.error('[EmailService] SMTP Connection Error:', e);
      resolve(false);
    }
  });
}

function getLogoHeaderHtml(): string {
  return `
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="display: inline-block; background-color: #ffffff; padding: 10px 26px; border-radius: 20px; box-shadow: 0 6px 20px rgba(0,0,0,0.15); border: 2px solid rgba(255,255,255,0.9);">
        <table border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
          <tr>
            <td style="vertical-align: middle; padding-right: 8px;">
              <span style="font-size: 22px;">📍</span>
            </td>
            <td style="vertical-align: middle;">
              <span style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 22px; font-weight: 900; color: #1e3a8a; letter-spacing: 2px; text-transform: uppercase;">
                TERRA<span style="color: #d97706;">HOLIC</span>
              </span>
            </td>
          </tr>
        </table>
      </div>
    </div>
  `;
}

export class EmailService {
  async sendVerificationEmail(to: string, token: string): Promise<boolean> {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?email=${encodeURIComponent(to)}&token=${token}`;
    const subject = 'Xác minh tài khoản Terraholic';
    const logoHtml = getLogoHeaderHtml();
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        ${logoHtml}
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

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const ok = await sendNativeSmtpEmail({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: 465,
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
        to,
        subject,
        html
      });
      if (ok) return true;
    }

    // Mock Mode Fallback
    const mockEmailPath = path.resolve(__dirname, '../../../../mock_emails.log');
    const mockContent = `[${new Date().toISOString()}] To: ${to} | Subject: ${subject} | Link: ${verificationUrl}\n`;
    try {
      fs.appendFileSync(mockEmailPath, mockContent);
      console.log(`[EmailService] [MOCK] Verification link written to mock_emails.log: ${verificationUrl}`);
      return true;
    } catch (e) {
      return false;
    }
  }

  async sendResetPasswordOtp(to: string, otp: string): Promise<boolean> {
    const subject = '🔐 Mã OTP Xác Thực Đổi Mật Khẩu — Terraholic';
    const logoHtml = getLogoHeaderHtml();
    const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Mã OTP Đổi Mật Khẩu - Terraholic</title>
</head>
<body style="margin:0; padding:0; background-color:#f8fafc; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f8fafc; padding: 40px 10px;">
    <tr>
      <td align="center">
        <!-- Main Email Container -->
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color:#ffffff; border-radius:24px; overflow:hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #b45309 0%, #d97706 50%, #f59e0b 100%); padding: 40px 30px; text-align: center; color: #ffffff;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    ${logoHtml}
                    <div style="background: rgba(255,255,255,0.18); display: inline-block; padding: 8px 18px; border-radius: 99px; border: 1px solid rgba(255,255,255,0.3); font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px; color: #fffbeb;">
                      🔐 SECURITY VERIFICATION CODE
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                      MÃ XÁC THỰC OTP ĐỔI MẬT KHẨU
                    </h1>
                    <p style="margin: 8px 0 0 0; font-size: 13px; color: #fef3c7; font-weight: 500;">
                      Nền Tảng Du Lịch & Quản Trị Hệ Thống Terraholic
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 35px 35px 25px 35px; color: #1e293b;">
              <h2 style="font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 0;">
                Chào bạn 👋,
              </h2>
              <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
                Chúng tôi nhận được yêu cầu xác thực để <strong>Đặt lại / Đổi mật khẩu</strong> cho tài khoản của bạn trên hệ thống Terraholic. Vui lòng nhập mã OTP bên dưới để hoàn tất:
              </p>

              <!-- OTP Code Display Card -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #fffbeb; border-radius: 20px; border: 2px dashed #f59e0b; margin-bottom: 28px; text-align: center;">
                <tr>
                  <td style="padding: 30px 20px;">
                    <div style="font-size: 11px; font-weight: 800; color: #b45309; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 10px;">
                      MÃ XÁC THỰC OTP 6 CHỮ SỐ
                    </div>
                    
                    <!-- Large OTP Digits -->
                    <div style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 900; color: #b45309; letter-spacing: 12px; background-color: #ffffff; display: inline-block; padding: 12px 28px; border-radius: 14px; border: 1px solid #fde68a; box-shadow: 0 4px 12px rgba(217,119,6,0.12);">
                      ${otp}
                    </div>

                    <div style="font-size: 12px; color: #92400e; font-weight: 600; margin-top: 14px;">
                      ⏱️ Mã OTP có hiệu lực trong vòng <strong style="color: #b45309;">15 phút</strong>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Warning Box -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 16px; font-size: 12px; color: #64748b; line-height: 1.6;">
                    🛡️ <strong>BẢO VỆ TÀI KHOẢN:</strong> Không chia sẻ mã OTP này cho bất kỳ ai (kể cả nhân viên Terraholic). Nếu bạn không gửi yêu cầu này, vui lòng bỏ qua email hoặc đổi mật khẩu ngay để bảo vệ tài khoản.
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer Section -->
          <tr>
            <td style="background-color: #f8fafc; padding: 25px 35px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 11px; line-height: 1.6;">
              <p style="margin: 0; font-weight: 700; color: #64748b;">Nền tảng Mạng xã hội & Trợ lý Du lịch AI Terraholic</p>
              <p style="margin: 4px 0 0 0;">Email này được gửi tự động. Vui lòng không phản hồi trực tiếp qua email này.</p>
              <p style="margin: 8px 0 0 0; font-family: monospace; color: #cbd5e1;">System Time: ${new Date().toLocaleString('vi-VN')}</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const ok = await sendNativeSmtpEmail({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: 465,
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
        to,
        subject,
        html
      });
      if (ok) return true;
    }

    // Mock Mode Fallback
    const mockEmailPath = path.resolve(__dirname, '../../../../mock_emails.log');
    const mockContent = `[${new Date().toISOString()}] To: ${to} | Subject: ${subject} | OTP Code: ${otp}\n`;
    try {
      fs.appendFileSync(mockEmailPath, mockContent);
      console.log(`[EmailService] [MOCK] OTP code written to mock_emails.log: ${otp}`);
      return true;
    } catch (e) {
      return false;
    }
  }

  async sendRegisterOtpEmail(to: string, otp: string): Promise<boolean> {
    const subject = '🚀 Mã OTP Xác Thực Đăng Ký Tài Khoản — Terraholic';
    const logoHtml = getLogoHeaderHtml();
    const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Mã OTP Đăng Ký Tài Khoản - Terraholic</title>
</head>
<body style="margin:0; padding:0; background-color:#f8fafc; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f8fafc; padding: 40px 10px;">
    <tr>
      <td align="center">
        <!-- Main Email Container -->
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color:#ffffff; border-radius:24px; overflow:hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #059669 0%, #10b981 50%, #06b6d4 100%); padding: 40px 30px; text-align: center; color: #ffffff;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    ${logoHtml}
                    <div style="background: rgba(255,255,255,0.18); display: inline-block; padding: 8px 18px; border-radius: 99px; border: 1px solid rgba(255,255,255,0.3); font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px; color: #ecfdf5;">
                      🚀 ACCOUNT REGISTRATION OTP
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                      MÃ XÁC THỰC ĐĂNG KÝ TÀI KHOẢN
                    </h1>
                    <p style="margin: 8px 0 0 0; font-size: 13px; color: #d1fae5; font-weight: 500;">
                      Nền Tảng Mạng Xã Hội & Trợ Lý Du Lịch AI Terraholic
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 35px 35px 25px 35px; color: #1e293b;">
              <h2 style="font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 0;">
                Chào mừng bạn đến với Terraholic 👋,
              </h2>
              <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
                Cảm ơn bạn đã đăng ký tài khoản trên nền tảng du lịch AI Terraholic. Vui lòng nhập mã OTP 6 chữ số dưới đây vào form đăng ký để hoàn tất tạo tài khoản:
              </p>

              <!-- OTP Code Display Card -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #ecfdf5; border-radius: 20px; border: 2px dashed #10b981; margin-bottom: 28px; text-align: center;">
                <tr>
                  <td style="padding: 30px 20px;">
                    <div style="font-size: 11px; font-weight: 800; color: #047857; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 10px;">
                      MÃ XÁC THỰC OTP ĐĂNG KÝ TÀI KHOẢN
                    </div>
                    
                    <!-- Large OTP Digits -->
                    <div style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 900; color: #047857; letter-spacing: 12px; background-color: #ffffff; display: inline-block; padding: 12px 28px; border-radius: 14px; border: 1px solid #a7f3d0; box-shadow: 0 4px 12px rgba(16,185,129,0.15);">
                      ${otp}
                    </div>

                    <div style="font-size: 12px; color: #065f46; font-weight: 600; margin-top: 14px;">
                      ⏱️ Mã OTP có hiệu lực trong vòng <strong style="color: #047857;">15 phút</strong>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Warning Box -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 16px; font-size: 12px; color: #64748b; line-height: 1.6;">
                    🛡️ <strong>BẢO VỆ TÀI KHOẢN:</strong> Không chia sẻ mã OTP này cho bất kỳ ai. Nếu bạn không gửi yêu cầu tạo tài khoản này, vui lòng bỏ qua email.
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer Section -->
          <tr>
            <td style="background-color: #f8fafc; padding: 25px 35px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 11px; line-height: 1.6;">
              <p style="margin: 0; font-weight: 700; color: #64748b;">Nền tảng Mạng xã hội & Trợ lý Du lịch AI Terraholic</p>
              <p style="margin: 4px 0 0 0;">Email này được gửi tự động khi đăng ký tài khoản mới. Vui lòng không phản hồi trực tiếp qua email này.</p>
              <p style="margin: 8px 0 0 0; font-family: monospace; color: #cbd5e1;">System Time: ${new Date().toLocaleString('vi-VN')}</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const ok = await sendNativeSmtpEmail({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: 465,
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
        to,
        subject,
        html
      });
      if (ok) return true;
    }

    // Mock Mode Fallback
    const mockEmailPath = path.resolve(__dirname, '../../../../mock_emails.log');
    const mockContent = `[${new Date().toISOString()}] Register OTP Email | To: ${to} | OTP: ${otp}\n`;
    try {
      fs.appendFileSync(mockEmailPath, mockContent);
      return true;
    } catch (e) {
      return false;
    }
  }

  async sendAdminCredentialsEmail(to: string, fullName: string, passwordTemp: string = 'Terraholic@2026'): Promise<boolean> {
    const adminUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin`;
    const subject = '🛡️ Thông báo Cấp Quyền & Mật Khẩu Đăng Nhập Admin Portal — Terraholic';
    const logoHtml = getLogoHeaderHtml();
    const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Cấp Quyền Admin - Terraholic Portal</title>
</head>
<body style="margin:0; padding:0; background-color:#f1f5f9; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f1f5f9; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color:#ffffff; border-radius:24px; overflow:hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #4f46e5 100%); padding: 40px 30px; text-align: center; color: #ffffff;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    ${logoHtml}
                    <div style="background: rgba(255,255,255,0.15); display: inline-block; padding: 8px 18px; border-radius: 99px; border: 1px solid rgba(255,255,255,0.3); font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px; color: #fbbf24;">
                      🛡️ ADMIN PRIVILEGES GRANTED
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <h1 style="margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                      TERRAHOLIC ADMIN PORTAL
                    </h1>
                    <p style="margin: 8px 0 0 0; font-size: 13px; color: #e0e7ff; font-weight: 500;">
                      Nền Tảng Quản Trị Hệ Thống Du Lịch & Mạng Xã Hội AI
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 35px 35px 25px 35px; color: #1e293b;">
              <h2 style="font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 0;">
                Kính gửi <span style="color: #2563eb;">${fullName || 'Quản trị viên'}</span> 👋,
              </h2>
              <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
                Chúc mừng bạn đã được ban quản trị phê duyệt và cấp <strong>Quyền Quản Trị Viên (Admin)</strong> trên hệ thống Nền Tảng Du Lịch AI Terraholic. Dưới đây là thông tin tài khoản và mật khẩu khởi tạo để bạn truy cập vào Admin Portal:
              </p>

              <!-- Credentials Card -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-radius: 16px; border: 1px solid #cbd5e1; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 24px;">
                    <!-- URL -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 14px;">
                      <tr>
                        <td width="30" style="font-size: 16px;">🌐</td>
                        <td style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase;">Trang quản trị (Portal URL)</td>
                      </tr>
                      <tr>
                        <td></td>
                        <td style="font-size: 14px; font-weight: 800; color: #2563eb; font-family: monospace; word-break: break-all;">
                          ${adminUrl}
                        </td>
                      </tr>
                    </table>

                    <div style="border-top: 1px dashed #cbd5e1; margin: 12px 0;"></div>

                    <!-- Email Account -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 14px;">
                      <tr>
                        <td width="30" style="font-size: 16px;">👤</td>
                        <td style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase;">Tên tài khoản (Email)</td>
                      </tr>
                      <tr>
                        <td></td>
                        <td style="font-size: 14px; font-weight: 800; color: #0f172a; font-family: monospace;">
                          ${to}
                        </td>
                      </tr>
                    </table>

                    <div style="border-top: 1px dashed #cbd5e1; margin: 12px 0;"></div>

                    <!-- Temporary Password -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="30" style="font-size: 16px;">🔑</td>
                        <td style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase;">Mật khẩu đăng nhập khởi tạo</td>
                      </tr>
                      <tr>
                        <td></td>
                        <td>
                          <div style="display: inline-block; background-color: #e0e7ff; color: #3730a3; padding: 10px 18px; border-radius: 10px; font-family: 'Courier New', Courier, monospace; font-size: 18px; font-weight: 900; letter-spacing: 2px; border: 1px solid #c7d2fe; margin-top: 6px;">
                            ${passwordTemp}
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Security Notice -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #fffbeb; border-radius: 12px; border: 1px solid #fde68a; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 14px 18px; font-size: 12px; color: #92400e; line-height: 1.5;">
                    💡 <strong>KHUYẾN NGHỊ BẢO MẬT:</strong> Để đảm bảo an toàn tối đa cho hệ thống, hãy bấm vào avatar tên tài khoản ở góc phải trang Admin Portal và thực hiện <strong>Đổi mật khẩu mới</strong> ngay trong lần đăng nhập đầu tiên.
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="${adminUrl}" target="_blank" style="background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); color: #ffffff; text-decoration: none; padding: 16px 36px; border-radius: 14px; font-size: 13px; font-weight: 900; display: inline-block; box-shadow: 0 6px 20px rgba(37,99,235,0.35); text-transform: uppercase; letter-spacing: 0.5px;">
                      ĐĂNG NHẬP ADMIN PORTAL NGAY →
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer Section -->
          <tr>
            <td style="background-color: #f8fafc; padding: 25px 35px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 11px; line-height: 1.6;">
              <p style="margin: 0; font-weight: 700; color: #64748b;">Nền tảng Mạng xã hội & Trợ lý Du lịch AI Terraholic</p>
              <p style="margin: 4px 0 0 0;">Email này được gửi tự động khi phân quyền quản trị hệ thống. Vui lòng không phản hồi trực tiếp qua email này.</p>
              <p style="margin: 8px 0 0 0; font-family: monospace; color: #cbd5e1;">System Time: ${new Date().toLocaleString('vi-VN')}</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const ok = await sendNativeSmtpEmail({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: 465,
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
        to,
        subject,
        html
      });
      if (ok) return true;
    }

    // Mock Mode Fallback
    const mockEmailPath = path.resolve(__dirname, '../../../../mock_emails.log');
    const mockContent = `[${new Date().toISOString()}] Admin Credentials Email | To: ${to} | Password: ${passwordTemp} | Portal: ${adminUrl}\n`;
    try {
      fs.appendFileSync(mockEmailPath, mockContent);
      return true;
    } catch (e) {
      return false;
    }
  }

  async sendAdminRevokedEmail(to: string, fullName: string): Promise<boolean> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const subject = '⚠️ Thông báo Thu Hồi Quyền Quản Trị Viên (Admin) — Terraholic';
    const logoHtml = getLogoHeaderHtml();
    const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Thu Hồi Quyền Admin - Terraholic Portal</title>
</head>
<body style="margin:0; padding:0; background-color:#f8fafc; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f8fafc; padding: 40px 10px;">
    <tr>
      <td align="center">
        <!-- Main Email Container -->
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color:#ffffff; border-radius:24px; overflow:hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #881337 0%, #e11d48 50%, #f43f5e 100%); padding: 40px 30px; text-align: center; color: #ffffff;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    ${logoHtml}
                    <div style="background: rgba(255,255,255,0.15); display: inline-block; padding: 8px 18px; border-radius: 99px; border: 1px solid rgba(255,255,255,0.3); font-size: 11px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px; color: #ffe4e6;">
                      ⚠️ ADMIN PRIVILEGES REVOKED
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                      THÔNG BÁO TẮT QUYỀN QUẢN TRỊ VIÊN
                    </h1>
                    <p style="margin: 8px 0 0 0; font-size: 13px; color: #ffe4e6; font-weight: 500;">
                      Hệ Thống Mạng Xã Hội Du Lịch AI Terraholic
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 35px 35px 25px 35px; color: #1e293b;">
              <h2 style="font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 0;">
                Kính gửi <span style="color: #e11d48;">${fullName || 'Thành viên'}</span> 👋,
              </h2>
              <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
                Ban quản trị hệ thống Terraholic xin thông báo: Tài khoản của bạn đã được thay đổi phân quyền từ <strong>Quản Trị Viên (Admin)</strong> về <strong>Thành Viên Thông Thường (User)</strong>.
              </p>

              <!-- Status Card -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #fff1f2; border-radius: 16px; border: 1px solid #fecdd3; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 24px;">
                    <!-- Email Account -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 14px;">
                      <tr>
                        <td width="30" style="font-size: 16px;">👤</td>
                        <td style="font-size: 11px; font-weight: 800; color: #9f1239; text-transform: uppercase;">Tài khoản cập nhật</td>
                      </tr>
                      <tr>
                        <td></td>
                        <td style="font-size: 14px; font-weight: 800; color: #881337; font-family: monospace;">
                          ${to}
                        </td>
                      </tr>
                    </table>

                    <div style="border-top: 1px dashed #fca5a5; margin: 12px 0;"></div>

                    <!-- Role Status -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="30" style="font-size: 16px;">🔰</td>
                        <td style="font-size: 11px; font-weight: 800; color: #9f1239; text-transform: uppercase;">Vai trò mới</td>
                      </tr>
                      <tr>
                        <td></td>
                        <td>
                          <div style="display: inline-block; background-color: #ffe4e6; color: #9f1239; padding: 6px 14px; border-radius: 8px; font-size: 13px; font-weight: 800; border: 1px solid #fecdd3; margin-top: 4px;">
                            THÀNH VIÊN THƯỜNG (USER)
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Notice Box -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 16px; font-size: 13px; color: #475569; line-height: 1.6;">
                    ✨ <strong>BẠN VẪN LÀ THÀNH VIÊN CỦA TERRAHOLIC!</strong><br/>
                    Tài khoản của bạn vẫn có thể đăng nhập bình thường vào trang chủ Terraholic để trải nghiệm đầy đủ các tính năng: Đăng bài viết chia sẻ du lịch, Tạo lộ trình AI, Lên lịch trình săn mây và tương tác cùng cộng đồng.
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="${frontendUrl}" target="_blank" style="background: linear-gradient(135deg, #0f172a 0%, #334155 100%); color: #ffffff; text-decoration: none; padding: 16px 36px; border-radius: 14px; font-size: 13px; font-weight: 900; display: inline-block; box-shadow: 0 6px 20px rgba(15,23,42,0.25); text-transform: uppercase; letter-spacing: 0.5px;">
                      TRUY CẬP TRANG CHỦ TERRAHOLIC →
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer Section -->
          <tr>
            <td style="background-color: #f8fafc; padding: 25px 35px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 11px; line-height: 1.6;">
              <p style="margin: 0; font-weight: 700; color: #64748b;">Nền tảng Mạng xã hội & Trợ lý Du lịch AI Terraholic</p>
              <p style="margin: 4px 0 0 0;">Email này được gửi tự động khi phân quyền quản trị hệ thống. Vui lòng không phản hồi trực tiếp qua email này.</p>
              <p style="margin: 8px 0 0 0; font-family: monospace; color: #cbd5e1;">System Time: ${new Date().toLocaleString('vi-VN')}</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const ok = await sendNativeSmtpEmail({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: 465,
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
        to,
        subject,
        html
      });
      if (ok) return true;
    }

    // Mock Mode Fallback
    const mockEmailPath = path.resolve(__dirname, '../../../../mock_emails.log');
    const mockContent = `[${new Date().toISOString()}] Admin Revoked Email | To: ${to}\n`;
    try {
      fs.appendFileSync(mockEmailPath, mockContent);
      return true;
    } catch (e) {
      return false;
    }
  }
}
