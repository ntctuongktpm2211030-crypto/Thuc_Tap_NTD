/**
 * SmartTravel / Terraholic Reported Posts Store
 * Đồng bộ các báo cáo vi phạm thời gian thực từ lữ khách trên Feed sang Admin Portal kèm thông tin tác giả chuẩn
 */

export interface ReportedPostRecord {
  postId: string;
  reason: string;
  description?: string;
  reportedAt: string;
  reportedBy?: string;
  authorName?: string;
  authorEmail?: string;
  authorAvatar?: string;
}

const reportedPostsMap = new Map<string, ReportedPostRecord>();

// Khởi tạo bài viết báo cáo mẫu để Admin Portal luôn có dữ liệu minh họa
reportedPostsMap.set('post-reported-demo', {
  postId: 'post-reported-demo',
  reason: 'Quảng cáo lừa đảo / Cờ bạc giả mạo',
  description: 'Nhận kéo bài phượt, bán số đề chuẩn 100%',
  reportedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  authorName: 'Tài khoản Spam',
  authorEmail: 'rac_spam@gmail.com',
  authorAvatar: ''
});

export const reportedPostsStore = {
  addReport(
    postId: string, 
    reason: string, 
    description?: string, 
    userId?: string,
    authorInfo?: { authorName?: string; authorEmail?: string; authorAvatar?: string }
  ) {
    reportedPostsMap.set(postId, {
      postId,
      reason: reason || 'Vi phạm tiêu chuẩn cộng đồng',
      description: description || '',
      reportedAt: new Date().toISOString(),
      reportedBy: userId,
      authorName: authorInfo?.authorName || 'Thành viên Terraholic',
      authorEmail: authorInfo?.authorEmail || 'member@terraholic.com',
      authorAvatar: authorInfo?.authorAvatar || '',
    });
    console.log(`[REPORT STORE] 🚩 Đã lưu báo cáo vi phạm cho bài [${postId}] của tác giả [${authorInfo?.authorName || 'Thành viên'}]. Lý do: "${reason}". Tổng bài bị báo cáo: ${reportedPostsMap.size}`);
  },

  getReport(postId: string): ReportedPostRecord | undefined {
    return reportedPostsMap.get(postId);
  },

  getAllReports(): Map<string, ReportedPostRecord> {
    return reportedPostsMap;
  },

  isReported(postId: string): boolean {
    return reportedPostsMap.has(postId);
  },

  removeReport(postId: string) {
    reportedPostsMap.delete(postId);
  }
};
