import React, { useState, useEffect, useCallback } from 'react';
import {
  Brain, Check, Pencil, Trash2, Plus, X, Loader2,
  Utensils, MapPin, Bike, Wallet, Star, AlertTriangle,
  CheckCircle2, XCircle, Save, Coins, Crown,
} from 'lucide-react';

import { chatbotService, AIMemory } from '../../services/smartTravel.service';
import { useLang } from '../../contexts/LanguageContext';

// ─── Types ──────────────────────────────────────────────
type MemoryKey = keyof Pick<AIMemory, 'travelPreferences' | 'favoriteFoods' | 'transportation' | 'favoriteLocations'>;
type MemoryField = MemoryKey | 'budget';

interface MemoryCategoryConfig {
  key: MemoryField;
  icon: React.ReactNode;
  labelVi: string;
  labelEn: string;
  placeholderVi: string;
  placeholderEn: string;
  singularVi: string;
  singularEn: string;
  isArray: boolean;
  options?: { value: string; labelVi: string; labelEn: string }[];
}

interface EditingState {
  field: MemoryField | null;
  index: number | null;
  value: string;
}

interface AddingState {
  field: MemoryField | null;
  value: string;
}

// ─── Helpers ────────────────────────────────────────────
function getEmptyMemory(): AIMemory {
  return {
    id: '',
    userId: '',
    travelPreferences: [],
    favoriteFoods: [],
    budget: 'trung bình',
    transportation: [],
    favoriteLocations: [],
    createdAt: '',
    updatedAt: '',
  };
}

function getCategoryIcon(key: string, size: number = 16) {
  const icons: Record<string, React.ReactNode> = {
    travelPreferences: <Star size={size} />,
    favoriteFoods: <Utensils size={size} />,
    budget: <Wallet size={size} />,
    transportation: <Bike size={size} />,
    favoriteLocations: <MapPin size={size} />,
  };
  return icons[key] || <Brain size={size} />;
}

// ─── Props ──────────────────────────────────────────────
interface MemoryManagerProps {
  /** Initial memory data (can be null if not loaded yet) */
  initialMemory?: AIMemory | null;
  /** Called when the panel should close */
  onClose: () => void;
  /** Called after memory is saved, with updated memory data */
  onMemorySaved?: (memory: AIMemory) => void;
  /** Called after memory is deleted */
  onMemoryDeleted?: () => void;
}

export default function MemoryManager({
  initialMemory,
  onClose,
  onMemorySaved,
  onMemoryDeleted,
}: MemoryManagerProps) {
  const { lang } = useLang();
  const vi = lang === 'vi';

  // ─── State ────────────────────────────────────────────
  const [memory, setMemory] = useState<AIMemory | null>(initialMemory || null);
  const [loading, setLoading] = useState(!initialMemory);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Deep copy for editing so we can track changes
  const [editingMemory, setEditingMemory] = useState<AIMemory | null>(null);

  // Inline editing state
  const [editing, setEditing] = useState<EditingState>({ field: null, index: null, value: '' });
  const [adding, setAdding] = useState<AddingState>({ field: null, value: '' });

  // Delete confirmation
  const [confirmDelete, setConfirmDelete] = useState<{ field: MemoryField; index: number; value: string } | null>(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);

  // ─── Category configs ─────────────────────────────────
  const categories: MemoryCategoryConfig[] = [
    {
      key: 'travelPreferences',
      icon: getCategoryIcon('travelPreferences', 14),
      labelVi: 'Sở thích du lịch',
      labelEn: 'Travel Preferences',
      placeholderVi: 'Thêm sở thích (VD: phượt, trekking)',
      placeholderEn: 'Add preference (e.g., hiking, camping)',
      singularVi: 'sở thích',
      singularEn: 'preference',
      isArray: true,
    },
    {
      key: 'favoriteFoods',
      icon: getCategoryIcon('favoriteFoods', 14),
      labelVi: 'Món ăn yêu thích',
      labelEn: 'Favorite Foods',
      placeholderVi: 'Thêm món ăn (VD: phở, bánh mì)',
      placeholderEn: 'Add food (e.g., pho, banh mi)',
      singularVi: 'món ăn',
      singularEn: 'food',
      isArray: true,
    },
    {
      key: 'transportation',
      icon: getCategoryIcon('transportation', 14),
      labelVi: 'Phương tiện di chuyển',
      labelEn: 'Transportation',
      placeholderVi: 'Thêm phương tiện (VD: xe máy, máy bay)',
      placeholderEn: 'Add transport (e.g., motorbike, plane)',
      singularVi: 'phương tiện',
      singularEn: 'transport',
      isArray: true,
    },
    {
      key: 'favoriteLocations',
      icon: getCategoryIcon('favoriteLocations', 14),
      labelVi: 'Địa điểm yêu thích',
      labelEn: 'Favorite Locations',
      placeholderVi: 'Thêm địa điểm (VD: Hà Giang, Sapa)',
      placeholderEn: 'Add location (e.g., Ha Giang, Sapa)',
      singularVi: 'địa điểm',
      singularEn: 'location',
      isArray: true,
    },
    {
      key: 'budget',
      icon: getCategoryIcon('budget', 14),
      labelVi: 'Ngân sách',
      labelEn: 'Budget',
      placeholderVi: 'Chọn mức ngân sách',
      placeholderEn: 'Select budget level',
      singularVi: 'ngân sách',
      singularEn: 'budget',
      isArray: false,
      options: [
        { value: 'thấp', labelVi: 'Tiết kiệm / Thấp (0 - 3 triệu/ngày)', labelEn: 'Budget / Low (0-3M VND)' },
        { value: 'trung bình', labelVi: 'Phổ thông / Trung bình (3 - 7 triệu/ngày)', labelEn: 'Moderate (3-7M VND/day)' },
        { value: 'cao', labelVi: 'Sang chảnh / Cao (7+ triệu/ngày)', labelEn: 'Luxury / High (7M+ VND/day)' },
      ],
    },
  ];

  // ─── Init from props ──────────────────────────────────
  useEffect(() => {
    if (initialMemory) {
      setMemory(initialMemory);
      setEditingMemory(JSON.parse(JSON.stringify(initialMemory)));
      setLoading(false);
    } else {
      fetchMemory();
    }
  }, [initialMemory]);

  const fetchMemory = async () => {
    setLoading(true);
    try {
      const mem = await chatbotService.LayBoNhoAI();
      setMemory(mem);
      setEditingMemory(JSON.parse(JSON.stringify(mem)));
    } catch {
      // No memory yet — use empty
      setMemory(getEmptyMemory());
      setEditingMemory(getEmptyMemory());
    } finally {
      setLoading(false);
    }
  };

  // ─── Mark changes ─────────────────────────────────────
  const markChanged = useCallback(() => {
    setHasChanges(true);
    setSaveSuccess(false);
    setSaveError('');
  }, []);

  // ─── Array field operations ──────────────────────────
  const deleteArrayItem = (field: MemoryKey, index: number) => {
    if (!editingMemory) return;
    const arr = [...(editingMemory[field] || [])];
    arr.splice(index, 1);
    setEditingMemory({ ...editingMemory, [field]: arr });
    setConfirmDelete(null);
    markChanged();
  };

  const addArrayItem = (field: MemoryKey) => {
    if (!editingMemory || !adding.value.trim()) return;
    const arr = [...(editingMemory[field] || [])];
    arr.push(adding.value.trim());
    setEditingMemory({ ...editingMemory, [field]: arr });
    setAdding({ field: null, value: '' });
    markChanged();
  };

  const saveEditedItem = () => {
    if (!editingMemory || editing.field === null || editing.index === null || !editing.value.trim()) return;
    if (editing.field === 'budget') {
      setEditingMemory({ ...editingMemory, budget: editing.value });
    } else {
      const arr = [...(editingMemory[editing.field as MemoryKey] || [])];
      arr[editing.index] = editing.value.trim();
      setEditingMemory({ ...editingMemory, [editing.field as MemoryKey]: arr });
    }
    setEditing({ field: null, index: null, value: '' });
    markChanged();
  };

  // ─── Save all changes ─────────────────────────────────
  const handleSave = async () => {
    if (!editingMemory) return;
    setSaving(true);
    setSaveError('');
    try {
      const payload = {
        travelPreferences: editingMemory.travelPreferences || [],
        favoriteFoods: editingMemory.favoriteFoods || [],
        budget: editingMemory.budget || 'trung bình',
        transportation: editingMemory.transportation || [],
        favoriteLocations: editingMemory.favoriteLocations || [],
      };
      const updated = await chatbotService.LuuBoNhoAI(payload);
      setMemory(updated);
      setEditingMemory(JSON.parse(JSON.stringify(updated)));
      setHasChanges(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      onMemorySaved?.(updated);
    } catch (err: any) {
      setSaveError(err?.message || (vi ? 'Lưu thất bại' : 'Save failed'));
    } finally {
      setSaving(false);
    }
  };

  // ─── Delete all memory ────────────────────────────────
  const handleDeleteAll = async () => {
    setDeleting(true);
    try {
      await chatbotService.XoaBoNhoAI();
      setMemory(getEmptyMemory());
      setEditingMemory(getEmptyMemory());
      setHasChanges(false);
      setConfirmDeleteAll(false);
      onMemoryDeleted?.();
    } catch {
      // ignore
    } finally {
      setDeleting(false);
    }
  };

  // ─── Get display value for array fields ───────────────
  const getArrayValue = (field: MemoryKey): string[] => {
    return editingMemory?.[field] || [];
  };

  const getBudgetValue = (): string => {
    return editingMemory?.budget || 'trung bình';
  };

  // ─── Count total items ────────────────────────────────
  const totalItems = editingMemory
    ? (editingMemory.travelPreferences?.length || 0) +
      (editingMemory.favoriteFoods?.length || 0) +
      (editingMemory.transportation?.length || 0) +
      (editingMemory.favoriteLocations?.length || 0) +
      (editingMemory.budget ? 1 : 0)
    : 0;

  const arrayCategories = categories.filter(c => c.isArray);
  const budgetCategory = categories.find(c => c.key === 'budget');

  // ─── Render: Loading ──────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="animate-spin text-[var(--gold)]" size={28} />
        <p className="text-xs text-[var(--text-muted)]">
          {vi ? 'Đang tải bộ nhớ AI...' : 'Loading AI Memory...'}
        </p>
      </div>
    );
  }

  // ─── Render: Empty state ──────────────────────────────
  if (!editingMemory || totalItems === 0) {
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center border border-amber-500/20">
              <Brain size={16} className="text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                {vi ? 'Bộ nhớ AI' : 'AI Memory'}
              </h3>
              <p className="text-[10px] text-[var(--text-muted)]">
                {vi ? 'AI sẽ nhớ sở thích của bạn' : 'AI remembers your preferences'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all cursor-pointer border-none"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/10">
            <Brain size={28} className="text-amber-400/60" />
          </div>
          <p className="text-sm text-[var(--text-muted)] text-center max-w-xs leading-relaxed">
            {vi
              ? 'AI chưa ghi nhớ gì về bạn. Hãy trò chuyện với AI để nó hiểu sở thích của bạn, hoặc thêm thủ công bên dưới.'
              : 'AI hasn\'t learned about you yet. Chat with AI to share your preferences, or add them manually below.'}
          </p>
          <button
            type="button"
            onClick={() => {
              setEditingMemory(getEmptyMemory());
              setEditingMemory({
                ...getEmptyMemory(),
                travelPreferences: [],
                favoriteFoods: [],
                transportation: [],
                favoriteLocations: [],
                budget: 'trung bình',
              });
            }}
            className="px-4 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/20 text-xs text-amber-400 font-semibold transition-all cursor-pointer flex items-center gap-2"
          >
            <Plus size={14} />
            {vi ? 'Thêm sở thích thủ công' : 'Add preferences manually'}
          </button>
        </div>
      </div>
    );
  }

  // ─── Render: Main view ────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-[var(--bg-surface)]">
      {/* ── Header ── */}
      <div className="flex items-center justify-between p-5 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]/30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[var(--gold-glow)]/15 flex items-center justify-center border border-[var(--gold)]/20 shadow-sm shadow-[var(--gold-glow)]/10 animate-pulse">
            <Brain size={16} className="text-[var(--gold)]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              {vi ? 'AI Ghi nhớ' : 'AI Remembers'}
              <span className="text-[10px] font-bold text-[var(--gold)] bg-[var(--gold-glow)]/10 border border-[var(--gold)]/20 px-1.5 py-0.5 rounded-full">
                {totalItems} {vi ? 'mục' : 'items'}
              </span>
            </h3>
            <p className="text-[10px] text-[var(--text-muted)] font-medium">
              {vi
                ? 'Những thông tin này được dùng để cá nhân hóa câu trả lời'
                : 'This information personalizes your AI responses'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          {hasChanges && (
            <span className="text-[10px] text-[var(--gold)] font-bold animate-pulse px-2 py-0.5 rounded-full bg-[var(--gold-glow)]/5 border border-[var(--gold)]/10">
              {vi ? 'Chưa lưu' : 'Unsaved'}
            </span>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all cursor-pointer border-none bg-transparent"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pr-1.5">
        {/* ── Success / Error toast ── */}
        {saveSuccess && (
          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400 font-semibold animate-fadeIn">
            <CheckCircle2 size={14} />
            {vi ? 'Đã lưu bộ nhớ thành công!' : 'Memory saved successfully!'}
          </div>
        )}
        {saveError && (
          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-400 font-semibold">
            <XCircle size={14} />
            {saveError}
          </div>
        )}

        {/* ── Lưới 2 cột cho các thuộc tính mảng ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {arrayCategories.map((cat) => {
            const items = getArrayValue(cat.key as MemoryKey);

            return (
              <div
                key={cat.key}
                className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden transition-all hover:border-[var(--border-normal)] shadow-sm hover:shadow-md flex flex-col justify-between"
              >
                {/* Category Header */}
                <div className="flex items-center justify-between px-3.5 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40">
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--gold)] flex items-center">{cat.icon}</span>
                    <span className="text-[11px] font-bold text-[var(--text-primary)] tracking-wide uppercase">
                      {vi ? cat.labelVi : cat.labelEn}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAdding({ field: cat.key as MemoryField, value: '' })}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--gold-glow)]/10 hover:bg-[var(--gold-glow)]/20 text-[10px] text-[var(--gold)] font-bold transition-all border-none cursor-pointer"
                  >
                    <Plus size={10} />
                    {vi ? 'Thêm' : 'Add'}
                  </button>
                </div>

                {/* Category Content */}
                <div className="p-3.5 flex-1 flex flex-col justify-between min-h-[90px]">
                  <div className="space-y-3">
                    {items.length === 0 ? (
                      <p className="text-[11px] text-[var(--text-muted)] italic text-center py-3 bg-[var(--bg-primary)]/30 rounded-xl">
                        {vi ? 'Chưa được ghi nhận' : 'No entries yet'}
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {items.map((item, idx) => {
                          const isThisEditing = editing.field === cat.key && editing.index === idx;
                          if (isThisEditing) {
                            return (
                              <div key={`edit-${idx}`} className="flex items-center gap-1 bg-[var(--bg-primary)] border border-[var(--gold)]/50 pl-2 pr-1 py-0.5 rounded-full text-[11px] animate-pulse">
                                <input
                                  type="text"
                                  value={editing.value}
                                  onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                                  className="bg-transparent border-none text-[11px] text-[var(--text-primary)] focus:outline-none w-16 py-0"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveEditedItem();
                                    if (e.key === 'Escape') setEditing({ field: null, index: null, value: '' });
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={saveEditedItem}
                                  className="p-0.5 rounded-full hover:bg-emerald-500/10 text-emerald-400 border-none cursor-pointer flex items-center justify-center"
                                >
                                  <Check size={10} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditing({ field: null, index: null, value: '' })}
                                  className="p-0.5 rounded-full hover:bg-rose-500/10 text-rose-400 border-none cursor-pointer flex items-center justify-center"
                                >
                                  <X size={10} />
                                </button>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={`tag-${idx}`}
                              className="group flex items-center gap-1 px-2 py-1 rounded-full bg-[var(--bg-primary)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--gold)]/40 text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all shadow-sm"
                            >
                              <span
                                className="cursor-pointer font-semibold hover:text-[var(--gold)] transition-colors select-none truncate max-w-[110px]"
                                onClick={() => setEditing({ field: cat.key, index: idx, value: item })}
                                title={vi ? 'Nhấn để sửa' : 'Click to edit'}
                              >
                                {item}
                              </span>
                              <button
                                type="button"
                                onClick={() => deleteArrayItem(cat.key as MemoryKey, idx)}
                                className="p-0.5 rounded-full hover:bg-rose-500/10 text-[var(--text-muted)] hover:text-rose-500 border-none cursor-pointer transition-colors"
                                title={vi ? 'Xóa' : 'Delete'}
                              >
                                <X size={9} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Inline Add input */}
                  {adding.field === cat.key && (
                    <div className="flex items-center gap-1.5 bg-[var(--bg-primary)] border border-[var(--gold)]/30 rounded-lg pl-2 pr-1 py-1 mt-3 transition-all shadow-inner animate-fadeIn">
                      <input
                        type="text"
                        value={adding.value}
                        onChange={(e) => setAdding({ ...adding, value: e.target.value })}
                        placeholder={vi ? cat.placeholderVi : cat.placeholderEn}
                        className="flex-1 bg-transparent border-none text-[11px] text-[var(--text-primary)] focus:outline-none placeholder:text-[var(--text-muted)] py-0.5"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') addArrayItem(cat.key as MemoryKey);
                          if (e.key === 'Escape') setAdding({ field: null, value: '' });
                        }}
                      />
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => addArrayItem(cat.key as MemoryKey)}
                          disabled={!adding.value.trim()}
                          className="p-1 rounded bg-[var(--gold)] hover:bg-[var(--gold-dark)] disabled:opacity-40 text-white border-none cursor-pointer transition-all active:scale-95 flex items-center justify-center"
                        >
                          <Plus size={10} className="text-white" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setAdding({ field: null, value: '' })}
                          className="p-1 rounded hover:bg-rose-500/10 text-rose-400 border-none cursor-pointer flex items-center justify-center"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Cột riêng cho Ngân sách (Full-width) ── */}
        {budgetCategory && (
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden transition-all hover:border-[var(--border-normal)] shadow-sm hover:shadow-md">
            {/* Category Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40">
              <div className="flex items-center gap-2.5">
                <span className="text-[var(--gold)] flex items-center">{budgetCategory.icon}</span>
                <span className="text-xs font-bold text-[var(--text-primary)] tracking-wide uppercase">
                  {vi ? budgetCategory.labelVi : budgetCategory.labelEn}
                </span>
              </div>
            </div>

            {/* Category Content */}
            <div className="p-4">
              <div className="grid grid-cols-3 gap-3">
                {budgetCategory.options?.map((opt) => {
                  const budgetVal = getBudgetValue();
                  const isSelected = budgetVal === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setEditingMemory(prev => prev ? { ...prev, budget: opt.value } : null);
                        markChanged();
                      }}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer relative overflow-hidden active:scale-95 group/btn ${
                        isSelected
                          ? 'bg-[var(--gold-glow)]/10 border-[var(--gold)] shadow-sm shadow-[var(--gold-glow)]'
                          : 'bg-[var(--bg-primary)] border-[var(--border-subtle)] hover:border-[var(--border-normal)]'
                      }`}
                    >
                      <div className={`mb-1.5 transition-all duration-300 ${isSelected ? 'text-[var(--gold)] scale-110' : 'text-[var(--text-muted)] group-hover/btn:text-[var(--text-secondary)]'}`}>
                        {opt.value === 'thấp' ? <Coins size={16} /> : opt.value === 'trung bình' ? <Wallet size={16} /> : <Crown size={16} />}
                      </div>
                      <span className={`text-[10px] font-bold block ${isSelected ? 'text-[var(--gold)]' : 'text-[var(--text-secondary)]'}`}>
                        {opt.value === 'thấp' ? (vi ? 'Tiết kiệm' : 'Low') : opt.value === 'trung bình' ? (vi ? 'Phổ thông' : 'Moderate') : (vi ? 'Sang chảnh' : 'Luxury')}
                      </span>
                      <span className="text-[8px] text-[var(--text-muted)] mt-1 font-semibold tracking-wider">
                        {opt.value === 'thấp' ? '0-2M' : opt.value === 'trung bình' ? '3-7M' : '7M+'}
                      </span>
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[var(--gold)] shadow-sm shadow-[var(--gold)] animate-pulse" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Memory insights footer ── */}
        {totalItems > 1 && (
          <div className="px-3.5 py-3 rounded-xl bg-gradient-to-r from-[var(--gold-glow)]/10 to-transparent border border-[var(--gold)]/10 text-[10px] text-[var(--text-muted)] leading-relaxed flex items-start gap-2 animate-fadeIn">
            <span className="text-[var(--gold)] font-bold">💡</span>
            <div>
              <span className="font-bold text-[var(--text-primary)]">{vi ? 'Gợi ý cá nhân hóa:' : 'Personalized Tip:'}</span>{' '}
              {vi
                ? 'Trợ lý AI sẽ tự động điều chỉnh lộ trình, ưu tiên gợi ý các điểm đến và món ăn khớp với hồ sơ sở thích của bạn.'
                : 'The AI assistant will customize trip itineraries, prioritizing attractions and local dishes matching your saved memory profile.'}
            </div>
          </div>
        )}
      </div>

      {/* ── Footer: Actions ── */}
      <div className="p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50 space-y-2">
        {/* Delete all memory */}
        {confirmDeleteAll ? (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 animate-fadeIn">
            <AlertTriangle size={14} className="text-rose-400 shrink-0" />
            <span className="flex-1 text-[11px] text-rose-300 font-medium">
              {vi
                ? 'Xóa toàn bộ bộ nhớ AI? AI sẽ quên mọi sở thích của bạn.'
                : 'Delete all AI memory? AI will forget all your preferences.'}
            </span>
            <button
              type="button"
              onClick={handleDeleteAll}
              disabled={deleting}
              className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 text-[10px] font-bold transition-all cursor-pointer border-none disabled:opacity-40 shrink-0"
            >
              {deleting ? <Loader2 size={12} className="animate-spin" /> : vi ? 'Xóa tất cả' : 'Delete all'}
            </button>
            <button
              type="button"
              onClick={() => setConfirmDeleteAll(false)}
              className="px-2.5 py-1 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] text-[10px] font-bold transition-all cursor-pointer border-none bg-transparent shrink-0"
            >
              {vi ? 'Hủy' : 'Cancel'}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[var(--gold)] hover:bg-[var(--gold-dark)] disabled:opacity-40 text-xs font-bold text-white transition-all cursor-pointer active:scale-[0.98] border-none shadow-md shadow-[var(--gold-glow)]/30"
            >
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  {vi ? 'Đang lưu...' : 'Saving...'}
                </>
              ) : (
                <>
                  <Save size={14} />
                  {hasChanges
                    ? (vi ? 'Lưu thay đổi' : 'Save Changes')
                    : (vi ? 'Đã lưu' : 'Saved')}
                </>
              )}
            </button>
            {memory && (
              <button
                type="button"
                onClick={() => setConfirmDeleteAll(true)}
                className="p-2.5 rounded-xl hover:bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:text-rose-300 transition-all cursor-pointer border-none bg-transparent"
                title={vi ? 'Xóa toàn bộ bộ nhớ' : 'Delete all memory'}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

