import type { FeedPost, CompanionSuggestion } from '../utils/feedUtils';
import { normalizeDestinationKey, classifyPostDisplay, getCategoryColor } from '../utils/feedUtils';

const LONG_JOURNEY_BODY = `Ngày 1 — Di chuyển từ Hà Nội, chúng tôi có mặt ở thị trấn Đồng Văn lúc chiều muộn. Sương mù phủ kín các sườn núi đá vôi, không khí trong lành đến lạ. Homestay nhỏ của gia đình người H'Mông rất ấm cúng, bữa tối đơn giản nhưng đậm đà.

Ngày 2 — Cung đường Mã Pí Lèng và đèo Mã Pí Lèng được mệnh danh là một trong tứ đại đỉnh đèo của Tây Bắc. Từng cua ôm sườn núi, bên dưới là thung lũng sâu thẳm. Chúng tôi dừng chân nhiều lần chỉ để thở và chụp ảnh — không gian quá rộng để gói vào khung hình.

Ngày 3 — Làng văn hóa Lô Lô Chải, gặp gỡ người dân địa phương, thử rượu ngô và thêu thổ cẩm. Buổi tối trời se lạnh, ngồi quanh bếp lửa nghe kể chuyện về mùa lúa chín.

Ngày 4 — Hồ Thăng Hen, cánh đồng hoa cải vàng rực (đúng mùa). Trở về Hà Giang với vali đầy ảnh và vài kg thổ cẩm mua ủng hộ làng nghề.`;

const LONG_FOOD_BODY = `Hà Nội không chỉ có phở. Buổi sáng bắt đầu ở góc phố Lý Quốc Sư với bánh cuốn nóng hổi, nước mắm pha chanh ớt đúng bài. Trưa là bún chả Hương Liên — quán từng đón cựu Tổng thống Mỹ — vẫn đông khách vì chất lượng ổn định.

Chiều lang thang Phố cổ: bánh mì chảo, nộm bò khô, và ly cà phê trứng ở Giảng. Tối thử bánh tôm Hồ Tây bên hồ, gió hồ lùa vào mặt, vừa ăn vừa nghe xe máy rền rĩ — đúng nhịp sống thủ đô.

Mẹo: đi nhóm 3–4 người, gọi mỗi quán một món signature, chia sẻ để thử được nhiều hơn. Mang tiền mặt, nhiều quán nhỏ chưa nhận chuyển khoản.`;

const now = new Date();
const daysAgo = (d: number) => {
  const x = new Date(now);
  x.setDate(x.getDate() - d);
  return x;
};

const rawPosts = [
  {
    id: 'h1',
    isFeatured: true,
    category: "Editor's Pick",
    destination: 'Hà Giang, Việt Nam',
    headline: 'Con đường đèo đẹp nhất thế giới: Hành trình Hà Giang Loop 4 ngày khó quên',
    excerpt: 'Lách qua những đỉnh karst, làng dân tộc thiểu số và ruộng lúa bậc thang — Hà Giang Loop là bí mật đẹp nhất Việt Nam đang dần lộ diện.',
    image: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=1400&q=80',
    author: { name: 'Minh Quân Nguyễn', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80', verified: true, followers: 8420 },
    postedAt: daysAgo(0),
    date: '2 giờ trước',
    readTime: '8 phút đọc',
    likes: 342,
    comments: 67,
    bookmarks: 128,
    body: LONG_JOURNEY_BODY,
  },
  {
    id: 'p1',
    category: 'Phiêu Lưu',
    destination: 'Sapa, Lào Cai',
    headline: 'Chinh phục Fansipan: Bình minh sẽ thay đổi cuộc đời bạn',
    excerpt: 'Ở độ cao 3.143m, Fansipan là "Nóc nhà Đông Dương" — cảnh bình minh từ đỉnh núi xứng đáng từng bước trong chuyến leo 2 ngày.',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80',
    author: { name: 'Sarah Miller', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80', verified: false, followers: 3200 },
    postedAt: daysAgo(1),
    date: '5 giờ trước',
    readTime: '5 phút',
    likes: 189,
    comments: 34,
    bookmarks: 67,
  },
  {
    id: 'p2',
    destination: 'Phố cổ Hội An → An Bàng → Cẩm Thanh',
    content: 'Vừa đến Hội An và tôi đã mê hoàn toàn! Những chiếc đèn lồng về đêm thật kỳ diệu! Mẹo nhỏ: thuê xe đạp (100k/ngày) và khám phá cánh đồng lúa lúc bình minh — không một bóng người.',
    images: [
      'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1540202403-b7abd6747a18?auto=format&fit=crop&w=600&q=80',
    ],
    routePoints: [
      { name: 'Phố cổ Hội An', address: 'Phố cổ Hội An, Minh An, Hội An, Quảng Nam, Việt Nam', lat: 15.8801, lng: 108.338 },
      { name: 'Bãi biển An Bàng', address: 'An Bàng, Cẩm An, Hội An, Quảng Nam, Việt Nam', lat: 15.916, lng: 108.365 },
      { name: 'Làng rau Trà Quế', address: 'Trà Quế, Cẩm Hà, Hội An, Quảng Nam, Việt Nam', lat: 15.895, lng: 108.352 },
    ],
    author: { name: 'Linh Trần', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=80&q=80', verified: true, followers: 15600 },
    postedAt: daysAgo(2),
    date: '1 ngày trước',
    likes: 412,
    comments: 89,
    bookmarks: 201,
  },
  {
    id: 'p3',
    category: 'Ẩm Thực',
    destination: 'Hà Nội, Việt Nam',
    headline: '12 món ăn đường phố Hà Nội sẽ thay đổi cuộc đời bạn mãi mãi',
    excerpt: 'Từ Bún Chả Obama đến Bánh Mì Trứng bí ẩn — hướng dẫn toàn diện ăn uống xuyên thủ đô trong 24 giờ.',
    image: 'https://images.unsplash.com/photo-1557750255-c76072a7aad1?auto=format&fit=crop&w=800&q=80',
    author: { name: 'Alex Chen', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=80&q=80', verified: true, followers: 9800 },
    postedAt: daysAgo(3),
    date: '2 ngày trước',
    readTime: '6 phút',
    likes: 892,
    comments: 156,
    bookmarks: 445,
    body: LONG_FOOD_BODY,
  },
  {
    id: 'p4',
    destination: 'Đảo Phú Quốc',
    content: 'Bình minh Phú Quốc — đi bộ dọc bãi biển lúc 5h sáng và có cả dải cát chỉ một mình. Nước trong vắt, ấm 28°C đầu tháng 6.',
    images: ['https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80'],
    author: { name: 'Tom Vũ', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=80&q=80', verified: false, followers: 2100 },
    postedAt: daysAgo(4),
    date: '3 ngày trước',
    likes: 267,
    comments: 43,
    bookmarks: 88,
  },
  {
    id: 'p5',
    category: 'Phiêu Lưu',
    destination: 'Sapa, Lào Cai',
    headline: 'Trek Sapa mùa lúa chín — lịch trình 2 ngày cho người mới',
    excerpt: 'Gợi ý homestay, đường đi và thời điểm săn mây tốt nhất trên thung lũng Mường Hoa.',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80',
    author: { name: 'David Kim', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&q=80', verified: false, followers: 8900 },
    postedAt: daysAgo(5),
    date: '5 ngày trước',
    readTime: '4 phút',
    likes: 156,
    comments: 28,
    bookmarks: 41,
  },
  {
    id: 'p6',
    destination: 'Hội An, Quảng Nam',
    content: 'Check-in Hội An buổi tối — phố cổ lung linh đèn lồng. Ai muốn đi cùng tuần sau không?',
    images: [
      'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1540202403-b7abd6747a18?auto=format&fit=crop&w=600&q=80',
    ],
    author: { name: 'Nguyễn Hương', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=80&q=80', verified: true, followers: 12400 },
    postedAt: daysAgo(6),
    date: '6 ngày trước',
    likes: 198,
    comments: 45,
    bookmarks: 62,
  },
  {
    id: 'p7',
    category: 'Ẩm Thực',
    destination: 'Hà Nội, Việt Nam',
    headline: 'Phở bò Nam Định vs phở Hà Nội — so sánh chi tiết cho foodie',
    excerpt: 'Hai phong cách, hai trải nghiệm hoàn toàn khác nhau trong cùng một thành phố.',
    image: 'https://images.unsplash.com/photo-1557750255-c76072a7aad1?auto=format&fit=crop&w=800&q=80',
    author: { name: 'Anh Thư', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=80&q=80', verified: true, followers: 21100 },
    postedAt: daysAgo(8),
    date: '1 tuần trước',
    readTime: '7 phút',
    likes: 445,
    comments: 92,
    bookmarks: 178,
    body: `So sánh chi tiết từng quán phở truyền thống: nước dùng, thịt bò, bánh phở và rau thơm. Phở Nam Định thường ngọt thanh, ít gia vị; phở Hà Nội đậm hơn, nhiều hành và gừng. Tôi đã thử 8 quán trong 3 ngày — bảng điểm đầy đủ trong bài.\n\n${LONG_FOOD_BODY.slice(0, 400)}…`,
  },
  // Bài tháng trước — không tính vào hot tháng này
  {
    id: 'old1',
    category: 'Văn Hóa',
    destination: 'Kyoto, Nhật Bản',
    headline: 'Kyoto mùa lá đỏ — hướng dẫn 3 ngày',
    excerpt: 'Fushimi Inari, Gion và Arashiyama trong một lịch trình gọn.',
    image: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=800&q=80',
    author: { name: 'Sarah Miller', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80', verified: false, followers: 3200 },
    postedAt: daysAgo(35),
    date: '1 tháng trước',
    readTime: '9 phút',
    likes: 520,
    comments: 88,
    bookmarks: 210,
  },
];

function buildFeedPost(raw: (typeof rawPosts)[0]): FeedPost {
  const destinationKey = normalizeDestinationKey(raw.destination);
  const base = {
    id: raw.id,
    destination: raw.destination.startsWith('📍') ? raw.destination : `📍 ${raw.destination}`,
    destinationKey,
    postedAt: raw.postedAt,
    author: raw.author,
    date: raw.date,
    likes: raw.likes,
    comments: raw.comments,
    bookmarks: raw.bookmarks,
    isFeatured: raw.isFeatured,
    body: 'body' in raw && raw.body ? raw.body : undefined,
    routePoints: 'routePoints' in raw && raw.routePoints ? raw.routePoints : undefined,
  };

  const displayType = classifyPostDisplay({
    isFeatured: raw.isFeatured,
    headline: 'headline' in raw ? raw.headline : undefined,
    excerpt: 'excerpt' in raw ? raw.excerpt : undefined,
    content: 'content' in raw ? raw.content : undefined,
    image: 'image' in raw ? raw.image : undefined,
    images: 'images' in raw ? raw.images : undefined,
    readTime: 'readTime' in raw ? raw.readTime : undefined,
    likes: raw.likes,
  });

  if (displayType === 'hero' || displayType === 'magazine') {
    const cat = 'category' in raw ? raw.category! : 'Du lịch';
    return {
      ...base,
      displayType: displayType === 'hero' ? 'hero' : 'magazine',
      category: displayType === 'hero' && !('category' in raw) ? "Editor's Pick" : cat,
      categoryColor: getCategoryColor(cat),
      headline: raw.headline!,
      excerpt: raw.excerpt!,
      image: raw.image!,
      readTime: raw.readTime ?? '5 phút',
    } as FeedPost;
  }

  return {
    ...base,
    displayType: 'social',
    content: raw.content!,
    images: raw.images,
  } as FeedPost;
}

export const FEED_POSTS: FeedPost[] = rawPosts.map(buildFeedPost);

export const COMPANION_CANDIDATES: CompanionSuggestion[] = [
  { id: 'c1', name: 'Anh Thư', handle: '@anhthu.wanders', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=80&q=80', followers: 21100, followersLabel: '', tag: 'Sang trọng', tagColor: 'badge-gold' },
  { id: 'c2', name: 'Linh Trần', handle: '@linhtran', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=80&q=80', followers: 15600, followersLabel: '', tag: 'Văn hóa', tagColor: 'badge-violet' },
  { id: 'c3', name: 'Minh Quân Nguyễn', handle: '@minhquan', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80', followers: 8420, followersLabel: '', tag: 'Phiêu lưu', tagColor: 'badge-teal' },
  { id: 'c4', name: 'Nguyễn Hương', handle: '@huongtravels', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=80&q=80', followers: 12400, followersLabel: '', tag: 'Ẩm thực', tagColor: 'badge-indigo' },
  { id: 'c5', name: 'Alex Chen', handle: '@alexchen', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=80&q=80', followers: 9800, followersLabel: '', tag: 'Ẩm thực', tagColor: 'badge-teal' },
  { id: 'c6', name: 'David Kim', handle: '@davidexplores', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&q=80', followers: 8900, followersLabel: '', tag: 'Phiêu lưu', tagColor: 'badge-violet' },
  { id: 'c7', name: 'Sarah Miller', handle: '@sarahm', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80', followers: 3200, followersLabel: '', tag: 'Magazine', tagColor: 'badge-rose' },
];

export const MOCK_STORIES = [
  { id: '1', user: 'Minh Quân', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80', location: 'Hà Giang', image: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=300&q=80' },
  { id: '2', user: 'Sarah Lee', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80', location: 'Hội An', image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=300&q=80' },
  { id: '3', user: 'Linh Trần', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=80&q=80', location: 'Hội An', image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=300&q=80' },
  { id: '4', user: 'Alex Chen', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=80&q=80', location: 'Hà Nội', image: 'https://images.unsplash.com/photo-1557750255-c76072a7aad1?auto=format&fit=crop&w=300&q=80' },
];
