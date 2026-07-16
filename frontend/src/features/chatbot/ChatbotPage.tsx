import React, { useState, useEffect, useRef } from 'react';
import {
  Send, User, Plus, Brain, Star, RefreshCw,
  Loader2, CheckCircle2, XCircle, ChevronRight, MessageSquare, BookOpen, ExternalLink, Trash2
} from 'lucide-react';
import { chatbotService, feedbackService, ChatConversation, ChatMessage, AIMemory } from '../../services/smartTravel.service';
import { useLang } from '../../contexts/LanguageContext';
import chatbotImg from '../../assets/chatbot.jpg';
import loadingVideo from '../../../4278555227519042772.mp4';
import MemoryManager from './MemoryManager';

export default function ChatbotPage() {
  const { lang } = useLang();
  const vi = lang === 'vi';

  // State
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [showIntroVideo, setShowIntroVideo] = useState(true);
  const [currentConversation, setCurrentConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loadingMsg, setLoadingMsg] = useState(false);
  const [loadingConvList, setLoadingConvList] = useState(false);
  const [loadingConvDetail, setLoadingConvDetail] = useState(false);

  // Memory State
  const [memory, setMemory] = useState<AIMemory | null>(null);
  const [showMemoryPanel, setShowMemoryPanel] = useState(false);
  // Citation State
  const [showCitationModal, setShowCitationModal] = useState<{ messageId: string; citation: any } | null>(null);
  const [activeFeedbackMsgId, setActiveFeedbackMsgId] = useState<string | null>(null);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversation list and memory
  useEffect(() => {
    fetchConversations();
    fetchMemory();

    // Show intro video for 6 seconds
    const timer = setTimeout(() => {
      setShowIntroVideo(false);
    }, 6000);
    return () => clearTimeout(timer);
  }, []);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loadingMsg]);

  const fetchConversations = async () => {
    setLoadingConvList(true);
    try {
      const list = await chatbotService.LayDanhSachCuocHoiThoai();
      setConversations(list);
      // Automatically select first conversation if available
      if (list.length > 0 && !currentConversation) {
        selectConversation(list[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setLoadingConvList(false);
    }
  };

  const fetchMemory = async () => {
    try {
      const mem = await chatbotService.LayBoNhoAI();
      setMemory(mem);
    } catch (err) {
      console.error('Failed to fetch memory:', err);
    }
  };

  const selectConversation = async (id: string) => {
    setLoadingConvDetail(true);
    try {
      const detail = await chatbotService.LayChiTietCuocHoiThoai(id);
      setCurrentConversation(detail);
      setMessages(detail.messages || []);
    } catch (err) {
      console.error('Failed to fetch conversation details:', err);
    } finally {
      setLoadingConvDetail(false);
    }
  };



  const handleNewConversation = async () => {
    try {
      const title = vi ? 'Hội thoại mới' : 'New Chat';
      const newConv = await chatbotService.TaoCuocHoiThoai(title);
      setConversations(prev => [newConv, ...prev]);
      setCurrentConversation(newConv);
      setMessages([]);
    } catch (err) {
      console.error('Failed to create conversation:', err);
    }
  };

  const handleDeleteConversation = (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    setDeleteConfirmId(conversationId);
  };

  const confirmDeleteConversation = async () => {
    if (!deleteConfirmId) return;
    const conversationId = deleteConfirmId;
    setDeleteConfirmId(null);
    try {
      await chatbotService.XoaCuocHoiThoai(conversationId);
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null);
        setMessages([]);
      }
    } catch (err) {
      console.error(err);
      alert(vi ? 'Xóa lịch sử chat thất bại.' : 'Failed to delete chat history.');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || loadingMsg) return;

    const userText = inputMessage.trim();
    setInputMessage('');
    setLoadingMsg(true);

    // Optimistically push user message to UI
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      createdAt: new Date().toISOString(),
      versions: [{ id: `v-${Date.now()}`, content: userText, version: 1, isActive: true, createdAt: new Date().toISOString() }]
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      let conv = currentConversation;
      if (!conv) {
        const title = userText.substring(0, 30) + (userText.length > 30 ? '...' : '');
        conv = await chatbotService.TaoCuocHoiThoai(title);
        setConversations(prev => [conv!, ...prev]);
        setCurrentConversation(conv);
      }

      const response = await chatbotService.GuiTinNhan(conv.id, userText);
      // Replace messages with the exact ones from server
      setMessages(prev => {
        const cleaned = prev.filter(m => !m.id.startsWith('temp-'));
        return [...cleaned, response.userMessage, response.assistantMessage];
      });
      // Refresh conversation list
      fetchConversations();
    } catch (err: any) {
      console.error('Failed to send message:', err);
      // Restore input text
      setInputMessage(userText);
      // Remove optimistic message
      setMessages(prev => prev.filter(m => !m.id.startsWith('temp-')));
      // Show descriptive alert
      const errMsg = err.response?.data?.error || err.message || (vi ? 'Không thể gửi tin nhắn. Vui lòng thử lại.' : 'Failed to send message. Please try again.');
      alert(errMsg);
    } finally {
      setLoadingMsg(false);
    }
  };

  const handleRegenerate = async (msgId: string) => {
    setLoadingMsg(true);
    try {
      const updatedMsg = await chatbotService.TaoLaiPhanHoi(msgId);
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, versions: updatedMsg.versions } : m));
    } catch (err) {
      console.error('Failed to regenerate response:', err);
    } finally {
      setLoadingMsg(false);
    }
  };

  const handleOpenFeedback = (msg: ChatMessage) => {
    setActiveFeedbackMsgId(msg.id);
    setFeedbackRating(msg.feedback?.rating || 5);
    setFeedbackComment(msg.feedback?.comment || '');
  };

  const handleSubmitFeedback = async () => {
    if (!activeFeedbackMsgId) return;
    try {
      const msg = messages.find(m => m.id === activeFeedbackMsgId);
      let fb;
      if (msg?.feedback) {
        fb = await feedbackService.update(msg.feedback.id, { rating: feedbackRating, comment: feedbackComment });
      } else {
        fb = await feedbackService.create({ messageId: activeFeedbackMsgId, rating: feedbackRating, comment: feedbackComment });
      }
      setMessages(prev => prev.map(m => m.id === activeFeedbackMsgId ? { ...m, feedback: fb } : m));
      setActiveFeedbackMsgId(null);
      alert(vi ? 'Đóng góp ý kiến thành công! Cảm ơn bạn.' : 'Feedback submitted successfully! Thank you.');
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    }
  };

  return (
    <div className="max-w-screen-2xl mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-4 gap-5 h-[calc(100vh-130px)] min-h-[550px]">
      <style>{`
        @keyframes bot-sway {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          25% {
            transform: translateY(-8px) rotate(4deg);
          }
          50% {
            transform: translateY(-2px) rotate(0deg);
          }
          75% {
            transform: translateY(-8px) rotate(-4deg);
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-bot-sway {
          animation: bot-sway 4s ease-in-out infinite;
          transform-origin: bottom center;
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
      
      {/* ─── SIDEBAR: LỊCH SỬ CHAT ─── */}
      <div className="lg:col-span-1 surface-elevated rounded-2xl flex flex-col overflow-hidden border border-[var(--border-subtle)]">
        <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <MessageSquare size={16} className="text-gold" /> {vi ? 'Lịch sử Chat' : 'Chat History'}
          </h3>
          <button
            onClick={handleNewConversation}
            className="p-1.5 rounded-lg bg-[var(--bg-elevated)] hover:bg-[var(--gold-glow)]/10 border border-[var(--border-subtle)] hover:border-[var(--gold)] text-[var(--gold)] transition-all cursor-pointer hover:scale-105 active:scale-95"
            title={vi ? 'Trò chuyện mới' : 'New Chat'}
          >
            <Plus size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loadingConvList ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="animate-spin text-[var(--gold)]" size={20} />
            </div>
          ) : conversations.length === 0 ? (
            <p className="text-center text-xs text-[var(--text-muted)] py-10">
              {vi ? 'Chưa có cuộc trò chuyện nào.' : 'No conversations yet.'}
            </p>
          ) : (
            conversations.map(conv => {
              const isActive = currentConversation?.id === conv.id;
              return (
                <div
                  key={conv.id}
                  onClick={() => selectConversation(conv.id)}
                  className={`w-full text-left p-3.5 rounded-xl cursor-pointer transition-all flex items-center justify-between border group ${
                    isActive
                      ? 'bg-[var(--gold-glow)]/10 border-[var(--gold)]/30 text-gold font-semibold shadow-sm'
                      : 'bg-transparent border-transparent hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="text-xs font-medium truncate">{conv.title || (vi ? 'Không có tiêu đề' : 'Untitled')}</p>
                    <p className="text-[10px] text-[var(--text-muted)] mt-1.5 font-normal">
                      {new Date(conv.updatedAt).toLocaleDateString(vi ? 'vi-VN' : 'en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleDeleteConversation(e, conv.id)}
                      className="p-1 text-[var(--text-muted)] hover:text-rose-500 rounded-md hover:bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer z-10"
                      title={vi ? 'Xóa lịch sử chat' : 'Delete chat history'}
                    >
                      <Trash2 size={12} />
                    </button>
                    <ChevronRight size={13} className={`opacity-60 transition-transform group-hover:translate-x-0.5 ${isActive ? 'text-gold' : ''}`} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Nút điều khiển AI Memory */}
        <div className="p-3 border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
          <button
            onClick={() => setShowMemoryPanel(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--gold)] hover:bg-[var(--gold-glow)]/5 text-xs text-gold font-semibold transition-all cursor-pointer active:scale-98"
          >
            <Brain size={14} className="text-gold" />
            {vi ? 'Bộ nhớ Cá nhân AI' : 'AI Preferences Memory'}
          </button>
        </div>
      </div>

      {/* ─── KHUNG CHAT CHÍNH ─── */}
      <div className="lg:col-span-3 surface-elevated rounded-2xl flex flex-col overflow-hidden border border-[var(--border-subtle)] relative">
        {showIntroVideo ? (
          <div className="flex-1 min-h-0 bg-white flex flex-col items-center justify-center relative overflow-hidden gap-5 p-6">
            <div className="w-full max-w-3xl aspect-video rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center relative">
              <video
                src={loadingVideo}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover scale-105"
                onEnded={() => setShowIntroVideo(false)}
              />
              {/* Quick skip button inside the video container */}
              <button
                type="button"
                onClick={() => setShowIntroVideo(false)}
                className="absolute bottom-4 right-4 px-4 py-2 bg-black/60 hover:bg-black/80 text-[11px] text-white rounded border border-white/20 hover:border-white/40 transition-all font-semibold uppercase tracking-wider cursor-pointer active:scale-95 backdrop-blur-sm z-10"
              >
                {vi ? 'Bỏ qua ✕' : 'Skip ✕'}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Header chat */}
            <div className="px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]/85 backdrop-blur-md sticky top-0 z-10 flex justify-between items-center flex-wrap gap-3">
              <div className="flex items-center gap-3.5">
                <div className="relative">
                  <div className="w-9 h-9 rounded-xl bg-transparent flex items-center justify-center shadow-sm overflow-hidden border border-[var(--border-subtle)]">
                    <img src={chatbotImg} alt="TravelBot" className="w-full h-full object-cover" />
                  </div>
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[var(--bg-elevated)] absolute -bottom-0.5 -right-0.5 shadow-sm animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                    Terraholic AI Agent
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    {vi ? 'Trợ lý du lịch cá nhân của bạn' : 'Your personal travel companion'}
                  </p>
                </div>
              </div>
              
              {currentConversation && (
                <div className="text-[10px] font-medium text-[var(--text-secondary)] bg-[var(--bg-primary)] px-3 py-1 rounded-full border border-[var(--border-subtle)] shadow-sm">
                  ID: {currentConversation.id.substring(0, 8)}
                </div>
              )}
            </div>

            {/* Nội dung hội thoại */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gradient-to-b from-transparent to-[var(--bg-primary)]/15">
              {loadingConvDetail ? (
                <div className="flex flex-col items-center justify-center h-full space-y-3 py-20">
                  <Loader2 className="animate-spin text-[var(--gold)]" size={32} />
                  <p className="text-xs text-[var(--text-muted)]">{vi ? 'Đang tải lịch sử tin nhắn...' : 'Loading conversation history...'}</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-6 max-w-lg mx-auto py-20 px-4">
                  <div className="relative group mb-4">
                    <div className="w-44 h-44 mx-auto overflow-hidden rounded-3xl bg-transparent flex items-center justify-center animate-bot-sway cursor-pointer transition-transform duration-300 group-hover:scale-102">
                      <img src={chatbotImg} alt="TravelBot" className="w-full h-full object-contain filter drop-shadow-xl" />
                    </div>
                    <div className="absolute top-2 right-4 w-4.5 h-4.5 bg-emerald-500 rounded-full border-2 border-[var(--bg-primary)] animate-ping" />
                    <div className="absolute top-2 right-4 w-4.5 h-4.5 bg-emerald-500 rounded-full border-2 border-[var(--bg-primary)] shadow-sm" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-base font-semibold text-[var(--text-primary)]">
                      {vi ? 'Xin chào! Tôi có thể giúp gì cho bạn?' : 'Hello! How can I help you today?'}
                    </h2>
                    <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto leading-relaxed">
                      {vi
                        ? 'Hãy hỏi tôi về các địa điểm du lịch, món ăn đặc sản, văn hóa địa phương hoặc lịch trình du lịch tùy chỉnh tại Việt Nam.'
                        : 'Ask me about tourist attractions, culinary specialties, local culture, or customized travel itineraries in Vietnam.'}
                    </p>
                  </div>
                  
                  {memory && (
                    <div className="w-full max-w-md p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[11px] text-[var(--text-secondary)] flex items-start gap-2.5 text-left leading-relaxed shadow-sm">
                      <span className="text-sm shrink-0">💡</span>
                      <div>
                        <span className="font-semibold text-gold">{vi ? 'Đã tải sở thích: ' : 'Loaded styles: '}</span>
                        <span className="italic">{memory.travelPreferences?.join(', ') || (vi ? 'phượt' : 'backpacking')}</span>
                      </div>
                    </div>
                  )}
                </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.role === 'user';
              const activeVersion = msg.versions.find(v => v.isActive) || msg.versions[0];
              
              return (
                <div key={msg.id} className={`flex gap-3.5 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
                  
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden border shadow-sm ${
                    isUser
                      ? 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)]'
                      : 'bg-transparent border-transparent'
                  }`}>
                    {isUser ? <User size={14} /> : <img src={chatbotImg} alt="TravelBot" className="w-full h-full object-cover" />}
                  </div>

                  {/* Bubble Container */}
                  <div className="space-y-2 min-w-[120px] max-w-[85%] sm:max-w-xl">
                    <div className={`p-4 rounded-2xl text-xs leading-relaxed transition-all ${
                      isUser
                        ? 'bg-[var(--gold)] text-white border-transparent rounded-2xl rounded-tr-sm shadow-sm'
                        : 'bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-2xl rounded-tl-sm shadow-sm'
                    }`}>
                      {/* Message Content */}
                      <p className="whitespace-pre-line leading-relaxed">{activeVersion?.content || ''}</p>

                      {/* Tool Calls Log */}
                      {!isUser && msg.toolCalls && msg.toolCalls.length > 0 && (
                        <div className="mt-3.5 pt-3 border-t border-[var(--border-subtle)] space-y-2">
                          <p className="text-[9px] font-black uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                            🔧 {vi ? 'Công cụ đã sử dụng:' : 'Tools Triggered:'}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.toolCalls.map(tc => (
                              <div
                                key={tc.id}
                                className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[10px] text-[var(--text-secondary)] shadow-sm"
                                title={`Input: ${tc.input}\nOutput: ${tc.output || 'N/A'}`}
                              >
                                <span>{tc.toolName}</span>
                                {tc.status === 'success' ? (
                                  <CheckCircle2 size={10} className="text-emerald-500" />
                                ) : (
                                  <XCircle size={10} className="text-rose-500" />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Citations */}
                      {!isUser && msg.citations && msg.citations.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-[var(--border-subtle)] space-y-1.5">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <BookOpen size={10} className="text-blue-400" />
                            <span className="text-[9px] font-bold uppercase tracking-wider text-blue-400">
                              {vi ? 'Nguồn tham khảo' : 'Sources'} ({msg.citations.length})
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.citations.slice(0, 3).map((cite) => (
                              <button
                                key={cite.id}
                                onClick={() => setShowCitationModal({ messageId: msg.id, citation: cite })}
                                className="group inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 hover:border-blue-500/30 transition-all text-[10px] text-blue-300 cursor-pointer"
                                title={cite.title}
                              >
                                <span className="font-bold">[{cite.index}]</span>
                                <span className="truncate max-w-[100px]">{cite.title}</span>
                                <ExternalLink size={8} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                              </button>
                            ))}
                            {msg.citations.length > 3 && (
                              <span className="text-[10px] text-blue-400/60 px-1 py-1">
                                +{msg.citations.length - 3} {vi ? 'khác' : 'more'}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Metadata & Controls */}
                    {!isUser && (
                      <div className="flex items-center gap-3.5 text-[10px] text-[var(--text-muted)] px-1">
                        {/* Phiên bản câu trả lời */}
                        {msg.versions.length > 1 && (
                          <span className="font-semibold text-gold">
                            v{activeVersion?.version} / {msg.versions.length}
                          </span>
                        )}

                        {/* Nút Tạo lại câu trả lời */}
                        <button
                          onClick={() => handleRegenerate(msg.id)}
                          className="hover:text-gold flex items-center gap-1 border-none bg-transparent cursor-pointer transition-colors"
                          title={vi ? 'Tạo câu trả lời mới' : 'Regenerate answer'}
                        >
                          <RefreshCw size={10} />
                          {vi ? 'Làm mới' : 'Regenerate'}
                        </button>

                        {/* Đánh giá Feedback */}
                        <button
                          onClick={() => handleOpenFeedback(msg)}
                          className={`hover:text-gold flex items-center gap-1 border-none bg-transparent cursor-pointer transition-colors ${
                            msg.feedback ? 'text-gold font-bold' : ''
                          }`}
                        >
                          <Star size={10} fill={msg.feedback ? 'currentColor' : 'none'} />
                          {msg.feedback
                            ? `${msg.feedback.rating}★`
                            : (vi ? 'Đánh giá AI' : 'Rate Response')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {loadingMsg && (
            <div className="flex gap-3.5 max-w-xl mr-auto animate-pulse">
              <div className="w-8 h-8 rounded-xl bg-transparent flex items-center justify-center flex-shrink-0 overflow-hidden border border-[var(--border-subtle)] shadow-sm">
                <img src={chatbotImg} alt="TravelBot" className="w-full h-full object-cover" />
              </div>
              <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-4 rounded-2xl rounded-tl-sm text-xs flex items-center gap-2 text-[var(--text-muted)] shadow-sm">
                <Loader2 className="animate-spin text-[var(--gold)]" size={14} />
                <span>{vi ? 'AI đang phân tích & soạn câu trả lời...' : 'AI is processing response...'}</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Hộp nhập tin nhắn nổi */}
        <div className="px-4 pb-4 pt-2 bg-gradient-to-t from-[var(--bg-primary)] via-[var(--bg-primary)/90] to-transparent">
          <form
            onSubmit={handleSendMessage}
            className="max-w-5xl mx-auto flex items-center bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl pl-4 pr-1.5 py-1.5 shadow-lg gap-2 focus-within:border-[var(--gold)] focus-within:ring-2 focus-within:ring-[var(--gold-glow)] transition-all duration-200"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              placeholder={vi ? 'Hỏi AI du lịch điều gì đó...' : 'Ask travel AI something...'}
              disabled={loadingMsg}
              className="flex-1 bg-transparent border-none text-sm text-[var(--text-primary)] focus:outline-none placeholder:text-[var(--text-muted)] py-3"
            />
            <button
              type="submit"
              disabled={loadingMsg || !inputMessage.trim()}
              className="bg-[var(--gold)] hover:bg-[var(--gold-dark)] text-white p-2.5 rounded-xl flex items-center justify-center disabled:cursor-not-allowed cursor-pointer hover:scale-105 active:scale-95 transition-all duration-150 shrink-0"
            >
              <Send size={16} className="text-white" />
            </button>
          </form>
        </div>

        {/* ─── MODAL: CHI TIẾT NGUỒN THAM KHẢO (CITATION) ─── */}
        {showCitationModal && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30 flex items-center justify-center p-4">
            <div className="surface-elevated rounded-2xl p-5 border border-[var(--border-subtle)] w-full max-w-lg space-y-3.5 shadow-2xl relative">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center border border-blue-500/20">
                    <BookOpen size={13} className="text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                      {vi ? 'Nguồn tham khảo' : 'Source'} [{showCitationModal.citation.index}]
                    </h3>
                    <span className="text-[10px] text-blue-400 font-medium">
                      {showCitationModal.citation.category} · {vi ? 'Độ phù hợp' : 'Relevance'}: {(showCitationModal.citation.score * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCitationModal(null)}
                  className="p-1 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all cursor-pointer border-none"
                >
                  <XCircle size={16} />
                </button>
              </div>
              
              <div className="space-y-2">
                <p className="text-xs font-semibold text-[var(--text-primary)]">
                  {showCitationModal.citation.title}
                </p>
                
                {/* Source attribution (if available) */}
                {showCitationModal.citation.source && (
                  <p className="text-[10px] text-[var(--text-muted)] italic">
                    {showCitationModal.citation.source}
                    {showCitationModal.citation.url && (
                      <a
                        href={showCitationModal.citation.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-1 underline hover:text-blue-400 transition-colors"
                      >
                        🔗
                      </a>
                    )}
                  </p>
                )}
                
                <div className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl p-3 max-h-48 overflow-y-auto">
                  <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
                    {showCitationModal.citation.content}
                  </p>
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => setShowCitationModal(null)}
                className="w-full py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-xs text-blue-400 font-semibold transition-all cursor-pointer"
              >
                {vi ? 'Đóng' : 'Close'}
              </button>
            </div>
          </div>
        )}

        {/* ─── MODAL: ĐÁNH GIÁ CÂU TRẢ LỜI (FEEDBACK) ─── */}
        {activeFeedbackMsgId && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30 flex items-center justify-center p-4">
            <div className="surface-elevated rounded-2xl p-6 border border-[var(--border-subtle)] w-full max-w-sm space-y-4 shadow-2xl relative">
              <h3 className="font-editorial text-sm font-bold text-cream">
                {vi ? 'Đánh giá câu trả lời của AI' : 'Rate AI Response'}
              </h3>
              <p className="text-[11px] text-[var(--text-muted)]">
                {vi
                  ? 'Ý kiến của bạn sẽ giúp huấn luyện trợ lý ảo phản hồi tốt hơn cho các lần du lịch tiếp theo.'
                  : 'Your feedback will help improve the AI assistant responses.'}
              </p>

              {/* Số Sao */}
              <div className="flex justify-center gap-1.5 py-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFeedbackRating(star)}
                    className="p-1 border-none bg-transparent cursor-pointer text-amber-400 transition-transform hover:scale-110"
                  >
                    <Star
                      size={24}
                      fill={star <= feedbackRating ? 'currentColor' : 'none'}
                    />
                  </button>
                ))}
              </div>

              {/* Comment */}
              <textarea
                value={feedbackComment}
                onChange={e => setFeedbackComment(e.target.value)}
                placeholder={vi ? 'Nhận xét thêm (Không bắt buộc)...' : 'Write comments (Optional)...'}
                rows={3}
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl p-3 text-xs text-cream focus:outline-none focus:border-[var(--gold)] resize-none"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveFeedbackMsgId(null)}
                  className="flex-1 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] hover:text-cream cursor-pointer"
                >
                  {vi ? 'Hủy bỏ' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleSubmitFeedback}
                  className="flex-1 py-2 rounded-xl btn-gold text-xs text-black font-bold cursor-pointer"
                >
                  {vi ? 'Gửi đánh giá' : 'Submit'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── PANEL: BỘ NHỚ CÁ NHÂN (AI PREFERENCES MEMORY) ─── */}
        {showMemoryPanel && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30 flex items-center justify-center p-4">
            <div className="surface-elevated rounded-2xl border border-[var(--border-subtle)] w-full max-w-md shadow-2xl overflow-hidden max-h-[85vh]">
              <MemoryManager
                initialMemory={memory}
                onClose={() => setShowMemoryPanel(false)}
                onMemorySaved={(updated) => {
                  setMemory(updated);
                }}
                onMemoryDeleted={() => {
                  setMemory(null);
                }}
              />
            </div>
          </div>
        )}
        {/* ─── MODAL: XÁC NHẬN XÓA LỊCH SỬ CHAT ─── */}
        {deleteConfirmId && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30 flex items-center justify-center p-4 animate-fadeIn">
            <div className="surface-elevated rounded-2xl p-6 border border-[var(--border-subtle)] w-full max-w-sm space-y-4 shadow-2xl relative">
              <div className="flex items-center gap-3 text-rose-500">
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                  <Trash2 size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[var(--text-primary)]">
                    {vi ? 'Xóa cuộc trò chuyện?' : 'Delete Conversation?'}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-bold uppercase tracking-wider">
                    {vi ? 'Hành động không thể hoàn tác' : 'This action is irreversible'}
                  </p>
                </div>
              </div>

              <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-semibold">
                {vi 
                  ? 'Bạn có chắc chắn muốn xóa vĩnh viễn lịch sử cuộc trò chuyện này không? Toàn bộ tin nhắn và tuyến đường của cuộc hội thoại sẽ bị xóa bỏ.'
                  : 'Are you sure you want to permanently delete this chat history? All messages and route information in this conversation will be cleared.'}
              </p>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] hover:text-white hover:border-slate-400 font-bold cursor-pointer transition-all active:scale-98"
                >
                  {vi ? 'Hủy bỏ' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteConversation}
                  className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-xs text-white font-extrabold cursor-pointer transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Trash2 size={13} />
                  {vi ? 'Xác nhận xóa' : 'Confirm Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
        )}
      </div>
    </div>
  );
}
