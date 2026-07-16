import { RetrievedDoc } from '../../types/rag.types';
import { Citation } from '../../../ai-agents/types/agent.types';

// ─── Mock Regions ─────────────────────────────────────────
export const MOCK_REGIONS = [
  'Hà Nội', 'Sài Gòn', 'Đà Nẵng', 'Huế', 'Hà Giang',
  'Sapa', 'Đà Lạt', 'Nha Trang', 'Phú Quốc', 'Hạ Long',
  'Vũng Tàu', 'Cần Thơ', 'Hội An', 'Mũi Né', 'Cà Mau',
];

// ─── Mock Retrieved Documents ─────────────────────────────
export function createMockDocs(overrides?: Partial<RetrievedDoc>[]): RetrievedDoc[] {
  const defaults: RetrievedDoc[] = [
    {
      id: 'doc-1',
      title: 'Phở Hà Nội - Tinh hoa ẩm thực Thủ đô',
      content: 'Phở Hà Nội là món ăn đặc trưng của thủ đô Hà Nội. Nước dùng thanh ngọt từ xương bò, bánh phở mềm, thịt bò thái mỏng.',
      category: 'food',
      score: 0.92,
      similarity: 0.92,
      source: 'Nguồn: Ẩm thực',
    },
    {
      id: 'doc-2',
      title: 'Văn Miếu Quốc Tử Giám - Di tích lịch sử Hà Nội',
      content: 'Văn Miếu Quốc Tử Giám là trường đại học đầu tiên của Việt Nam, được xây dựng từ năm 1070 dưới triều Lý.',
      category: 'history',
      score: 0.88,
      similarity: 0.88,
      source: 'Nguồn: Lịch sử',
    },
    {
      id: 'doc-3',
      title: 'Chợ nổi Cái Răng - Nét văn hóa miền Tây',
      content: 'Chợ nổi Cái Răng là chợ nổi đặc trưng của vùng đồng bằng sông Cửu Long, họp từ tờ mờ sáng trên sông.',
      category: 'culture',
      score: 0.85,
      similarity: 0.85,
      source: 'Nguồn: Văn hóa',
    },
    {
      id: 'doc-4',
      title: 'Lễ hội đền Hùng - Quốc giỗ tổ tiên',
      content: 'Lễ hội đền Hùng diễn ra vào ngày 10 tháng 3 âm lịch hàng năm tại tỉnh Phú Thọ, tưởng nhớ các Vua Hùng.',
      category: 'festival',
      score: 0.78,
      similarity: 0.78,
      source: 'Nguồn: Lễ hội',
    },
    {
      id: 'doc-5',
      title: 'Bún bò Huế - Đặc sản cố đô',
      content: 'Bún bò Huế là món ăn đặc sản của thành phố Huế, với nước dùng đậm đà, sợi bún to, thịt bò và chả cua.',
      category: 'food',
      score: 0.95,
      similarity: 0.95,
      source: 'Nguồn: Ẩm thực',
    },
    {
      id: 'doc-6',
      title: 'Đà Lạt - Thành phố ngàn hoa',
      content: 'Đà Lạt nổi tiếng với khí hậu mát mẻ, các vườn hoa, hồ xuân hương và kiến trúc Pháp cổ kính.',
      category: 'destination',
      score: 0.82,
      similarity: 0.82,
      source: 'Nguồn: Địa điểm du lịch',
    },
    {
      id: 'doc-7',
      title: 'Phở bò Hà Nội - Món ngon đường phố',
      content: 'Phở bò là món ăn đường phố nổi tiếng của Hà Nội, được nhiều du khách quốc tế yêu thích.',
      category: 'food',
      score: 0.72,
      similarity: 0.72,
      source: 'Nguồn: Ẩm thực',
    },
    {
      id: 'doc-8',
      title: 'Cà phê sữa đá - Thức uống Việt Nam',
      content: 'Cà phê sữa đá là thức uống phổ biến ở Việt Nam, kết hợp cà phê đen đậm đà với sữa đặc có đường.',
      category: 'food',
      score: 0.55,
      similarity: 0.55,
      source: 'Nguồn: Ẩm thực',
    },
    {
      id: 'doc-9',
      title: 'Hạ Long Bay - Di sản thiên nhiên thế giới',
      content: 'Vịnh Hạ Long là di sản thiên nhiên thế giới với hàng nghìn hòn đảo đá vôi nhấp nhô trên mặt nước xanh.',
      category: 'destination',
      score: 0.68,
      similarity: 0.68,
      source: 'Nguồn: Địa điểm du lịch',
    },
    {
      id: 'doc-10',
      title: 'Món ngon Sài Gòn - Ẩm thực đường phố',
      content: 'Sài Gòn nổi tiếng với ẩm thực đường phố phong phú: cơm tấm, hủ tiếu, bánh mì, bò bía,...',
      category: 'food',
      score: 0.45,
      similarity: 0.45,
      source: 'Nguồn: Ẩm thực',
    },
  ];

  if (!overrides) return defaults;

  return defaults.map((doc, idx) => {
    if (overrides[idx]) {
      return { ...doc, ...overrides[idx] };
    }
    return doc;
  });
}

// ─── Mock Destination Detection Test Cases ───────────────
export interface DestDetectionCase {
  input: string;
  explicit?: string;
  expected: { destination: string | null; methodIncludes?: string };
  description: string;
}

export const DEST_DETECTION_CASES: DestDetectionCase[] = [
  {
    input: 'du lịch Hà Nội',
    expected: { destination: 'Hà Nội' },
    description: 'Exact match via travel pattern',
  },
  {
    input: 'đi Đà Nẵng chơi',
    expected: { destination: 'Đà Nẵng' },
    description: 'Travel verb + destination',
  },
  {
    input: 'Món ăn ngon ở Sài Gòn',
    expected: { destination: 'Sài Gòn' },
    description: 'Direct mention with location preposition',
  },
  {
    input: 'tôi muốn đi phượt Hà Giang',
    expected: { destination: 'Hà Giang' },
    description: 'Phượt + destination',
  },
  {
    input: 'thời tiết hôm nay thế nào',
    expected: { destination: null },
    description: 'No destination mentioned',
  },
  {
    input: 'cho tôi hỏi về đặc sản Huế',
    expected: { destination: 'Huế' },
    description: 'Direct mention Huế',
  },
  {
    input: 'explicit destination test',
    explicit: 'Nha Trang',
    expected: { destination: 'Nha Trang', methodIncludes: 'explicit' },
    description: 'Explicit destination override',
  },
];

// ─── Mock Category Detection Test Cases ──────────────────
export interface CatDetectionCase {
  input: string;
  explicit?: string;
  expected: { category: string | null };
  description: string;
}

export const CAT_DETECTION_CASES: CatDetectionCase[] = [
  {
    input: 'món ăn ngon ở Hà Nội',
    expected: { category: 'food' },
    description: 'Food keywords detected',
  },
  {
    input: 'lịch sử Văn Miếu',
    expected: { category: 'history' },
    description: 'History keywords detected',
  },
  {
    input: 'lễ hội đền Hùng',
    expected: { category: 'festival' },
    description: 'Festival keywords detected',
  },
  {
    input: 'văn hóa con người Việt Nam',
    expected: { category: 'culture' },
    description: 'Culture keywords detected',
  },
  {
    input: 'địa điểm du lịch đẹp',
    expected: { category: 'destination' },
    description: 'Destination keywords detected',
  },
  {
    input: 'xin chào bạn khỏe không',
    expected: { category: null },
    description: 'No matching keywords (generic greeting)',
  },
  {
    input: 'explicit category test',
    explicit: 'food',
    expected: { category: 'food' },
    description: 'Explicit category override',
  },
  {
    input: 'ăn gì ngon ở Đà Nẵng',
    expected: { category: 'food' },
    description: 'Food with priority over destination',
  },
];

// ─── Mock Reranking Test Cases ───────────────────────────
export interface RerankCase {
  docs: RetrievedDoc[];
  destination: string | null;
  scoreThreshold: number;
  expected: {
    finalCount: number;
    filteredCount: number;
  };
  description: string;
}

export const RERANK_CASES: RerankCase[] = [
  {
    docs: createMockDocs(),
    destination: 'Hà Nội',
    scoreThreshold: 0.5,
    expected: { finalCount: 4, filteredCount: 6 },
    description: 'Filter by Hà Nội destination with 0.5 threshold',
  },
  {
    docs: createMockDocs(),
    destination: null,
    scoreThreshold: 0.8,
    expected: { finalCount: 4, filteredCount: 6 },
    description: 'No destination filter, 0.8 threshold',
  },
  {
    docs: createMockDocs(),
    destination: 'Huế',
    scoreThreshold: 0.5,
    expected: { finalCount: 1, filteredCount: 9 },
    description: 'Filter by Huế destination',
  },
  {
    docs: [],
    destination: null,
    scoreThreshold: 0.5,
    expected: { finalCount: 0, filteredCount: 0 },
    description: 'Empty docs array',
  },
];

// ─── Expected Citations for Citation Building Tests ──────
export const EXPECTED_CITATION_SHAPE = {
  id: expect.any(String),
  title: expect.any(String),
  content: expect.any(String),
  category: expect.any(String),
  score: expect.any(Number),
  similarity: expect.any(Number),
  index: expect.any(Number),
  source: expect.any(String),
};

// ─── Evaluation Query Set ────────────────────────────────
export interface EvalQuery {
  query: string;
  expectedDocIds: string[];
  category?: string;
}

export const EVAL_QUERIES: EvalQuery[] = [
  {
    query: 'Phở Hà Nội ăn ở đâu ngon',
    expectedDocIds: ['doc-1', 'doc-7'],
    category: 'food',
  },
  {
    query: 'Lễ hội đền Hùng diễn ra khi nào',
    expectedDocIds: ['doc-4'],
    category: 'festival',
  },
  {
    query: 'Văn Miếu Quốc Tử Giám ở đâu',
    expectedDocIds: ['doc-2'],
    category: 'history',
  },
  {
    query: 'Chợ nổi Cái Răng họp lúc mấy giờ',
    expectedDocIds: ['doc-3'],
    category: 'culture',
  },
  {
    query: 'Bún bò Huế khác gì phở Hà Nội',
    expectedDocIds: ['doc-5', 'doc-1'],
    category: 'food',
  },
];

