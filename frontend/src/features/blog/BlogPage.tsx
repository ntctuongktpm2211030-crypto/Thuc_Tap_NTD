import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Bookmark, MapPin, Trophy, Users, X, Check, Utensils } from 'lucide-react';

// ────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────
interface Post {
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
  date: string;
  readTime: number;
  likes: number;
  comments: CommentType[];
  bookmarked: boolean;
  liked: boolean;
}

interface CommentType {
  id: string;
  author: string;
  avatar: string;
  text: string;
  date: string;
}

// ────────────────────────────────────────────
// MOCK DATA
// ────────────────────────────────────────────
const INITIAL_POSTS: Post[] = [
  {
    id: 'p1',
    author: 'Minh Quân',
    handle: '@minhquan_wanders',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80',
    verified: true,
    title: 'Bí ẩn của thung lũng Mường Hoa mùa lúa chín',
    excerpt: 'Vào tháng 9, toàn bộ thung lũng chuyển sang màu vàng óng — một khung cảnh mà bất kỳ nhiếp ảnh gia nào cũng phải mê đắm.',
    content: 'Vào tháng 9, toàn bộ thung lũng chuyển sang màu vàng óng — một khung cảnh mà bất kỳ nhiếp ảnh gia nào cũng phải mê đắm. Tôi đã thức dậy lúc 5h sáng để leo lên các thửa ruộng bậc thang và chờ ánh nắng đầu tiên của ngày...',
    coverImage: 'https://images.unsplash.com/photo-1508873696983-2df519f0397e?auto=format&fit=crop&w=900&q=80',
    tags: ['sapa', 'thiên nhiên', 'nhiếp ảnh'],
    category: 'Thiên nhiên',
    location: 'Thung lũng Mường Hoa, Sapa',
    date: '01/06/2026',
    readTime: 6,
    likes: 421,
    comments: [
      { id: 'c1', author: 'Hà Linh', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=80&q=80', text: 'Ảnh đẹp quá! Bạn dùng máy gì vậy?', date: '2 giờ trước' },
      { id: 'c2', author: 'Alex N.', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=80&q=80', text: 'Tuyệt vời! Cảnh sáng sớm ở Sapa lúc nào cũng đẹp nhất.', date: '5 giờ trước' },
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
    excerpt: 'Bún chả Hương Liên, bánh mì Phượng, kem tràng tiền. Dạ dày tôi no nê còn ví tiền vẫn còn nguyên. Việt Nam thực sự là thiên đường ẩm thực!',
    content: 'Bún chả Hương Liên, bánh mì Phượng, kem tràng tiền. Dạ dày tôi no nê còn ví tiền vẫn còn nguyên. Việt Nam thực sự là thiên đường ẩm thực! Tôi bắt đầu hành trình ẩm thực từ 7h sáng với bát phở bò nóng hổi và kết thúc lúc 10h đêm với ly bia hơi lề đường...',
    coverImage: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80',
    tags: ['ẩm thực', 'hanoi', 'street food'],
    category: 'Ẩm thực',
    location: 'Phố Cổ Hà Nội',
    date: '30/05/2026',
    readTime: 4,
    likes: 1128,
    comments: [
      { id: 'c3', author: 'Tuấn Anh', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=80&q=80', text: 'Nhớ ăn chả cá Lã Vọng nữa nhé! Đặc sản không thể bỏ qua.', date: '1 ngày trước' },
    ],
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
    excerpt: 'Con đường chạy qua đèo Mã Pí Lèng như vắt ngang giữa trời, một bên vách núi dựng đứng, một bên vực thẳm hàng trăm mét.',
    content: 'Con đường chạy qua đèo Mã Pí Lèng như vắt ngang giữa trời, một bên vách núi dựng đứng, một bên vực thẳm hàng trăm mét. Hành trình không dành cho những người yếu tim, nhưng nếu bạn vượt qua được thì phần thưởng là khung cảnh hùng vĩ không nơi nào có được...',
    coverImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=80',
    tags: ['hagiang', 'motorbiking', 'đèo'],
    category: 'Phiêu lưu',
    location: 'Đèo Mã Pí Lèng, Hà Giang',
    date: '28/05/2026',
    readTime: 8,
    likes: 763,
    comments: [],
    bookmarked: false,
    liked: false,
  },
];

const TRENDING_TAGS = ['sapa', 'hagiang', 'danang', 'ẩm thực', 'motorbiking', 'thiên nhiên', 'bãi biển', 'văn hóa', 'nhiếp ảnh'];
const CATEGORIES = ['Tất cả', 'Thiên nhiên', 'Ẩm thực', 'Phiêu lưu', 'Văn hóa', 'Sang trọng'];

const SUGGESTED_TRAVELLERS = [
  { name: 'Sarah K.', handle: '@sarahk_world', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=80&q=80', posts: 142 },
  { name: 'Đức Minh', handle: '@ducminh_vn', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=80&q=80', posts: 87 },
  { name: 'Maya Patel', handle: '@maya_roams', avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=80&q=80', posts: 215 },
];

// ────────────────────────────────────────────
// SUB-COMPONENTS
// ────────────────────────────────────────────

// Category pill badge
const CategoryBadge = ({ category }: { category: string }) => {
  const colors: Record<string, string> = {
    'Thiên nhiên': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    'Ẩm thực': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'Phiêu lưu': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    'Văn hóa': 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    'Sang trọng': 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  };
  return (
    <span className={`text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-1 rounded-lg border ${colors[category] || 'bg-slate-800 text-slate-400 border-slate-700'}`}>
      {category}
    </span>
  );
};

// Single post card
const PostCard = ({ post, onToggleLike, onToggleBookmark, onOpenDetail }: {
  post: Post;
  onToggleLike: (id: string) => void;
  onToggleBookmark: (id: string) => void;
  onOpenDetail: (post: Post) => void;
}) => {
  return (
    <article className="glass-card rounded-2xl border border-slate-800/80 overflow-hidden group interactive-hover shadow-xl">
      {/* Cover Image */}
      <div className="relative overflow-hidden h-52 cursor-pointer" onClick={() => onOpenDetail(post)}>
        <img
          src={post.coverImage}
          alt={post.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
        <div className="absolute bottom-3 left-3">
          <CategoryBadge category={post.category} />
        </div>
        <div className="absolute top-3 right-3 bg-slate-950/70 backdrop-blur-sm text-[10px] font-semibold px-2.5 py-1 rounded-lg text-slate-300">
          📖 {post.readTime} min read
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 space-y-3">
        {/* Author Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={post.avatar} alt={post.author} className="w-8 h-8 rounded-full object-cover border-2 border-slate-800" />
            <div>
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-slate-200">{post.author}</span>
                {post.verified && <span className="text-brand-400 text-xs">✓</span>}
              </div>
              <span className="text-[10px] text-slate-500">{post.date} · 📍 {post.location}</span>
            </div>
          </div>
        </div>

        {/* Title + Excerpt */}
        <div className="cursor-pointer" onClick={() => onOpenDetail(post)}>
          <h2 className="text-base font-bold text-slate-100 group-hover:text-brand-400 transition-colors leading-snug line-clamp-2">
            {post.title}
          </h2>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed line-clamp-2">
            {post.excerpt}
          </p>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {post.tags.map(tag => (
            <span key={tag} className="text-[10px] text-slate-500 hover:text-brand-400 cursor-pointer transition-colors">
              #{tag}
            </span>
          ))}
        </div>

        {/* Interaction footer */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-900">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onToggleLike(post.id)}
              className={`flex items-center gap-1.5 text-xs font-semibold transition-all hover:scale-110 ${post.liked ? 'text-rose-400' : 'text-slate-500 hover:text-rose-400'}`}
            >
              <Heart size={14} className={post.liked ? 'fill-current' : ''} /> {post.likes.toLocaleString()}
            </button>
            <button
              onClick={() => onOpenDetail(post)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-400 transition-colors"
            >
              <MessageCircle size={14} /> {post.comments.length}
            </button>
          </div>
          <button
            onClick={() => onToggleBookmark(post.id)}
            className={`flex items-center gap-1.5 text-xs font-semibold transition-all hover:scale-110 ${post.bookmarked ? 'text-amber-400' : 'text-slate-500 hover:text-amber-400'}`}
          >
            <Bookmark size={14} className={post.bookmarked ? 'fill-current' : ''} /> {post.bookmarked ? 'Saved' : 'Save'}
          </button>
        </div>
      </div>
    </article>
  );
};

// Featured hero post (top story)
const HeroPostCard = ({ post, onToggleLike, onToggleBookmark, onOpenDetail }: {
  post: Post;
  onToggleLike: (id: string) => void;
  onToggleBookmark: (id: string) => void;
  onOpenDetail: (post: Post) => void;
}) => {
  return (
    <article
      className="relative w-full h-[420px] rounded-3xl overflow-hidden cursor-pointer group shadow-2xl shadow-black/50"
      onClick={() => onOpenDetail(post)}
    >
      <img
        src={post.coverImage}
        alt={post.title}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
      <div className="absolute inset-0 p-8 flex flex-col justify-end space-y-3">
        <div className="flex items-center gap-2">
          <CategoryBadge category={post.category} />
          <span className="text-[10px] font-semibold text-slate-400 bg-slate-950/60 px-2 py-1 rounded-lg flex items-center gap-1"><Trophy size={11} /> Editor&apos;s Pick</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white leading-tight max-w-2xl line-clamp-2">
          {post.title}
        </h1>
        <p className="text-sm text-slate-300 max-w-xl line-clamp-2 leading-relaxed">
          {post.excerpt}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={post.avatar} alt={post.author} className="w-9 h-9 rounded-full object-cover border-2 border-brand-500" />
            <div>
              <span className="text-sm font-bold text-white">{post.author}</span>
              <p className="text-[10px] text-slate-400 flex items-center gap-1">{post.date} · {post.readTime} min · <MapPin size={10} /> {post.location}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={(e) => { e.stopPropagation(); onToggleLike(post.id); }}
              className={`flex items-center gap-1.5 text-sm font-semibold transition-all hover:scale-110 ${post.liked ? 'text-rose-400' : 'text-slate-300 hover:text-rose-400'}`}
            >
              <Heart size={16} className={post.liked ? 'fill-current' : ''} /> {post.likes.toLocaleString()}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onToggleBookmark(post.id); }}
              className={`text-sm font-semibold transition-all hover:scale-110 ${post.bookmarked ? 'text-amber-400' : 'text-slate-300 hover:text-amber-400'}`}
            >
              <Bookmark size={16} className={post.bookmarked ? 'fill-current' : ''} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

// Post Detail Modal
const PostDetailModal = ({ post, onClose, onToggleLike, onToggleBookmark }: {
  post: Post;
  onClose: () => void;
  onToggleLike: (id: string) => void;
  onToggleBookmark: (id: string) => void;
}) => {
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<CommentType[]>(post.comments);

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    const newComment: CommentType = {
      id: String(Date.now()),
      author: 'Bạn',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=80&q=80',
      text: commentText,
      date: 'Vừa xong',
    };
    setComments([newComment, ...comments]);
    setCommentText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/90 backdrop-blur-md p-4 pt-10">
      <div className="bg-slate-950 border border-slate-800 rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden">
        {/* Hero Cover */}
        <div className="relative h-72">
          <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-950/70 backdrop-blur-sm border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-900 transition-all"
          >
            <X size={18} />
          </button>
          <div className="absolute bottom-4 left-5">
            <CategoryBadge category={post.category} />
          </div>
        </div>

        {/* Article Content */}
        <div className="p-6 space-y-6">
          {/* Author */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={post.avatar} alt={post.author} className="w-11 h-11 rounded-full object-cover border-2 border-brand-500/40" />
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold text-slate-200">{post.author}</span>
                  {post.verified && <Check size={14} className="text-brand-400" />}
                  <span className="text-xs text-slate-500">{post.handle}</span>
                </div>
                <p className="text-[11px] text-slate-500 flex items-center gap-1">{post.date} · <MapPin size={10} /> {post.location} · {post.readTime} min read</p>
              </div>
            </div>
            <button className="text-xs font-semibold text-brand-400 border border-brand-500/30 px-4 py-1.5 rounded-xl hover:bg-brand-500/10 transition-colors">
              Follow
            </button>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-extrabold text-slate-100 leading-tight">{post.title}</h1>

          {/* Full article content */}
          <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed space-y-3">
            <p>{post.content}</p>
            <p>
              Chúng tôi khởi hành từ Hà Nội lúc 5h sáng, vượt qua hơn 300km đường núi quanh co để đến với những thửa ruộng bậc thang kỳ vĩ nhất Đông Nam Á. Mỗi khúc cua là một bức tranh mới, mỗi thung lũng là một câu chuyện chưa được kể.
            </p>
            <p>
              Với AI Trip Planner của SmartTravel, hành trình này đã được tối ưu hóa tuyến đường bằng thuật toán TSP — giúp chúng tôi tiết kiệm hơn 2 giờ lái xe và ghé thêm được 3 điểm địa phương ít người biết đến.
            </p>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 pb-4 border-b border-slate-900">
            {post.tags.map(tag => (
              <span key={tag} className="text-xs text-slate-500 bg-slate-900 hover:text-brand-400 px-3 py-1 rounded-lg cursor-pointer transition-colors border border-slate-800">
                #{tag}
              </span>
            ))}
          </div>

          {/* Like / Bookmark Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => onToggleLike(post.id)}
                className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl border transition-all ${post.liked ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : 'border-slate-800 text-slate-400 hover:border-rose-500/30 hover:text-rose-400'}`}
              >
                <Heart size={15} className={post.liked ? 'fill-current' : ''} /> {post.liked ? 'Liked' : 'Like'} · {post.likes.toLocaleString()}
              </button>
            </div>
            <button
              onClick={() => onToggleBookmark(post.id)}
              className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl border transition-all ${post.bookmarked ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'border-slate-800 text-slate-400 hover:border-amber-500/30 hover:text-amber-400'}`}
            >
              <Bookmark size={15} className={post.bookmarked ? 'fill-current' : ''} /> {post.bookmarked ? 'Saved' : 'Save Post'}
            </button>
          </div>

          {/* Comments Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-t border-slate-900 pt-4">
              <MessageCircle size={14} className="inline mr-1" /> Bình luận ({comments.length})
            </h3>

            {/* Add comment form */}
            <form onSubmit={handleAddComment} className="flex gap-2">
              <img
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=80&q=80"
                alt="You"
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
              />
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Viết bình luận của bạn..."
                  className="flex-1 bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold transition-colors"
                >
                  Gửi
                </button>
              </div>
            </form>

            {/* Comment list */}
            <div className="space-y-3">
              {comments.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-4">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
              )}
              {comments.map((c) => (
                <div key={c.id} className="flex gap-2.5">
                  <img src={c.avatar} alt={c.author} className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-slate-800" />
                  <div className="flex-1 bg-slate-900/60 rounded-xl px-4 py-2.5 border border-slate-900">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-slate-200">{c.author}</span>
                      <span className="text-[10px] text-slate-600">{c.date}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────
// MAIN BLOG PAGE COMPONENT
// ────────────────────────────────────────────
const BlogPage = () => {
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [activeCategory, setActiveCategory] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const handleToggleLike = (id: string) => {
    setPosts(prev =>
      prev.map(p =>
        p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
      )
    );
    if (selectedPost?.id === id) {
      setSelectedPost(prev => prev ? { ...prev, liked: !prev.liked, likes: prev.liked ? prev.likes - 1 : prev.likes + 1 } : null);
    }
  };

  const handleToggleBookmark = (id: string) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, bookmarked: !p.bookmarked } : p));
    if (selectedPost?.id === id) {
      setSelectedPost(prev => prev ? { ...prev, bookmarked: !prev.bookmarked } : null);
    }
  };

  const filteredPosts = posts.filter(p => {
    const matchesCategory = activeCategory === 'Tất cả' || p.category === activeCategory;
    const matchesSearch = searchQuery === '' || p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const heroPosts = filteredPosts.slice(0, 1);
  const gridPosts = filteredPosts.slice(1);

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Page Header Banner */}
      <div className="relative border-b border-slate-900 bg-gradient-to-b from-slate-950 to-slate-950">
        <div className="max-w-6xl mx-auto px-4 py-10 space-y-6">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold mb-2">
              ✈️ Smart Travel Community
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
              Travel{' '}
              <span className="bg-gradient-to-r from-brand-400 to-indigo-400 bg-clip-text text-transparent">
                Stories
              </span>
            </h1>
            <p className="text-slate-400 text-base max-w-xl mx-auto">
              Khám phá những câu chuyện du lịch thực tế, hành trình được AI tối ưu hóa, và cộng đồng travellers năng động.
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-xl mx-auto relative">
            <span className="absolute inset-y-0 left-4 flex items-center text-slate-500">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm bài viết, địa điểm, tác giả..."
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-brand-500 focus:shadow-lg focus:shadow-brand-500/10 transition-all"
            />
          </div>

          <div className="flex justify-center gap-3 flex-wrap">
            <span className="px-5 py-2 rounded-xl text-sm font-semibold bg-brand-500 text-white shadow-lg shadow-brand-500/20">
              Bảng tin
            </span>
            <Link
              to="/guide/culture-food"
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-amber-500/50 flex items-center gap-2 transition-all"
            >
              <Utensils size={15} /> Cẩm nang văn hóa — ẩm thực
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-8">
              {/* Category filter pills */}
              <div className="flex gap-2 flex-wrap">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      activeCategory === cat
                        ? 'bg-brand-500 border-brand-500 text-white shadow-md shadow-brand-500/20'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Hero story */}
              {heroPosts.length > 0 && (
                <HeroPostCard
                  post={heroPosts[0]}
                  onToggleLike={handleToggleLike}
                  onToggleBookmark={handleToggleBookmark}
                  onOpenDetail={setSelectedPost}
                />
              )}

              {/* Grid of remaining posts */}
              {gridPosts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {gridPosts.map(post => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onToggleLike={handleToggleLike}
                      onToggleBookmark={handleToggleBookmark}
                      onOpenDetail={setSelectedPost}
                    />
                  ))}
                </div>
              ) : (
                filteredPosts.length === 0 && (
                  <div className="text-center py-16 text-slate-500 space-y-2">
                    <div className="text-4xl">🗺️</div>
                    <p className="font-semibold">Không tìm thấy bài viết phù hợp.</p>
                    <p className="text-xs">Thử thay đổi từ khoá hoặc danh mục.</p>
                  </div>
                )
              )}
            </div>

            {/* Sidebar */}
            <aside className="lg:col-span-1 space-y-6">
              {/* Trending Tags */}
              <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">🔥 Trending Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {TRENDING_TAGS.map(tag => (
                    <button
                      key={tag}
                      onClick={() => setSearchQuery(tag)}
                      className="text-[11px] text-slate-400 bg-slate-900 hover:bg-brand-500/10 hover:text-brand-400 border border-slate-800 hover:border-brand-500/30 px-3 py-1 rounded-lg transition-colors"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Suggested Travellers */}
              <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5"><Users size={13} /> Suggested Travellers</h3>
                {SUGGESTED_TRAVELLERS.map((t) => (
                  <div key={t.handle} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img src={t.avatar} alt={t.name} className="w-9 h-9 rounded-full object-cover border-2 border-slate-800" />
                      <div>
                        <p className="text-xs font-bold text-slate-200">{t.name}</p>
                        <p className="text-[10px] text-slate-500">{t.posts} bài viết</p>
                      </div>
                    </div>
                    <button className="text-[10px] font-semibold text-brand-400 border border-brand-500/30 px-2.5 py-1 rounded-lg hover:bg-brand-500/10 transition-colors">
                      Follow
                    </button>
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">📊 Community Stats</h3>
                <div className="space-y-2">
                  {[
                    { label: 'Tổng bài viết', value: '12,842' },
                    { label: 'Travellers tích cực', value: '4,912' },
                    { label: 'Địa điểm đã khám phá', value: '1,042' },
                  ].map((stat) => (
                    <div key={stat.label} className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">{stat.label}</span>
                      <span className="font-bold text-brand-400">{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
      </div>

      {/* Post Detail Modal */}
      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onToggleLike={handleToggleLike}
          onToggleBookmark={handleToggleBookmark}
        />
      )}
    </div>
  );
};

export default BlogPage;
