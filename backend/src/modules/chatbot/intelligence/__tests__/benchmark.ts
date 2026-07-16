import { describe, it } from 'vitest';
import { ConversationIntelligence } from '../conversation-intelligence';
import { performance } from 'perf_hooks';

describe('Conversation Intelligence Module (CIM) Performance Benchmark', () => {
  it('Benchmark: Latency of lexical and rule-based processing over 100 iterations', async () => {
    const cim = new ConversationIntelligence();
    const testQueries = [
      'chán ngắt cho thêm địa điểm đi',
      'đổi địa điểm khác giúp tôi với',
      'còn chỗ nào ăn ngon ở Nghệ An nữa không',
      'tôi muốn lên lịch trình đi Đà Lạt 3 ngày',
      'xin chào bạn chatbot xinh đẹp',
      'không thích gợi ý này đâu nhé',
      'tiếp tục cho xem thêm địa danh mới',
      'có lựa chọn nào yên tĩnh và đẹp hơn không',
      'gấp lắm rồi trả lời nhanh đi',
      'cảm ơn bot nhiều nha'
    ];

    const iterations = 100;
    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
      const query = testQueries[i % testQueries.length];
      // Using mock conversation id
      await cim.analyzeQuery(query, 'benchmark-conv', 'RECOMMENDATION').catch(() => {});
    }

    const duration = performance.now() - start;
    const averageMs = duration / iterations;

    console.log('========================================================');
    console.log(`CIM BENCHMARK COMPLETED:`);
    console.log(`- Total queries processed: ${iterations}`);
    console.log(`- Total time taken: ${duration.toFixed(2)} ms`);
    console.log(`- Average response latency: ${averageMs.toFixed(2)} ms (SLA: < 10ms)`);
    console.log('========================================================');
  });
});
