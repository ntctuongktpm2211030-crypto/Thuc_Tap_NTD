import { describe, it, expect } from 'vitest';
import { TravelRerankerService } from '../travel-reranker.service';
import { RetrievedDoc } from '../../rag/types/rag.types';

function makeDoc(id: string, title: string, content: string, score: number): RetrievedDoc {
  return { id, title, content, category: 'destination', score, similarity: score };
}

describe('TravelRerankerService', () => {
  const reranker = new TravelRerankerService();

  describe('rerank', () => {
    it('should return empty result for empty docs', () => {
      const result = reranker.rerank([], 'sightseeing');
      expect(result.docs).toHaveLength(0);
      expect(result.metadata.originalCount).toBe(0);
    });

    it('should skip reranking for general/undefined intent', () => {
      const docs = [makeDoc('1', 'Hồ Hoàn Kiếm', 'Hồ nước đẹp giữa lòng Hà Nội', 0.9)];
      const result = reranker.rerank(docs, undefined);
      expect(result.docs).toHaveLength(1);
      expect(result.metadata.boostApplied).toBe(0);
    });

    it('should skip reranking for general intent', () => {
      const docs = [makeDoc('1', 'Hồ Hoàn Kiếm', 'Hồ nước đẹp', 0.9)];
      const result = reranker.rerank(docs, 'general');
      expect(result.docs).toHaveLength(1);
      expect(result.metadata.boostApplied).toBe(0);
    });

    it('should boost check-in intent docs containing viewpoint keywords', () => {
      const docs = [
        makeDoc('1', 'Đồi chè Cầu Đất', 'Đồi chè xanh ngát, viewpoint đẹp', 0.7),
        makeDoc('2', 'Bảo tàng Chăm', 'Bảo tàng trưng bày hiện vật', 0.8),
      ];
      const result = reranker.rerank(docs, 'check-in');
      expect(result.docs).toHaveLength(2);
      expect(result.metadata.boostApplied).toBeGreaterThan(0);
    });

    it('should boost trekking intent docs with relevant keywords', () => {
      const docs = [
        makeDoc('1', 'Thác Bản Giốc', 'Thác nước kỳ vĩ, trekking hấp dẫn', 0.7),
        makeDoc('2', 'Nhà hàng Hải Sản', 'Hải sản tươi sống', 0.85),
      ];
      const result = reranker.rerank(docs, 'trekking');
      expect(result.metadata.boostApplied).toBeGreaterThan(0);
      expect(result.metadata.intent).toBe('trekking');
    });

    it('should demote docs with irrelevant keywords for relax intent', () => {
      const docs = [
        makeDoc('1', 'Resort biển', 'Khu nghỉ dưỡng cao cấp ven biển', 0.7),
        makeDoc('2', 'Cung đường trekking', 'Leo núi mạo hiểm', 0.7),
      ];
      const result = reranker.rerank(docs, 'relax');
      expect(result.metadata.demoteApplied).toBeGreaterThan(0);
      expect(result.metadata.intent).toBe('relax');
    });

    it('should boost food intent docs with food keywords', () => {
      const docs = [
        makeDoc('1', 'Chợ Đêm', 'Chợ đêm với nhiều quán ăn ngon', 0.6),
        makeDoc('2', 'Bảo tàng Lịch sử', 'Trưng bày hiện vật cổ', 0.9),
      ];
      const result = reranker.rerank(docs, 'food');
      expect(result.metadata.boostApplied).toBeGreaterThan(0);
    });

    it('should maintain same doc count after reranking', () => {
      const docs = [
        makeDoc('1', 'Hồ Hoàn Kiếm', 'Hồ nước đẹp', 0.9),
        makeDoc('2', 'Văn Miếu', 'Di tích lịch sử', 0.8),
      ];
      const result = reranker.rerank(docs, 'history');
      expect(result.docs).toHaveLength(2);
      expect(result.metadata.finalCount).toBe(2);
    });

    it('should boost culture intent with culture keywords', () => {
      const docs = [
        makeDoc('1', 'Làng nghề gốm', 'Làng nghề truyền thống với nghệ thuật gốm sứ', 0.7),
        makeDoc('2', 'Nhà hàng Hải Sản', 'Hải sản tươi sống', 0.85),
      ];
      const result = reranker.rerank(docs, 'culture');
      expect(result.metadata.boostApplied).toBeGreaterThan(0);
    });

    it('should return result with all metadata fields', () => {
      const docs = [makeDoc('1', 'Địa điểm', 'Nội dung', 0.9)];
      const result = reranker.rerank(docs, 'sightseeing');
      expect(result.metadata).toHaveProperty('originalCount');
      expect(result.metadata).toHaveProperty('finalCount');
      expect(result.metadata).toHaveProperty('boostApplied');
      expect(result.metadata).toHaveProperty('demoteApplied');
      expect(result.metadata).toHaveProperty('intent');
    });
  });
});
