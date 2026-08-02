import React from 'react';
import { Users, FileText, Map, Clock, BookOpen, Activity, Server } from 'lucide-react';

interface StatsData {
  totalUsers: number;
  totalPosts: number;
  totalTrips: number;
  totalCheckIns: number;
  totalHandbooks: number;
  serverUptime: number;
  activeTimestamp: string;
}

export const AdminOverviewTab: React.FC<{ stats: StatsData | null; loading: boolean }> = ({ stats, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
        <Activity className="animate-spin" size={20} /> Đang tải dữ liệu thống kê thời gian thực...
      </div>
    );
  }

  const formatUptime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs} giờ ${mins} phút ${secs} giây`;
  };

  const statCards = [
    { title: 'Tổng Tài Khoản Người Dùng', count: stats?.totalUsers || 0, icon: Users, color: 'from-blue-600 to-indigo-600' },
    { title: 'Tổng Bài Viết Cộng Đồng', count: stats?.totalPosts || 0, icon: FileText, color: 'from-emerald-600 to-teal-600' },
    { title: 'Hành Trình Du Lịch Lập Bởi AI', count: stats?.totalTrips || 0, icon: Map, color: 'from-purple-600 to-pink-600' },
    { title: 'Tài Liệu Cẩm Nang Đã Cập Nhật', count: stats?.totalHandbooks || 0, icon: BookOpen, color: 'from-amber-600 to-orange-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Realtime Status Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm shadow-slate-200/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Server className="text-blue-600" size={22} /> Thống Kê Thời Gian Thực Nền Tảng Terraholic
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">Dữ liệu từ PostgreSQL • Prisma ORM • Socket.io • Express API Core</p>
        </div>
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-right">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Thời gian máy chủ ghi nhận</div>
          <div className="text-xs font-mono font-bold text-emerald-600 flex items-center gap-1.5 justify-end mt-0.5">
            <Clock size={13} className="text-emerald-500" /> {stats?.activeTimestamp || 'N/A'}
          </div>
        </div>
      </div>

      {/* Grid of Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm shadow-slate-200/50 relative overflow-hidden group hover:shadow-md transition-all">
              <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${card.color} opacity-10 rounded-full blur-xl group-hover:opacity-20 transition-opacity`} />
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-500">{card.title}</span>
                <div className={`p-2.5 rounded-xl bg-slate-100 text-blue-600`}>
                  <Icon size={20} />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-black text-slate-900">{card.count.toLocaleString()}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* System Health */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm shadow-slate-200/50 space-y-4">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <Activity size={16} className="text-blue-600" /> Chỉ Số Trạng Thái Hệ Thống
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <span className="text-slate-500 block mb-1 font-medium">Thời gian hoạt động liên tục (Uptime)</span>
            <span className="font-mono text-slate-900 font-bold">{stats?.serverUptime ? formatUptime(stats.serverUptime) : 'N/A'}</span>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <span className="text-slate-500 block mb-1 font-medium">Cơ sở Dữ liệu</span>
            <span className="font-bold text-emerald-600">PostgreSQL (51 Models Active)</span>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <span className="text-slate-500 block mb-1 font-medium">Trợ lý Ảo Multi-Agent</span>
            <span className="font-bold text-blue-600">Sẵn sàng (Gemini + RAG Hybrid)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverviewTab;
