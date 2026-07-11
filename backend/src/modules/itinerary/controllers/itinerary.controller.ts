import { Response } from 'express';
import { AuthRequest } from '../../auth/auth.middleware';
import { ItineraryService } from '../services/itinerary.service';

export class ItineraryController {
  private service: ItineraryService;

  constructor() {
    this.service = new ItineraryService();
  }

  // ─── Itinerary ──────────────────────────────────────────────
  createItinerary = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.sub;
      const data = req.body;
      const itinerary = await this.service.createItinerary(userId, data);
      return res.status(201).json(itinerary);
    } catch (err: any) {
      console.error('[itinerary/createItinerary]', err);
      return res.status(500).json({ error: err.message || 'Không thể tạo lịch trình.' });
    }
  };

  getItineraries = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.sub;
      const list = await this.service.getAllItineraries(userId);
      return res.json(list);
    } catch (err: any) {
      console.error('[itinerary/getItineraries]', err);
      return res.status(500).json({ error: 'Không thể tải danh sách lịch trình.' });
    }
  };

  getItinerary = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.sub;
      const itineraryId = req.params.id;
      const details = await this.service.getItineraryDetails(itineraryId, userId);
      return res.json(details);
    } catch (err: any) {
      console.error('[itinerary/getItinerary]', err);
      return res.status(404).json({ error: err.message || 'Không tìm thấy lịch trình.' });
    }
  };

  // ─── Day ────────────────────────────────────────────────────
  addDay = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.sub;
      const itineraryId = req.params.id;
      const { dayIndex, date } = req.body;
      const newDay = await this.service.addDayToItinerary(itineraryId, userId, dayIndex, date);
      return res.status(201).json(newDay);
    } catch (err: any) {
      console.error('[itinerary/addDay]', err);
      return res.status(400).json({ error: err.message || 'Không thể thêm ngày vào lịch trình.' });
    }
  };

  // ─── Activity ───────────────────────────────────────────────
  addActivity = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.sub;
      const dayId = req.params.dayId;
      const data = req.body;
      const activity = await this.service.addActivityToDay(dayId, userId, data);
      return res.status(201).json(activity);
    } catch (err: any) {
      console.error('[itinerary/addActivity]', err);
      return res.status(400).json({ error: err.message || 'Không thể thêm hoạt động vào ngày.' });
    }
  };

  updateActivity = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.sub;
      const activityId = req.params.activityId;
      const data = req.body;
      const updated = await this.service.updateActivity(activityId, userId, data);
      return res.json(updated);
    } catch (err: any) {
      console.error('[itinerary/updateActivity]', err);
      return res.status(400).json({ error: err.message || 'Không thể cập nhật hoạt động.' });
    }
  };

  deleteActivity = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.sub;
      const activityId = req.params.activityId;
      const result = await this.service.deleteActivity(activityId, userId);
      return res.json(result);
    } catch (err: any) {
      console.error('[itinerary/deleteActivity]', err);
      return res.status(400).json({ error: err.message || 'Không thể xóa hoạt động.' });
    }
  };
}
