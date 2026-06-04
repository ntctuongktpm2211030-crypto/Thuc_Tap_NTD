/** Dữ liệu blog Khám phá + metadata cho bộ lọc */

export interface ExplorePost {
  id: string;
  author: string;
  handle: string;
  avatar: string;
  verified: boolean;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  tags: string[];
  category: string;
  location: string;
  province: string;
  region: 'Bắc' | 'Trung' | 'Nam';
  lat: number;
  lng: number;
  destinations: string[];
  dishes: string[];
  cultureThemes: string[];
  date: string;
  readTime: number;
  likes: number;
  comments: { id: string; author: string; avatar: string; text: string; date: string }[];
  bookmarked: boolean;
  liked: boolean;
}

export const EXPLORE_DESTINATIONS = [
  'Hà Nội', 'Sapa', 'Hạ Long', 'Ninh Bình', 'Huế', 'Đà Nẵng', 'Hội An',
  'Quy Nhơn', 'Nha Trang', 'Đà Lạt', 'Phú Quốc', 'Hà Giang', 'Cần Thơ', 'Sa Pa',
];

export const EXPLORE_DISHES = [
  'Phở', 'Bún chả', 'Bánh mì', 'Cơm tấm', 'Bánh xèo', 'Gỏi cuốn',
  'Bún bò Huế', 'Cao lầu', 'Mì Quảng', 'Chả cá', 'Bánh cuốn', 'Nem rán',
  'Bánh flan', 'Cà phê trứng', 'Lẩu', 'Hải sản',
];

export const EXPLORE_CULTURE = [
  'Lễ hội', 'Di sản UNESCO', 'Làng nghề', 'Chùa chiền', 'Phố cổ',
  'Dân tộc thiểu số', 'Nhạc cụ truyền thống', 'Áo dài', 'Lễ hội đèn lồng',
  'Kiến trúc Pháp', 'Văn hóa cà phê',
];

export const EXPLORE_REGIONS = ['Tất cả miền', 'Bắc', 'Trung', 'Nam'] as const;

export const EXPLORE_CATEGORIES = [
  'Tất cả', 'Thiên nhiên', 'Ẩm thực', 'Phiêu lưu', 'Văn hóa', 'Sang trọng', 'Biển đảo', 'Nghỉ dưỡng',
];

export const EXPLORE_SORT_OPTIONS = [
  { id: 'newest', label: 'Mới nhất' },
  { id: 'popular', label: 'Nhiều tim nhất' },
  { id: 'nearest', label: 'Gần bạn nhất' },
  { id: 'short', label: 'Đọc nhanh (<5 phút)' },
] as const;

export type ExploreSortId = (typeof EXPLORE_SORT_OPTIONS)[number]['id'];

export const INITIAL_EXPLORE_POSTS: ExplorePost[] = [
  {
    id: 'p1',
    author: 'Minh Quân',
    handle: '@minhquan_wanders',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80',
    verified: true,
    title: 'Bí ẩn của thung lũng Mường Hoa mùa lúa chín',
    excerpt: 'Vào tháng 9, toàn bộ thung lũng chuyển sang màu vàng óng — khung cảnh nhiếp ảnh gia không thể bỏ qua.',
    content: 'Vào tháng 9, toàn bộ thung lũng chuyển sang màu vàng óng...',
    coverImage: 'https://images.unsplash.com/photo-1508873696983-2df519f0397e?auto=format&fit=crop&w=900&q=80',
    tags: ['sapa', 'thiên nhiên', 'nhiếp ảnh'],
    category: 'Thiên nhiên',
    location: 'Thung lũng Mường Hoa, Sapa',
    province: 'Lào Cai',
    region: 'Bắc',
    lat: 22.3364,
    lng: 103.8438,
    destinations: ['Sapa', 'Fansipan'],
    dishes: ['Thắng cố', 'Cơm lam'],
    cultureThemes: ['Dân tộc thiểu số', 'Lễ hội'],
    date: '01/06/2026',
    readTime: 6,
    likes: 421,
    comments: [
      { id: 'c1', author: 'Hà Linh', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=80&q=80', text: 'Ảnh đẹp quá!', date: '2 giờ trước' },
    ],
    bookmarked: false,
    liked: false,
  },
  {
    id: 'p2',
    author: 'Jessica Taylor',
    handle: '@jessica_travels',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80',
    verified: true,
    title: 'Hành trình ẩm thực Hà Nội: Ăn no bụng với $15/ngày',
    excerpt: 'Bún chả Hương Liên, bánh mì Phượng, kem tràng tiền — ví tiền vẫn còn nguyên.',
    content: 'Bún chả Hương Liên, bánh mì Phượng, kem tràng tiền...',
    coverImage: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80',
    tags: ['ẩm thực', 'hanoi', 'street food'],
    category: 'Ẩm thực',
    location: 'Phố Cổ Hà Nội',
    province: 'Hà Nội',
    region: 'Bắc',
    lat: 21.0285,
    lng: 105.8542,
    destinations: ['Hà Nội', 'Hồ Gươm'],
    dishes: ['Phở', 'Bún chả', 'Bánh mì', 'Cà phê trứng', 'Bánh cuốn'],
    cultureThemes: ['Phố cổ', 'Văn hóa cà phê', 'Kiến trúc Pháp'],
    date: '30/05/2026',
    readTime: 4,
    likes: 1128,
    comments: [{ id: 'c3', author: 'Tuấn Anh', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=80&q=80', text: 'Nhớ chả cá Lã Vọng!', date: '1 ngày trước' }],
    bookmarked: true,
    liked: true,
  },
  {
    id: 'p3',
    author: 'Hoàng Lê',
    handle: '@hoangle_adventures',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80',
    verified: false,
    title: 'Chinh phục cung đường Hà Giang Loop trong 4 ngày',
    excerpt: 'Đèo Mã Pí Lèng — một bên vách núi, một bên vực thẳm hàng trăm mét.',
    content: 'Con đường chạy qua đèo Mã Pí Lèng...',
    coverImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=80',
    tags: ['hagiang', 'motorbiking'],
    category: 'Phiêu lưu',
    location: 'Đèo Mã Pí Lèng, Hà Giang',
    province: 'Hà Giang',
    region: 'Bắc',
    lat: 23.253,
    lng: 105.225,
    destinations: ['Hà Giang', 'Đồng Văn'],
    dishes: ['Thắng cố'],
    cultureThemes: ['Dân tộc thiểu số', 'Làng nghề'],
    date: '28/05/2026',
    readTime: 8,
    likes: 763,
    comments: [],
    bookmarked: false,
    liked: false,
  },
  {
    id: 'p4',
    author: 'Lan Phạm',
    handle: '@lanpham_foodie',
    avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=80&q=80',
    verified: true,
    title: '48 giờ ở Hội An: Đèn lồng, mì Quảng và phố cổ',
    excerpt: 'Đi bộ phố cổ lúc bình minh, thử 12 món địa phương trong hai ngày.',
    content: 'Hội An về đêm là thiên đường đèn lồng...',
    coverImage: 'https://images.unsplash.com/photo-1559592413-7cec4e887e56?auto=format&fit=crop&w=900&q=80',
    tags: ['hoian', 'ẩm thực', 'văn hóa'],
    category: 'Văn hóa',
    location: 'Phố cổ Hội An',
    province: 'Quảng Nam',
    region: 'Trung',
    lat: 15.8801,
    lng: 108.338,
    destinations: ['Hội An', 'An Bàng'],
    dishes: ['Mì Quảng', 'Cao lầu', 'Bánh xèo', 'Bánh mì'],
    cultureThemes: ['Lễ hội đèn lồng', 'Phố cổ', 'Di sản UNESCO'],
    date: '25/05/2026',
    readTime: 5,
    likes: 892,
    comments: [],
    bookmarked: false,
    liked: false,
  },
  {
    id: 'p5',
    author: 'David Kim',
    handle: '@davidexplores',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&q=80',
    verified: false,
    title: 'Huế — Cố đô, sông Hương và bún bò đúng vị',
    excerpt: 'Dạo kinh thành, thưởng thức ẩm thực cung đình và nghe ca Huế trên sông.',
    content: 'Huế mang vẻ đẹp trầm lắng...',
    coverImage: 'https://images.unsplash.com/photo-1583417319070-4a2ad72e1da0?auto=format&fit=crop&w=900&q=80',
    tags: ['hue', 'văn hóa', 'ẩm thực'],
    category: 'Văn hóa',
    location: 'Kinh thành Huế',
    province: 'Thừa Thiên Huế',
    region: 'Trung',
    lat: 16.4637,
    lng: 107.5909,
    destinations: ['Huế', 'Đà Nẵng'],
    dishes: ['Bún bò Huế', 'Bánh bèo', 'Nem lụi'],
    cultureThemes: ['Di sản UNESCO', 'Chùa chiền', 'Nhạc cụ truyền thống'],
    date: '22/05/2026',
    readTime: 7,
    likes: 534,
    comments: [],
    bookmarked: false,
    liked: false,
  },
  {
    id: 'p6',
    author: 'Mai Trần',
    handle: '@maitran_beach',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=80&q=80',
    verified: true,
    title: 'Phú Quốc: Biển trong veo và hải sản tươi sống',
    excerpt: 'Resort view biển, snorkeling và chợ đêm Dương Đông.',
    content: 'Phú Quốc là điểm đến biển đảo hàng đầu miền Nam...',
    coverImage: 'https://images.unsplash.com/photo-1559127294-7c1e1b83b854?auto=format&fit=crop&w=900&q=80',
    tags: ['phuquoc', 'biển', 'resort'],
    category: 'Biển đảo',
    location: 'Bãi Sao, Phú Quốc',
    province: 'Kiên Giang',
    region: 'Nam',
    lat: 10.227,
    lng: 103.967,
    destinations: ['Phú Quốc'],
    dishes: ['Hải sản', 'Gỏi cuốn'],
    cultureThemes: ['Làng nghề'],
    date: '20/05/2026',
    readTime: 4,
    likes: 1203,
    comments: [],
    bookmarked: true,
    liked: false,
  },
  {
    id: 'p7',
    author: 'Anh Tuấn',
    handle: '@anhtuan_dalat',
    avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=80&q=80',
    verified: false,
    title: 'Đà Lạt mùa hoa dã quỳ: Nghỉ dưỡng và cafe view đồi',
    excerpt: 'Thác Datanla, chợ đêm và những quán cà phê view thung lũng.',
    content: 'Đà Lạt mùa thu se lạnh là thời điểm lý tưởng...',
    coverImage: 'https://images.unsplash.com/photo-1588668210247-408dc95c4212?auto=format&fit=crop&w=900&q=80',
    tags: ['dalat', 'nghỉ dưỡng'],
    category: 'Nghỉ dưỡng',
    location: 'Đà Lạt, Lâm Đồng',
    province: 'Lâm Đồng',
    region: 'Nam',
    lat: 11.9404,
    lng: 108.4583,
    destinations: ['Đà Lạt'],
    dishes: ['Bánh mì', 'Lẩu'],
    cultureThemes: ['Văn hóa cà phê', 'Kiến trúc Pháp'],
    date: '18/05/2026',
    readTime: 3,
    likes: 678,
    comments: [],
    bookmarked: false,
    liked: false,
  },
];

/** Khoảng cách km (Haversine) */
export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
