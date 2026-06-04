import { useCallback, useEffect, useState } from 'react';

import { Link, useNavigate, useParams } from 'react-router-dom';

import {

  ArrowLeft, Bookmark, Check, Clock, Heart, MapPin, MessageCircle, Utensils, Landmark, Loader2,

} from 'lucide-react';

import { useRequireAuth } from '../../hooks/useRequireAuth';

import { postsService } from '../../services/smartTravel.service';

import { toApiPostId } from '../../utils/postIds';

import { syncToggleBookmark, syncToggleLike } from '../../utils/postEngagement';

import { getExplorePostById, patchExplorePostEngagement } from './explorePostsStore';



const CATEGORY_STYLES: Record<string, string> = {

  'Thiên nhiên': 'bg-emerald-100 text-emerald-700 border-emerald-200',

  'Ẩm thực': 'bg-amber-100 text-amber-800 border-amber-200',

  'Phiêu lưu': 'bg-rose-100 text-rose-700 border-rose-200',

  'Văn hóa': 'bg-violet-100 text-violet-700 border-violet-200',

  'Sang trọng': 'bg-sky-100 text-sky-700 border-sky-200',

  'Biển đảo': 'bg-cyan-100 text-cyan-800 border-cyan-200',

  'Nghỉ dưỡng': 'bg-teal-100 text-teal-800 border-teal-200',

};



export default function ExploreArticlePage() {

  const { id } = useParams<{ id: string }>();

  const navigate = useNavigate();

  const { requireAuth } = useRequireAuth();

  const [post, setPost] = useState(() => (id ? getExplorePostById(id) : undefined));

  const [commentText, setCommentText] = useState('');

  const [comments, setComments] = useState(post?.comments ?? []);

  const [engagementLoading, setEngagementLoading] = useState(false);



  const applyPost = useCallback((next: NonNullable<typeof post>) => {

    setPost(next);

    setComments(next.comments ?? []);

  }, []);



  useEffect(() => {

    if (!id) return;

    const local = getExplorePostById(id);

    if (local) applyPost(local);



    const apiId = toApiPostId(id);

    if (!apiId) return;



    postsService

      .get(apiId)

      .then(apiPost => {

        const liked = !!apiPost.isLiked;

        const bookmarked = !!apiPost.isBookmarked;

        const likes = apiPost._count?.likes ?? local?.likes ?? 0;

        patchExplorePostEngagement(id, { liked, bookmarked, likes });

        const refreshed = getExplorePostById(id);

        if (refreshed) applyPost(refreshed);

      })

      .catch(() => {});

  }, [id, applyPost]);



  if (!post) {

    return (

      <div className="explore-article-page min-h-screen flex flex-col items-center justify-center gap-4 px-4">

        <p className="text-slate-600">Không tìm thấy bài viết.</p>

        <Link to="/explore" className="text-teal-700 font-semibold hover:underline">← Về Khám phá</Link>

      </div>

    );

  }



  const persistEngagement = (patch: Parameters<typeof patchExplorePostEngagement>[1]) => {

    patchExplorePostEngagement(post.id, patch);

    setPost(prev => (prev ? { ...prev, ...patch } : prev));

  };



  const toggleLike = async () => {

    if (!requireAuth(`/explore/post/${post.id}`)) return;

    setEngagementLoading(true);

    try {

      const next = await syncToggleLike(post.id, { liked: post.liked, likes: post.likes });

      persistEngagement({ liked: next.liked, likes: next.likes });

    } catch (err) {

      console.error(err);

    } finally {

      setEngagementLoading(false);

    }

  };



  const toggleBookmark = async () => {

    if (!requireAuth(`/explore/post/${post.id}`)) return;

    setEngagementLoading(true);

    try {

      const next = await syncToggleBookmark(post.id, { bookmarked: post.bookmarked });

      persistEngagement({ bookmarked: next.bookmarked });

    } catch (err) {

      console.error(err);

    } finally {

      setEngagementLoading(false);

    }

  };



  const addComment = (e: React.FormEvent) => {

    e.preventDefault();

    if (!commentText.trim()) return;

    const next = [

      {

        id: String(Date.now()),

        author: 'Bạn',

        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=80&q=80',

        text: commentText.trim(),

        date: 'Vừa xong',

      },

      ...comments,

    ];

    setComments(next);

    patchExplorePostEngagement(post.id, { comments: next });

    setCommentText('');

  };



  const catClass = CATEGORY_STYLES[post.category] ?? 'bg-slate-100 text-slate-600 border-slate-200';



  return (

    <div className="explore-article-page min-h-screen bg-[#fafaf9]">

      <div className="explore-article-page__bar sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">

        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">

          <button

            type="button"

            onClick={() => navigate('/explore')}

            className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"

          >

            <ArrowLeft size={18} /> Khám phá

          </button>

          <div className="flex items-center gap-2">

            {engagementLoading && <Loader2 size={18} className="animate-spin text-slate-400" />}

            <button

              type="button"

              onClick={() => void toggleLike()}

              disabled={engagementLoading}

              className={`p-2 rounded-full ${post.liked ? 'text-rose-500' : 'text-slate-400'}`}

            >

              <Heart size={20} className={post.liked ? 'fill-current' : ''} />

            </button>

            <button

              type="button"

              onClick={() => void toggleBookmark()}

              disabled={engagementLoading}

              className={`p-2 rounded-full ${post.bookmarked ? 'text-amber-600' : 'text-slate-400'}`}

            >

              <Bookmark size={20} className={post.bookmarked ? 'fill-current' : ''} />

            </button>

          </div>

        </div>

      </div>



      <article className="max-w-3xl mx-auto px-4 py-8 pb-20">

        <figure className="rounded-2xl overflow-hidden shadow-lg mb-8">

          <img src={post.coverImage} alt={post.title} className="w-full aspect-[16/9] object-cover" />

        </figure>



        <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border mb-4 ${catClass}`}>

          {post.category}

        </span>



        <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-slate-900 leading-tight mb-4">

          {post.title}

        </h1>



        <p className="text-lg text-slate-600 leading-relaxed border-l-4 border-teal-500 pl-4 mb-6">

          {post.excerpt}

        </p>



        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500 mb-8 pb-8 border-b border-slate-200">

          <div className="flex items-center gap-2">

            <img src={post.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />

            <div>

              <span className="font-bold text-slate-800 flex items-center gap-1">

                {post.author}

                {post.verified && <Check size={14} className="text-sky-500" />}

              </span>

              <span className="text-xs block">{post.handle}</span>

            </div>

          </div>

          <span className="flex items-center gap-1"><Clock size={14} /> {post.readTime} phút đọc</span>

          <span className="flex items-center gap-1"><MapPin size={14} className="text-teal-600" /> {post.location}</span>

          <span>{post.date}</span>

        </div>



        <div className="prose-feed text-slate-700 text-base sm:text-lg leading-[1.75] space-y-5 mb-10">

          <p>{post.content}</p>

          <p>

            Hành trình được ghi lại tại <strong>{post.province}</strong> (miền {post.region}), thuộc chuyên mục{' '}

            <strong>{post.category}</strong> trên SmartTravel Magazine.

          </p>

        </div>



        {post.dishes.length > 0 && (

          <section className="mb-8 p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100">

            <h2 className="font-bold text-amber-900 flex items-center gap-2 mb-3">

              <Utensils size={18} /> Gợi ý ẩm thực

            </h2>

            <ul className="grid sm:grid-cols-2 gap-2 text-sm text-amber-950">

              {post.dishes.map(d => (

                <li key={d} className="flex items-center gap-2 before:content-['•'] before:text-amber-500">{d}</li>

              ))}

            </ul>

          </section>

        )}



        {post.cultureThemes.length > 0 && (

          <section className="mb-8 p-5 rounded-2xl bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100">

            <h2 className="font-bold text-violet-900 flex items-center gap-2 mb-3">

              <Landmark size={18} /> Văn hóa & trải nghiệm

            </h2>

            <ul className="flex flex-wrap gap-2">

              {post.cultureThemes.map(c => (

                <li key={c} className="text-sm font-medium text-violet-800 bg-white/80 px-3 py-1.5 rounded-full border border-violet-200">

                  {c}

                </li>

              ))}

            </ul>

          </section>

        )}



        <div className="flex flex-wrap gap-2 mb-10">

          {post.tags.map(tag => (

            <span key={tag} className="text-xs text-teal-700 bg-teal-50 px-3 py-1 rounded-full">#{tag}</span>

          ))}

        </div>



        <div className="flex items-center gap-4 mb-12">

          <button

            type="button"

            onClick={() => void toggleLike()}

            disabled={engagementLoading}

            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border ${post.liked ? 'bg-rose-50 border-rose-200 text-rose-700' : 'border-slate-200 text-slate-600'}`}

          >

            <Heart size={16} className={post.liked ? 'fill-current' : ''} />

            {post.likes.toLocaleString()} thích

          </button>

          <button

            type="button"

            onClick={() => void toggleBookmark()}

            disabled={engagementLoading}

            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border ${post.bookmarked ? 'bg-amber-50 border-amber-200 text-amber-700' : 'border-slate-200'}`}

          >

            <Bookmark size={16} className={post.bookmarked ? 'fill-current' : ''} /> Lưu bài

          </button>

        </div>



        <section className="border-t border-slate-200 pt-8">

          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-6">

            <MessageCircle size={20} className="text-teal-600" />

            Bình luận ({comments.length})

          </h2>

          <form onSubmit={addComment} className="flex gap-2 mb-6">

            <input

              type="text"

              value={commentText}

              onChange={e => setCommentText(e.target.value)}

              placeholder="Viết bình luận..."

              className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100"

            />

            <button type="submit" className="px-5 py-3 rounded-xl bg-teal-600 text-white text-sm font-bold hover:bg-teal-700">

              Gửi

            </button>

          </form>

          <div className="space-y-4">

            {comments.map(c => (

              <div key={c.id} className="flex gap-3">

                <img src={c.avatar} alt="" className="w-10 h-10 rounded-full flex-shrink-0" />

                <div className="flex-1 bg-white rounded-2xl px-4 py-3 border border-slate-100 shadow-sm">

                  <div className="flex items-center gap-2 mb-1">

                    <span className="text-sm font-bold text-slate-800">{c.author}</span>

                    <span className="text-xs text-slate-400">{c.date}</span>

                  </div>

                  <p className="text-sm text-slate-600">{c.text}</p>

                </div>

              </div>

            ))}

          </div>

        </section>

      </article>

    </div>

  );

}


