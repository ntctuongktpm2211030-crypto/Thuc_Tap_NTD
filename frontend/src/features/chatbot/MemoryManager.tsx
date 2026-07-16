import React, { useState, useEffect, useCallback } from 'react';
import {
  Brain, Check, Pencil, Trash2, Plus, X, Loader2,
  Utensils, MapPin, Bike, Wallet, Star, AlertTriangle,
  CheckCircle2, XCircle, Save,
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
    <div className="flex flex-col h-full">
      {/* ── Header ── */}
      <div className="flex items-center justify-between p-5 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center border border-amber-500/20">
            <Brain size={16} className="text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
              {vi ? 'AI Ghi nhớ' : 'AI Remembers'}
              <span className="text-[10px] font-normal text-[var(--text-muted)] bg-[var(--bg-elevated)] px-1.5 py-0.5 rounded-full">
                {totalItems} {vi ? 'mục' : 'items'}
              </span>
            </h3>
            <p className="text-[10px] text-[var(--text-muted)]">
              {vi
                ? 'Những thông tin này được dùng để cá nhân hóa câu trả lời'
                : 'This information personalizes your AI responses'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {hasChanges && (
            <span className="text-[10px] text-amber-400 font-semibold animate-pulse px-1">
              {vi ? 'Chưa lưu' : 'Unsaved'}
            </span>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all cursor-pointer border-none"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ── Success / Error toast ── */}
        {saveSuccess && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400 font-medium animate-fadeIn">
            <CheckCircle2 size={14} />
            {vi ? 'Đã lưu bộ nhớ thành công!' : 'Memory saved successfully!'}
          </div>
        )}
        {saveError && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-400 font-medium">
            <XCircle size={14} />
            {saveError}
          </div>
        )}

        {categories.map((cat) => {
          const isArray = cat.isArray;
          const isEditing = editing.field === cat.key;
          const isAdding = adding.field === cat.key;
          const items: string[] = isArray
            ? getArrayValue(cat.key as MemoryKey)
            : [getBudgetValue()];
          const isEmpty = items.length === 0 || (cat.key === 'budget' && !items[0]);

          return (
            <div
              key={cat.key}
              className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden transition-all hover:border-[var(--border-normal)]"
            >
              {/* Category header */}
              <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50">
                <div className="flex items-center gap-2">
                  <span className="text-amber-400">{cat.icon}</span>
                  <span className="text-xs font-bold text-[var(--text-primary)]">
                    {vi ? cat.labelVi : cat.labelEn}
                  </span>
                  {isArray && items.length > 0 && (
                    <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-primary)] px-1.5 py-0.5 rounded-full">
                      {items.length}
                    </span>
                  )}
                </div>
                {isArray && (
                  <button
                    type="button"
                    onClick={() => setAdding({ field: cat.key as MemoryField, value: '' })}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-amber-500/10 text-[10px] text-amber-400 font-semibold transition-all cursor-pointer border-none"
                  >
                    <Plus size={12} />
                    {vi ? 'Thêm' : 'Add'}
                  </button>
                )}
              </div>

              {/* Items list */}
              <div className="px-3.5 py-2 space-y-1.5">
                {isEmpty ? (
                  <p className="text-[11px] text-[var(--text-muted)] italic py-2 text-center">
                    {vi ? 'Chưa có thông tin' : 'No information yet'}
                  </p>
                ) : (
                  items.map((item, idx) => {
                    const isThisEditing = isEditing && editing.index === idx;
                    const isConfirmingDelete =
                      confirmDelete?.field === cat.key && confirmDelete?.index === idx;

                    if (isThisEditing) {
                      // ── Inline edit mode ──
                      return (
                        <div key={`edit-${idx}`} className="flex items-center gap-2">
                          {cat.key === 'budget' && cat.options ? (
                            <select
                              value={editing.value}
                              onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                              className="flex-1 bg-[var(--bg-primary)] border border-amber-500/30 rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-amber-400"
                              autoFocus
                            >
                              {cat.options.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {vi ? opt.labelVi : opt.labelEn}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={editing.value}
                              onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                              className="flex-1 bg-[var(--bg-primary)] border border-amber-500/30 rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-amber-400"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveEditedItem();
                                if (e.key === 'Escape') setEditing({ field: null, index: null, value: '' });
                              }}
                            />
                          )}
                          <button
                            type="button"
                            onClick={saveEditedItem}
                            className="p-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 transition-all cursor-pointer border-none"
                            title={vi ? 'Lưu' : 'Save'}
                          >
                            <CheckCircle2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditing({ field: null, index: null, value: '' })}
                            className="p-1.5 rounded-lg hover:bg-rose-500/15 text-rose-400 transition-all cursor-pointer border-none"
                            title={vi ? 'Hủy' : 'Cancel'}
                          >
                            <XCircle size={14} />
                          </button>
                        </div>
                      );
                    }

                    if (isConfirmingDelete) {
                      // ── Delete confirmation ──
                      return (
                        <div
                          key={`confirm-${idx}`}
                          className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[11px]"
                        >
                          <AlertTriangle size={12} className="text-rose-400 shrink-0" />
                          <span className="flex-1 text-rose-300">
                            {vi
                              ? `Xóa "${item}"?`
                              : `Delete "${item}"?`}
                          </span>
                          <button
                            type="button"
                            onClick={() => deleteArrayItem(cat.key as MemoryKey, idx)}
                            className="px-2 py-0.5 rounded-md bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 text-[10px] font-semibold transition-all cursor-pointer border-none"
                          >
                            {vi ? 'Xóa' : 'Delete'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(null)}
                            className="px-2 py-0.5 rounded-md hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] text-[10px] transition-all cursor-pointer border-none"
                          >
                            {vi ? 'Hủy' : 'Cancel'}
                          </button>
                        </div>
                      );
                    }

                    // ── Normal display mode ──
                    return (
                      <div
                        key={`item-${idx}`}
                        className="group flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[var(--bg-elevated)] transition-all"
                      >
                        <Check size={12} className="text-emerald-400 shrink-0" />
                        <span className="flex-1 text-xs text-[var(--text-primary)]">
                          {cat.key === 'budget' && cat.options
                            ? (vi
                                ? cat.options.find((o) => o.value === item)?.labelVi
                                : cat.options.find((o) => o.value === item)?.labelEn) || item
                            : item}
                        </span>

                        {/* Edit button */}
                        <button
                          type="button"
                          onClick={() =>
                            setEditing({ field: cat.key, index: idx, value: item })
                          }
                          className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-amber-500/15 text-amber-400 transition-all cursor-pointer border-none"
                          title={vi ? 'Sửa' : 'Edit'}
                        >
                          <Pencil size={11} />
                        </button>

                        {/* Delete button (not for budget) */}
                        {isArray && (
                          <button
                            type="button"
                            onClick={() => setConfirmDelete({ field: cat.key, index: idx, value: item })}
                            className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-rose-500/15 text-rose-400 transition-all cursor-pointer border-none"
                            title={vi ? 'Xóa' : 'Delete'}
                          >
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}

                {/* ── Add new item input ── */}
                {isAdding && isArray && (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={adding.value}
                      onChange={(e) => setAdding({ ...adding, value: e.target.value })}
                      placeholder={vi ? cat.placeholderVi : cat.placeholderEn}
                      className="flex-1 bg-[var(--bg-primary)] border border-amber-500/30 rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-amber-400"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') addArrayItem(cat.key as MemoryKey);
                        if (e.key === 'Escape') setAdding({ field: null, value: '' });
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => addArrayItem(cat.key as MemoryKey)}
                      disabled={!adding.value.trim()}
                      className="p-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 disabled:opacity-30 transition-all cursor-pointer border-none"
                    >
                      <Plus size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdding({ field: null, value: '' })}
                      className="p-1.5 rounded-lg hover:bg-rose-500/15 text-rose-400 transition-all cursor-pointer border-none"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* ── Memory insights footer ── */}
        {totalItems > 1 && (
          <div className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/5 to-transparent border border-amber-500/10 text-[10px] text-[var(--text-muted)] leading-relaxed">
            <span className="font-semibold text-amber-400">💡 {vi ? 'Mẹo:' : 'Tip:'}</span>{' '}
            {vi
              ? 'AI sẽ tự động gợi ý các địa điểm, món ăn và hoạt động phù hợp với sở thích bạn đã lưu.'
              : 'AI will automatically suggest places, foods, and activities matching your saved preferences.'}
          </div>
        )}
      </div>

      {/* ── Footer: Actions ── */}
      <div className="p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)]/50 space-y-2">
        {/* Delete all memory */}
        {confirmDeleteAll ? (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
            <AlertTriangle size={14} className="text-rose-400 shrink-0" />
            <span className="flex-1 text-[11px] text-rose-300">
              {vi
                ? 'Xóa toàn bộ bộ nhớ AI? AI sẽ quên mọi sở thích của bạn.'
                : 'Delete all AI memory? AI will forget all your preferences.'}
            </span>
            <button
              type="button"
              onClick={handleDeleteAll}
              disabled={deleting}
              className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 text-[10px] font-semibold transition-all cursor-pointer border-none disabled:opacity-40"
            >
              {deleting ? <Loader2 size={12} className="animate-spin" /> : vi ? 'Xóa tất cả' : 'Delete all'}
            </button>
            <button
              type="button"
              onClick={() => setConfirmDeleteAll(false)}
              className="px-2.5 py-1 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] text-[10px] transition-all cursor-pointer border-none"
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
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-xs font-bold text-black disabled:opacity-40 transition-all cursor-pointer active:scale-[0.98] border-none shadow-lg shadow-amber-500/20"
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
                className="p-2.5 rounded-xl hover:bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:text-rose-300 transition-all cursor-pointer border-none"
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
