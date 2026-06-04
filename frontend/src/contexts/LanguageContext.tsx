import { createContext, useContext, useState } from 'react';

export type Lang = 'en' | 'vi';

// ──────────────────────────────────────────────────────────
// TRANSLATION DICTIONARY
// ──────────────────────────────────────────────────────────
const translations = {
  en: {
    // Navigation
    'nav.feed':       'Feed',
    'nav.explore':    'Explore',
    'nav.map':        'Map',
    'nav.aiPlanner':  'AI Planner',
    'nav.analytics':  'Analytics',
    'nav.cultureGuide': 'Culture & Food Guide',
    'nav.signIn':     'Sign In',
    'nav.joinFree':   'Join Free',
    'nav.signOut':    'Sign Out',

    'userMenu.profile':       'My Profile',
    'userMenu.following':     'Following List',
    'userMenu.saved':         'Saved',
    'userMenu.shareJourney':  'Share Journey',
    'userMenu.settings':      'Settings',

    'profile.tab.posts':  'Posts',
    'profile.tab.about':  'About',
    'profile.tab.photos': 'Photos',
    'profile.tab.trips':  'Trips',

    'nav.search':     'Search destinations, stories, travellers…',

    // Feed page
    'feed.addStory':      'Add Story',
    'story.title':        'Create Story',
    'story.close':        'Close',
    'story.cancel':       'Cancel',
    'story.next':         'Next',
    'story.photosHint':   'Pick one or more photos (up to 6).',
    'story.pickPhotos':   'Choose photos',
    'story.pickPhotosSub':'Single or multiple — then pick a layout',
    'story.addMore':      'Add',
    'story.needPhoto':    'Please add at least one photo.',
    'story.layoutHint':   'Choose a frame for your photos',
    'story.layoutFallback': 'Add more photos for more layouts.',
    'story.nextEdit':     'Add text & publish',
    'story.addText':      'Text',
    'story.locationPlaceholder': 'Location (optional)',
    'story.locationLabel': 'Location on story',
    'story.publish':      'Share story',
    'story.publishing':   'Sharing…',
    'feed.composePlaceholder': 'Share your travel story, tip, or check-in…',
    'feed.compose.photo':     'Photo',
    'feed.compose.location':  'Location',
    'feed.compose.trip':      'Trip',
    'feed.compose.cancel':    'Cancel',
    'feed.compose.publish':   'Publish',
    'feed.compose.title':     'Quick share',
    'feed.compose.styleHint': 'Linh Trần style — caption + 1–2 photos',
    'feed.compose.locationHint': 'Location name (pick on map)',
    'feed.compose.showMap':   'Show map',
    'feed.compose.hideMap':   'Hide map',
    'feed.compose.publishing':'Publishing…',
    'feed.compose.needContent': 'Please enter at least 10 characters.',
    'feed.compose.needPhoto': 'Please add at least 1 photo.',
    'feed.shareJourney':      'Share Journey',
    'feed.filter.all':        'All',
    'feed.filter.following':  'Following',
    'feed.filter.adventure':  'Adventure',
    'feed.filter.food':       'Food',
    'feed.filter.luxury':     'Luxury',
    'feed.filter.budget':     'Budget',
    'feed.loadMore':          'Load More Stories',
    'feed.readMore':          'Read full article',
    'feed.postDetail':        'Article',
    'feed.close':             'Close',
    'feed.likes':             'likes',
    'feed.commentsCount':     'comments',

    // Reactions
    'react.love':       'Love',
    'react.loved':      'Loved',
    'react.comment':    'Comment',
    'react.save':       'Save',
    'react.saved':      'Saved',

    // Sidebar
    'sidebar.trending':   'Trending Destinations',
    'sidebar.trending.month': 'Hot this month',
    'sidebar.postsThisMonth': 'posts this month',
    'sidebar.suggested':  'Suggested Travellers',
    'sidebar.topics':     'Trending Topics',
    'sidebar.follow':     'Follow',
    'sidebar.posts':      'posts',
    'sidebar.followers':  'followers',
    'sidebar.profile.posts':    'Posts',
    'sidebar.profile.trips':    'Trips',
    'sidebar.profile.followers':'Followers',

    // Quick nav
    'nav.quick.feed':      'News Feed',
    'nav.quick.explore':   'Explore',
    'nav.quick.map':       'Social Map',
    'nav.quick.aiPlanner': 'AI Planner',
    'nav.quick.analytics': 'Analytics',
    'nav.quick.saved':     'Saved',

    // AI Planner
    'planner.heading':     'Smart Travel Planner',
    'planner.subtitle':    'Generate personalized itineraries optimized with TSP routing & GPT-4o intelligence.',
    'planner.destination': 'Destination',
    'planner.days':        'Days',
    'planner.budget':      'Budget/Day ($)',
    'planner.style':       'Travel Style',
    'planner.interests':   'Interests',
    'planner.generate':    'Generate Smart Itinerary',
    'planner.generating':  'Consulting AI...',
    'planner.optimize':    'Optimize Route',
    'planner.optimized':   '✓ TSP Optimized',
    'planner.cost':        'Predicted Trip Cost',
    'planner.noItinerary': 'Your Itinerary Awaits',
    'planner.noItinerarySub': 'Configure your trip parameters and let our AI craft a personalized journey.',
    'planner.styles': ['Adventure', 'Cultural Exploration', 'Leisure & Food', 'Luxury Wellness', 'Budget Backpacker'],

    // Auth
    'auth.signIn':      'Sign In',
    'auth.signUp':      'Sign Up Free',
    'auth.createAccount': 'Create Account',
    'auth.welcome':     'Welcome back, Traveler',
    'auth.startJourney': 'Start Your Journey',
    'auth.signInSub':   'Sign in to your travel community.',
    'auth.signUpSub':   'Create your free account and explore the world.',
    'auth.fullName':    'Full Name',
    'auth.email':       'Email',
    'auth.password':    'Password',
    'auth.loading':     'Please wait…',
    'auth.noAccount':   "Don't have an account? ",
    'auth.haveAccount': 'Already a member? ',
    'auth.google':      'Continue with Google',
    'auth.goToFeed':    'Go to Feed',
    'auth.loginToPost': 'Sign in to post stories and share your journeys.',
    'auth.loginRequired': 'Please sign in to continue.',

    // Map
    'map.checkin':      'Live Check-In',
    'map.placeName':    'Place name…',
    'map.activity':     'What are you doing here?',
    'map.checkinBtn':   'Check-In Now',
    'map.nearby':       'Nearby Places',
    'map.friends':      'Friend Check-Ins',
    'map.live':         'Real-time Social Map · OpenStreetMap EPSG:3857',

    // Analytics
    'analytics.heading': 'Platform Analytics',
    'analytics.subtitle': 'Real-time metrics from PostgreSQL · Prisma ORM · Socket.io',
    'analytics.users':    'Platform Users',
    'analytics.trips':    'Trips Created',
    'analytics.checkins': 'GIS Check-ins',
    'analytics.ai':       'AI Requests',
    'analytics.posts':    'Blog Posts',
    'analytics.social':   'Social Links',
    'analytics.destinations': 'Destinations',
    'analytics.comments': 'Comments',
    'analytics.liveData': 'Live',
    'analytics.popular':  'Popular Destinations',
    'analytics.aiMetrics':'AI System Metrics',

    // Footer
    'footer.built': 'React 19 · Leaflet · Express · Supabase · GPT-4o · Socket.io',
    'footer.thesis': 'SmartTravel — Graduation Thesis 2026',
  },

  vi: {
    // Navigation
    'nav.feed':       'Bảng tin',
    'nav.explore':    'Khám phá',
    'nav.map':        'Bản đồ',
    'nav.aiPlanner':  'Lên kế hoạch AI',
    'nav.analytics':  'Thống kê',
    'nav.cultureGuide': 'Cẩm nang văn hóa — ẩm thực',
    'nav.signIn':     'Đăng nhập',
    'nav.joinFree':   'Đăng ký',
    'nav.signOut':    'Đăng xuất',

    'userMenu.profile':       'Hồ sơ cá nhân',
    'userMenu.following':     'Danh sách theo dõi',
    'userMenu.saved':         'Đã lưu',
    'userMenu.shareJourney':  'Đăng hành trình',
    'userMenu.settings':      'Cài đặt',

    'profile.tab.posts':  'Bài viết',
    'profile.tab.about':  'Giới thiệu',
    'profile.tab.photos': 'Ảnh',
    'profile.tab.trips':  'Hành trình',
    'nav.search':     'Tìm điểm đến, câu chuyện, bạn đồng hành…',

    // Feed page
    'feed.addStory':      'Thêm Story',
    'story.title':        'Tạo Story',
    'story.close':        'Đóng',
    'story.cancel':       'Huỷ',
    'story.next':         'Tiếp theo',
    'story.photosHint':   'Chọn một hoặc nhiều ảnh (tối đa 6).',
    'story.pickPhotos':   'Chọn ảnh',
    'story.pickPhotosSub':'Một hoặc nhiều ảnh — sau đó chọn khung ghép',
    'story.addMore':      'Thêm',
    'story.needPhoto':    'Vui lòng chọn ít nhất 1 ảnh.',
    'story.layoutHint':   'Chọn khung sắp xếp ảnh',
    'story.layoutFallback': 'Thêm ảnh để có thêm khung.',
    'story.nextEdit':     'Thêm chữ & đăng',
    'story.addText':      'Chữ',
    'story.locationPlaceholder': 'Nhập địa điểm…',
    'story.locationLabel': 'Vị trí trên story',
    'story.publish':      'Chia sẻ Story',
    'story.publishing':   'Đang đăng…',
    'feed.composePlaceholder': 'Chia sẻ câu chuyện, mẹo du lịch hoặc check-in của bạn…',
    'feed.compose.photo':     'Ảnh',
    'feed.compose.location':  'Vị trí',
    'feed.compose.trip':      'Chuyến đi',
    'feed.compose.cancel':    'Huỷ',
    'feed.compose.publish':   'Đăng bài',
    'feed.compose.title':     'Chia sẻ nhanh',
    'feed.compose.styleHint': 'Kiểu Linh Trần — caption + 1–2 ảnh',
    'feed.compose.locationHint': 'Tên địa điểm (chọn trên bản đồ)',
    'feed.compose.showMap':   'Hiện bản đồ',
    'feed.compose.hideMap':   'Ẩn bản đồ',
    'feed.compose.publishing':'Đang đăng…',
    'feed.compose.needContent': 'Vui lòng nhập ít nhất 10 ký tự.',
    'feed.compose.needPhoto': 'Vui lòng thêm ít nhất 1 ảnh.',
    'feed.shareJourney':      'Đăng hành trình',
    'feed.filter.all':        'Tất cả',
    'feed.filter.following':  'Đang theo dõi',
    'feed.filter.adventure':  'Phiêu lưu',
    'feed.filter.food':       'Ẩm thực',
    'feed.filter.luxury':     'Sang trọng',
    'feed.filter.budget':     'Tiết kiệm',
    'feed.loadMore':          'Tải thêm bài',
    'feed.readMore':          'Đọc tiếp',
    'feed.postDetail':        'Bài viết',
    'feed.close':             'Đóng',
    'feed.likes':             'lượt thích',
    'feed.commentsCount':     'bình luận',

    // Reactions
    'react.love':       'Yêu thích',
    'react.loved':      'Đã thích',
    'react.comment':    'Bình luận',
    'react.save':       'Lưu lại',
    'react.saved':      'Đã lưu',

    // Sidebar
    'sidebar.trending':   'Điểm đến hot',
    'sidebar.trending.month': 'Tháng này',
    'sidebar.postsThisMonth': 'bài trong tháng',
    'sidebar.suggested':  'Gợi ý bạn đồng hành',
    'sidebar.topics':     'Chủ đề nổi bật',
    'sidebar.follow':     'Theo dõi',
    'sidebar.posts':      'bài viết',
    'sidebar.followers':  'người theo dõi',
    'sidebar.profile.posts':    'Bài viết',
    'sidebar.profile.trips':    'Chuyến đi',
    'sidebar.profile.followers':'Người theo dõi',

    // Quick nav
    'nav.quick.feed':      'Bảng tin',
    'nav.quick.explore':   'Khám phá',
    'nav.quick.map':       'Bản đồ xã hội',
    'nav.quick.aiPlanner': 'Lên kế hoạch AI',
    'nav.quick.analytics': 'Thống kê',
    'nav.quick.saved':     'Đã lưu',

    // AI Planner
    'planner.heading':     'Lên Kế Hoạch Du Lịch Thông Minh',
    'planner.subtitle':    'Tạo hành trình cá nhân tối ưu với thuật toán TSP và trí tuệ GPT-4o.',
    'planner.destination': 'Điểm đến',
    'planner.days':        'Số ngày',
    'planner.budget':      'Ngân sách/ngày ($)',
    'planner.style':       'Phong cách du lịch',
    'planner.interests':   'Sở thích',
    'planner.generate':    'Tạo hành trình thông minh',
    'planner.generating':  'Đang tham vấn AI...',
    'planner.optimize':    'Tối ưu lộ trình',
    'planner.optimized':   '✓ Đã tối ưu TSP',
    'planner.cost':        'Chi phí chuyến đi dự kiến',
    'planner.noItinerary': 'Hành trình của bạn đang chờ',
    'planner.noItinerarySub': 'Điền thông tin và để AI tạo hành trình phù hợp nhất cho bạn.',
    'planner.styles': ['Phiêu lưu', 'Khám phá văn hoá', 'Nghỉ dưỡng & Ẩm thực', 'Sang trọng', 'Tiết kiệm'],

    // Auth
    'auth.signIn':      'Đăng nhập',
    'auth.signUp':      'Đăng ký miễn phí',
    'auth.createAccount': 'Tạo tài khoản',
    'auth.welcome':     'Chào mừng trở lại, Lữ khách!',
    'auth.startJourney': 'Bắt đầu hành trình của bạn',
    'auth.signInSub':   'Đăng nhập vào cộng đồng du lịch của bạn.',
    'auth.signUpSub':   'Tạo tài khoản miễn phí và khám phá thế giới.',
    'auth.fullName':    'Họ và tên',
    'auth.email':       'Email',
    'auth.password':    'Mật khẩu',
    'auth.loading':     'Vui lòng đợi…',
    'auth.noAccount':   'Chưa có tài khoản? ',
    'auth.haveAccount': 'Đã có tài khoản? ',
    'auth.google':      'Tiếp tục với Google',
    'auth.goToFeed':    'Về trang chủ',
    'auth.loginToPost': 'Đăng nhập để đăng bài viết và chia sẻ hành trình.',
    'auth.loginRequired': 'Vui lòng đăng nhập để tiếp tục.',

    // Map
    'map.checkin':      'Check-in trực tuyến',
    'map.placeName':    'Tên địa điểm…',
    'map.activity':     'Bạn đang làm gì ở đây?',
    'map.checkinBtn':   'Check-in ngay',
    'map.nearby':       '🕵️ Địa điểm gần đây',
    'map.friends':      '👥 Check-in của bạn bè',
    'map.live':         'Bản đồ xã hội thời gian thực · OpenStreetMap EPSG:3857',

    // Analytics
    'analytics.heading': 'Thống Kê Nền Tảng',
    'analytics.subtitle': 'Số liệu thời gian thực từ PostgreSQL · Prisma ORM · Socket.io',
    'analytics.users':    'Người dùng',
    'analytics.trips':    'Chuyến đi',
    'analytics.checkins': 'GIS Check-in',
    'analytics.ai':       'Yêu cầu AI',
    'analytics.posts':    'Bài viết',
    'analytics.social':   'Kết nối xã hội',
    'analytics.destinations': 'Điểm đến',
    'analytics.comments': 'Bình luận',
    'analytics.liveData': 'Trực tiếp',
    'analytics.popular':  'Điểm đến phổ biến',
    'analytics.aiMetrics':'Chỉ số hệ thống AI',

    // Footer
    'footer.built': 'React 19 · Leaflet · Express · Supabase · GPT-4o · Socket.io',
    'footer.thesis': 'SmartTravel — Đồ án tốt nghiệp 2026',
  },
} as const;

type TranslationKey = keyof typeof translations.en;

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey) => string;
}

const LangContext = createContext<LangContextValue>({
  lang: 'vi',
  setLang: () => {},
  t: (key) => key,
});

export const LangProvider = ({ children }: { children: React.ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    return (localStorage.getItem('st-lang') as Lang) ?? 'vi';
  });

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem('st-lang', l);
  };

  const t = (key: TranslationKey): string => {
    const val = translations[lang][key];
    if (Array.isArray(val)) return val[0]; // fallback for array types
    return (val as string) ?? key;
  };

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
};

export const useLang = () => useContext(LangContext);
export type { TranslationKey };
export { translations };
