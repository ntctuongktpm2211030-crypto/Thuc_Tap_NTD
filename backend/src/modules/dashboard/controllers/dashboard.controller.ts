import { Request, Response } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { DashboardFilter } from '../types/dashboard.types';

// Import Phase II services
import { getPeriodComparison } from '../services/dashboard.comparison';
import { getSparklineTrends } from '../services/dashboard.sparkline';
import { getGisHotspots } from '../services/dashboard.gis';
import { getTrendingDestinations } from '../services/dashboard.trending';
import { getPredictions, getDestinationsPredictions } from '../services/dashboard.prediction';
import { getUserBehaviorProfile } from '../services/dashboard.behavior';
import { getFunnelAnalytics } from '../services/dashboard.funnel';
import { generateExportData } from '../services/dashboard.export';
import { getDrilldownData } from '../services/dashboard.drilldown';
import { getAiInsights2 } from '../services/dashboard.insights';

export class DashboardController {
  private service: DashboardService;

  constructor() {
    this.service = new DashboardService();
  }

  getSummary = async (_req: Request, res: Response) => {
    try {
      const result = await this.service.getSummary();
      return res.status(200).json(result);
    } catch (err: any) {
      console.error('[DashboardController/getSummary]', err);
      return res.status(500).json({ error: 'Không thể lấy thông tin tóm tắt dashboard.' });
    }
  };

  getUsers = async (req: Request, res: Response) => {
    try {
      const filter = (req.query.filter as DashboardFilter) || '7days';
      const result = await this.service.getUserRegistrationStats(filter);
      return res.status(200).json(result);
    } catch (err: any) {
      console.error('[DashboardController/getUsers]', err);
      return res.status(500).json({ error: 'Không thể lấy thống kê đăng ký tài khoản.' });
    }
  };

  getPosts = async (_req: Request, res: Response) => {
    try {
      const result = await this.service.getPostStats();
      return res.status(200).json(result);
    } catch (err: any) {
      console.error('[DashboardController/getPosts]', err);
      return res.status(500).json({ error: 'Không thể lấy thống kê bài viết.' });
    }
  };

  getTopPosts = async (req: Request, res: Response) => {
    try {
      const limit = Number(req.query.limit) || 10;
      const result = await this.service.getTopPosts(limit);
      return res.status(200).json(result);
    } catch (err: any) {
      console.error('[DashboardController/getTopPosts]', err);
      return res.status(500).json({ error: 'Không thể lấy top bài viết nổi bật.' });
    }
  };

  getTopUsers = async (req: Request, res: Response) => {
    try {
      const limit = Number(req.query.limit) || 10;
      const result = await this.service.getTopUsers(limit);
      return res.status(200).json(result);
    } catch (err: any) {
      console.error('[DashboardController/getTopUsers]', err);
      return res.status(500).json({ error: 'Không thể lấy top người dùng nổi bật.' });
    }
  };

  getCheckins = async (req: Request, res: Response) => {
    try {
      const limit = Number(req.query.limit) || 10;
      const result = await this.service.getCheckinStats(limit);
      return res.status(200).json(result);
    } catch (err: any) {
      console.error('[DashboardController/getCheckins]', err);
      return res.status(500).json({ error: 'Không thể lấy thống kê check-in.' });
    }
  };

  getHotLocations = async (req: Request, res: Response) => {
    try {
      const limit = Number(req.query.limit) || 10;
      const result = await this.service.getHotLocations(limit);
      return res.status(200).json(result);
    } catch (err: any) {
      console.error('[DashboardController/getHotLocations]', err);
      return res.status(500).json({ error: 'Không thể lấy danh sách địa điểm hot.' });
    }
  };

  getTopSearches = async (req: Request, res: Response) => {
    try {
      const limit = Number(req.query.limit) || 20;
      const result = await this.service.getTopSearches(limit);
      return res.status(200).json(result);
    } catch (err: any) {
      console.error('[DashboardController/getTopSearches]', err);
      return res.status(500).json({ error: 'Không thể lấy danh sách từ khóa tìm kiếm nhiều nhất.' });
    }
  };

  getProvinces = async (_req: Request, res: Response) => {
    try {
      const result = await this.service.getProvinceStats();
      return res.status(200).json(result);
    } catch (err: any) {
      console.error('[DashboardController/getProvinces]', err);
      return res.status(500).json({ error: 'Không thể lấy thống kê tỉnh/thành.' });
    }
  };

  getInteractions = async (req: Request, res: Response) => {
    try {
      const filter = (req.query.filter as DashboardFilter) || '7days';
      const result = await this.service.getInteractionStats(filter);
      return res.status(200).json(result);
    } catch (err: any) {
      console.error('[DashboardController/getInteractions]', err);
      return res.status(500).json({ error: 'Không thể lấy thống kê tương tác.' });
    }
  };

  getHeatmap = async (_req: Request, res: Response) => {
    try {
      const result = await this.service.getHeatmapData();
      return res.status(200).json(result);
    } catch (err: any) {
      console.error('[DashboardController/getHeatmap]', err);
      return res.status(500).json({ error: 'Không thể lấy dữ liệu heatmap hoạt động.' });
    }
  };

  getAiInsights = async (_req: Request, res: Response) => {
    try {
      const result = await this.service.getAiInsights();
      return res.status(200).json(result);
    } catch (err: any) {
      console.error('[DashboardController/getAiInsights]', err);
      return res.status(500).json({ error: 'Không thể lấy AI insights.' });
    }
  };

  // ─────────────────────────────────────────────────────────
  // PHASE II CONTROLLERS
  // ─────────────────────────────────────────────────────────

  getComparison = async (req: Request, res: Response) => {
    try {
      const filter = (req.query.filter as string) || '7days';
      const result = await getPeriodComparison(filter);
      return res.status(200).json(result);
    } catch (err: any) {
      console.error('[DashboardController/getComparison]', err);
      return res.status(500).json({ error: 'Không thể lấy dữ liệu so sánh kỳ trước.' });
    }
  };

  getSparkline = async (req: Request, res: Response) => {
    try {
      const type = (req.query.type as 'posts' | 'destinations' | 'users') || 'posts';
      const idsString = (req.query.ids as string) || '';
      const ids = idsString.split(',').map(id => id.trim()).filter(Boolean);
      
      const result = await getSparklineTrends(type, ids);
      return res.status(200).json(result);
    } catch (err: any) {
      console.error('[DashboardController/getSparkline]', err);
      return res.status(500).json({ error: 'Không thể lấy dữ liệu biểu đồ xu hướng mini.' });
    }
  };

  getGis = async (_req: Request, res: Response) => {
    try {
      const result = await getGisHotspots();
      return res.status(200).json(result);
    } catch (err: any) {
      console.error('[DashboardController/getGis]', err);
      return res.status(500).json({ error: 'Không thể lấy dữ liệu bản đồ GIS hotspots.' });
    }
  };

  getTrending = async (req: Request, res: Response) => {
    try {
      const limit = Number(req.query.limit) || 10;
      const result = await getTrendingDestinations(limit);
      return res.status(200).json(result);
    } catch (err: any) {
      console.error('[DashboardController/getTrending]', err);
      return res.status(500).json({ error: 'Không thể lấy danh sách điểm đến thịnh hành.' });
    }
  };

  getPrediction = async (req: Request, res: Response) => {
    try {
      const metric = (req.query.metric as string) || 'checkin';
      if (metric === 'destinations') {
        const result = await getDestinationsPredictions();
        return res.status(200).json(result);
      }
      const result = await getPredictions(metric);
      return res.status(200).json(result);
    } catch (err: any) {
      console.error('[DashboardController/getPrediction]', err);
      return res.status(500).json({ error: 'Không thể lập dự báo xu hướng du lịch.' });
    }
  };

  getBehavior = async (_req: Request, res: Response) => {
    try {
      const result = await getUserBehaviorProfile();
      return res.status(200).json(result);
    } catch (err: any) {
      console.error('[DashboardController/getBehavior]', err);
      return res.status(500).json({ error: 'Không thể phân tích hành vi người dùng.' });
    }
  };

  getFunnel = async (_req: Request, res: Response) => {
    try {
      const result = await getFunnelAnalytics();
      return res.status(200).json(result);
    } catch (err: any) {
      console.error('[DashboardController/getFunnel]', err);
      return res.status(500).json({ error: 'Không thể kết xuất phễu chuyển đổi.' });
    }
  };

  getExport = async (req: Request, res: Response) => {
    try {
      const format = (req.query.format as 'pdf' | 'csv' | 'excel') || 'pdf';
      const result = await generateExportData(format);
      
      res.setHeader('Content-Type', result.contentType);
      
      if (format !== 'pdf') {
        res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      }
      
      return res.status(200).send(result.content);
    } catch (err: any) {
      console.error('[DashboardController/getExport]', err);
      return res.status(500).json({ error: 'Gặp lỗi trong quá trình xuất dữ liệu báo cáo.' });
    }
  };

  getDrilldown = async (req: Request, res: Response) => {
    try {
      const type = (req.query.type as 'province' | 'post' | 'user' | 'destination') || 'user';
      const id = (req.query.id as string) || '';
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;
      const q = (req.query.q as string) || '';

      const result = await getDrilldownData(type, id, page, limit, q);
      return res.status(200).json(result);
    } catch (err: any) {
      console.error('[DashboardController/getDrilldown]', err);
      return res.status(500).json({ error: 'Không thể lấy dữ liệu phân rã chi tiết.' });
    }
  };

  getAiInsights2 = async (req: Request, res: Response) => {
    try {
      const prompt = (req.query.prompt as string) || '';
      const result = await getAiInsights2(prompt);
      return res.status(200).json(result);
    } catch (err: any) {
      console.error('[DashboardController/getAiInsights2]', err);
      return res.status(500).json({ error: 'Không thể lấy AI Insights 2.0.' });
    }
  };
}
