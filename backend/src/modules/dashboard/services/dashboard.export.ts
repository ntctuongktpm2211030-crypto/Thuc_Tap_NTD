import { getPeriodComparison } from './dashboard.comparison';
import { getTrendingDestinations } from './dashboard.trending';
import { getAiInsights2 } from './dashboard.insights';
import prisma from '../../../config/db';

export async function generateExportData(format: 'pdf' | 'csv' | 'excel') {
  const [
    comparison,
    trending,
    aiInsights,
    totalUsers,
    totalPosts,
    totalCheckins
  ] = await Promise.all([
    getPeriodComparison('7days'),
    getTrendingDestinations(5),
    getAiInsights2(),
    prisma.user.count(),
    prisma.post.count({ where: { deletedAt: null } }),
    prisma.checkIn.count()
  ]);

  const timestamp = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

  if (format === 'csv' || format === 'excel') {
    const separator = format === 'csv' ? ',' : '\t';
    const filename = `Terraholic_Report_${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : 'xls'}`;
    
    let content = '';
    
    // Header Info
    content += `BAO CAO THONG KE HE THONG TERRAHOLIC\n`;
    content += `Thoi gian xuat ban: ${timestamp}\n\n`;

    // Summary Section
    content += `1. CHI SO TONG QUAN\n`;
    content += `Chi so${separator}Hien tai${separator}Ky truoc${separator}Tang truong (%)\n`;
    content += `Nguoi dung moi${separator}${comparison.users.current}${separator}${comparison.users.previous}${separator}${comparison.users.percentageChange}%\n`;
    content += `Bai dang moi${separator}${comparison.posts.current}${separator}${comparison.posts.previous}${separator}${comparison.posts.percentageChange}%\n`;
    content += `Check-in moi${separator}${comparison.checkins.current}${separator}${comparison.checkins.previous}${separator}${comparison.checkins.percentageChange}%\n`;
    content += `Luyen thich moi${separator}${comparison.likes.current}${separator}${comparison.likes.previous}${separator}${comparison.likes.percentageChange}%\n`;
    content += `Lượt tim kiem moi${separator}${comparison.searches.current}${separator}${comparison.searches.previous}${separator}${comparison.searches.percentageChange}%\n\n`;

    // Trending Section
    content += `2. TOP DIEM DEN THINH HANH\n`;
    content += `Hang${separator}Ten dia danh${separator}Check-ins${separator}Trending Score${separator}Xu huong\n`;
    trending.forEach((item, idx) => {
      content += `${idx + 1}${separator}${item.name}${separator}${item.checkinCount}${separator}${item.trendingScore}${separator}${item.growthRate}%\n`;
    });
    content += `\n`;

    // AI Insights
    content += `3. AI INSIGHTS XU HUONG\n`;
    content += `Tong quan: ${aiInsights.overview.join('; ')}\n`;
    content += `Xu huong: ${aiInsights.trends.join('; ')}\n`;
    content += `Canh bao: ${aiInsights.warnings.join('; ')}\n`;
    content += `De xuat: ${aiInsights.recommendations.join('; ')}\n`;

    return { content, filename, contentType: format === 'csv' ? 'text/csv' : 'application/vnd.ms-excel' };
  } else {
    // PDF layout represented as printable, high-fidelity responsive HTML
    const filename = `Terraholic_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    
    let html = `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <title>Báo cáo Thống kê Hệ thống Terraholic</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #1e293b;
            padding: 40px;
            line-height: 1.6;
            background: #ffffff;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: 800;
            color: #2563eb;
            letter-spacing: -0.5px;
          }
          .timestamp {
            font-size: 11px;
            color: #64748b;
            text-align: right;
          }
          h1 {
            font-size: 22px;
            color: #0f172a;
            margin-bottom: 5px;
          }
          h2 {
            font-size: 14px;
            color: #2563eb;
            text-transform: uppercase;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 8px;
            margin-top: 30px;
            margin-bottom: 15px;
            font-weight: 700;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 12px;
          }
          th {
            background: #f8fafc;
            color: #475569;
            font-weight: 700;
            text-align: left;
            padding: 10px;
            border-bottom: 1px solid #cbd5e1;
          }
          td {
            padding: 10px;
            border-bottom: 1px solid #e2e8f0;
            color: #334155;
          }
          .badge {
            display: inline-block;
            padding: 3px 6px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 700;
          }
          .badge-green { background: #dcfce7; color: #15803d; }
          .badge-red { background: #fee2e2; color: #b91c1c; }
          .badge-gray { background: #f1f5f9; color: #475569; }
          .ai-box {
            background: #f8fafc;
            border-left: 4px solid #8b5cf6;
            padding: 15px;
            border-radius: 4px;
            font-size: 12px;
          }
          .ai-section {
            margin-bottom: 10px;
          }
          .ai-title {
            font-weight: 700;
            color: #6d28d9;
          }
          @media print {
            body { padding: 0; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div style="text-align: center; margin-bottom: 20px;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">
            🖨️ Tải file PDF / In Báo Cáo
          </button>
        </div>

        <div class="header">
          <div>
            <div class="logo">TERRAHOLIC</div>
            <h1>Báo cáo Analytics Hệ thống</h1>
            <p style="font-size: 12px; color: #64748b; margin: 0;">Mạng xã hội du lịch thông minh</p>
          </div>
          <div class="timestamp">
            <p style="margin: 0;">Ngày xuất bản: <strong>${timestamp}</strong></p>
            <p style="margin: 3px 0 0 0;">Tổng số thành viên: <strong>${totalUsers.toLocaleString()}</strong></p>
          </div>
        </div>

        <h2>1. Chỉ số tăng trưởng tổng quan (7 ngày)</h2>
        <table>
          <thead>
            <tr>
              <th>Chỉ số</th>
              <th>Kỳ này (7 ngày)</th>
              <th>Kỳ trước (7 ngày)</th>
              <th>Tỷ lệ tăng trưởng</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Người dùng mới đăng ký</td>
              <td><strong>${comparison.users.current}</strong></td>
              <td>${comparison.users.previous}</td>
              <td><span class="badge ${comparison.users.color === 'green' ? 'badge-green' : 'badge-red'}">${comparison.users.direction === 'up' ? '↑' : '↓'} ${comparison.users.percentageChange}%</span></td>
            </tr>
            <tr>
              <td>Bài viết mới tạo</td>
              <td><strong>${comparison.posts.current}</strong></td>
              <td>${comparison.posts.previous}</td>
              <td><span class="badge ${comparison.posts.color === 'green' ? 'badge-green' : 'badge-red'}">${comparison.posts.direction === 'up' ? '↑' : '↓'} ${comparison.posts.percentageChange}%</span></td>
            </tr>
            <tr>
              <td>Lượt check-in điểm đến</td>
              <td><strong>${comparison.checkins.current}</strong></td>
              <td>${comparison.checkins.previous}</td>
              <td><span class="badge ${comparison.checkins.color === 'green' ? 'badge-green' : 'badge-red'}">${comparison.checkins.direction === 'up' ? '↑' : '↓'} ${comparison.checkins.percentageChange}%</span></td>
            </tr>
            <tr>
              <td>Tương tác Likes mới</td>
              <td><strong>${comparison.likes.current}</strong></td>
              <td>${comparison.likes.previous}</td>
              <td><span class="badge ${comparison.likes.color === 'green' ? 'badge-green' : 'badge-red'}">${comparison.likes.direction === 'up' ? '↑' : '↓'} ${comparison.likes.percentageChange}%</span></td>
            </tr>
          </tbody>
        </table>

        <h2>2. Danh sách địa điểm du lịch thịnh hành</h2>
        <table>
          <thead>
            <tr>
              <th>Hạng</th>
              <th>Địa danh</th>
              <th>Lượt Check-in</th>
              <th>Trending Score</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            ${trending.map((item, idx) => `
              <tr>
                <td><strong>${idx + 1}</strong></td>
                <td><strong>${item.name}</strong></td>
                <td>${item.checkinCount}</td>
                <td>${item.trendingScore}</td>
                <td><span class="badge ${item.trend === 'up' ? 'badge-green' : item.trend === 'down' ? 'badge-red' : 'badge-gray'}">${item.growthRate}%</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h2>3. Phân tích xu hướng từ Trợ lý AI (AI Insights 2.0)</h2>
        <div class="ai-box">
          <div class="ai-section">
            <span class="ai-title">📈 Tổng quan:</span>
            <p style="margin: 4px 0 10px 0;">${aiInsights.overview.join('; ')}</p>
          </div>
          <div class="ai-section">
            <span class="ai-title">🔥 Xu hướng:</span>
            <p style="margin: 4px 0 10px 0;">${aiInsights.trends.join('; ')}</p>
          </div>
          <div class="ai-section">
            <span class="ai-title">⚠️ Cảnh báo:</span>
            <p style="margin: 4px 0 10px 0;">${aiInsights.warnings.join('; ')}</p>
          </div>
          <div class="ai-section">
            <span class="ai-title">💡 Đề xuất:</span>
            <p style="margin: 4px 0 0 0;">${aiInsights.recommendations.join('; ')}</p>
          </div>
        </div>

        <script>
          // Automatically trigger browser print dialog when loaded
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          }
        </script>
      </body>
      </html>
    `;
    return { content: html, filename, contentType: 'text/html' };
  }
}
