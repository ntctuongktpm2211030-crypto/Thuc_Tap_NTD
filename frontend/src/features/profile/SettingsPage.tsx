import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Settings, Globe, Bell, Shield, Sliders, Save, Loader2, Plus, X } from 'lucide-react';
import { useLang } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { authService, socialService } from '../../services/smartTravel.service';
import type { RootState } from '../../store';

export default function SettingsPage() {
  const { t, lang, setLang } = useLang();
  const { isDark, toggleTheme } = useTheme();
  const user = useSelector((s: RootState) => s.auth.user);
  const vi = lang === 'vi';

  // ─── Travel Preferences State ─────────────────────────
  const [preferredPace, setPreferredPace] = useState<string>('moderate');
  const [activities, setActivities] = useState<string[]>([]);
  const [destinationTypes, setDestinationTypes] = useState<string[]>([]);
  const [foodPreferences, setFoodPreferences] = useState<string[]>([]);

  const [newActivity, setNewActivity] = useState('');
  const [newDestType, setNewDestType] = useState('');
  const [newFoodPref, setNewFoodPref] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    authService.me()
      .then(data => {
        if (data.preferences) {
          setPreferredPace(data.preferences.preferredPace || 'moderate');
          setActivities(data.preferences.activities || []);
          setDestinationTypes(data.preferences.destinationTypes || []);
          setFoodPreferences(data.preferences.foodPreferences || []);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Fetch preferences failed:', err);
        setLoading(false);
      });
  }, []);

  const handleAddItem = (
    value: string,
    setValue: React.Dispatch<React.SetStateAction<string>>,
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    const trimmed = value.trim();
    if (trimmed && !list.includes(trimmed)) {
      setList([...list, trimmed]);
      setValue('');
    }
  };

  const handleRemoveItem = (
    item: string,
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setList(list.filter(i => i !== item));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await socialService.updatePreferences({
        preferredPace,
        activities,
        destinationTypes,
        foodPreferences,
      });
      setMessage({
        text: vi ? 'Cập nhật sở thích du lịch thành công!' : 'Travel preferences updated successfully!',
        isError: false,
      });
    } catch (err: any) {
      console.error('Update preferences failed:', err);
      setMessage({
        text: vi ? 'Cập nhật sở thích du lịch thất bại.' : 'Failed to update travel preferences.',
        isError: true,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-50/80 dark:bg-slate-950 text-slate-800 dark:text-slate-100 p-4 sm:p-6 lg:p-8 font-sans overflow-hidden animate-fade-in">
      {/* ── Travel Geo-Grid & Pattern Vector Overlay ── */}
      <svg className="absolute inset-0 w-full h-full opacity-25 dark:opacity-10 pointer-events-none" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="travel-grid" width="80" height="80" patternUnits="userSpaceOnUse">
            <circle cx="40" cy="40" r="1.5" className="fill-brand-500/50" />
            <path d="M0 40H80M40 0V80" strokeWidth="0.5" strokeDasharray="6 6" className="stroke-slate-300 dark:stroke-slate-800" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#travel-grid)" />
      </svg>

      {/* ── Background Compass & Flight Arc Vector Artwork ── */}
      <svg className="absolute top-12 right-12 w-96 h-96 opacity-15 dark:opacity-10 text-brand-500 pointer-events-none" viewBox="0 0 200 200" fill="none" stroke="currentColor">
        <circle cx="100" cy="100" r="80" strokeWidth="1" strokeDasharray="6 6" />
        <circle cx="100" cy="100" r="60" strokeWidth="0.5" />
        <path d="M100 10 L100 190 M10 100 L190 100" strokeWidth="1" />
        <polygon points="100,20 108,92 180,100 108,108 100,180 92,108 20,100 92,92" fill="currentColor" opacity="0.2" />
      </svg>

      {/* ── Multi-Layer Vibrant Ambient Glow Mesh ── */}
      <div className="absolute top-10 left-10 w-[700px] h-[700px] bg-gradient-to-tr from-brand-500/20 via-sky-500/15 to-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[500px] right-10 w-[600px] h-[600px] bg-gradient-to-bl from-purple-600/18 via-pink-500/15 to-amber-500/10 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/3 w-[550px] h-[550px] bg-gradient-to-tr from-emerald-500/15 via-teal-500/10 to-transparent rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 space-y-6 max-w-[1750px] mx-auto">
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl space-y-6">
          {/* Section 1: General Settings */}
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <Settings size={24} />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">{t('userMenu.settings')}</h1>
          </div>

        <div className="profile-section-card space-y-4">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <Globe size={18} className="text-[var(--text-muted)]" />
              <span className="text-sm font-semibold">{vi ? 'Ngôn ngữ' : 'Language'}</span>
            </div>
            <div className="flex rounded-full border border-[var(--border-subtle)] overflow-hidden">
              {(['vi', 'en'] as const).map(l => (
                <button key={l} type="button" onClick={() => setLang(l)}
                  className={`px-3 py-1 text-xs font-bold ${lang === l ? 'bg-[var(--gold)] text-black' : 'text-[var(--text-muted)]'}`}>
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between py-2 border-t border-[var(--border-subtle)]">
            <div className="flex items-center gap-3">
              <Bell size={18} className="text-[var(--text-muted)]" />
              <span className="text-sm font-semibold">{vi ? 'Giao diện' : 'Theme'}</span>
            </div>
            <button type="button" onClick={toggleTheme} className="btn-outline text-xs px-3 py-1.5">
              {isDark ? (vi ? 'Sáng' : 'Light') : (vi ? 'Tối' : 'Dark')}
            </button>
          </div>

          <div className="flex items-center justify-between py-2 border-t border-[var(--border-subtle)]">
            <div className="flex items-center gap-3">
              <Shield size={18} className="text-[var(--text-muted)]" />
              <span className="text-sm font-semibold">Email</span>
            </div>
            <span className="text-xs text-[var(--text-muted)]">{user?.email}</span>
          </div>
        </div>

        {/* Section 2: Travel Preferences */}
        <div className="flex items-center gap-3 mt-8 mb-6">
          <Sliders size={22} className="text-[var(--gold)]" />
          <h1 className="text-xl font-bold text-[var(--text-primary)]">
            {vi ? 'Cấu hình sở thích du lịch' : 'Travel Preferences'}
          </h1>
        </div>

        {loading ? (
          <div className="profile-section-card flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-[var(--gold)]" />
          </div>
        ) : (
          <form onSubmit={handleSave} className="profile-section-card space-y-6">
            {message && (
              <div className={`p-3 rounded text-sm font-semibold ${
                message.isError 
                  ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' 
                  : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
              }`}>
                {message.text}
              </div>
            )}

            {/* Preferred Pace */}
            <div>
              <label className="block text-sm font-bold mb-2 text-[var(--text-primary)]">
                {vi ? 'Nhịp độ di chuyển ưa thích' : 'Preferred Pace'}
              </label>
              <div className="flex gap-4">
                {[
                  { value: 'slow', labelVi: 'Chậm rãi (Nghỉ dưỡng)', labelEn: 'Slow (Leisure)' },
                  { value: 'moderate', labelVi: 'Vừa phải (Phổ thông)', labelEn: 'Moderate' },
                  { value: 'fast', labelVi: 'Nhanh (Khám phá nhiều)', labelEn: 'Fast (Exploratory)' }
                ].map(p => (
                  <label key={p.value} className="flex items-center gap-2 text-sm text-[var(--text-secondary)] cursor-pointer">
                    <input
                      type="radio"
                      name="preferredPace"
                      value={p.value}
                      checked={preferredPace === p.value}
                      onChange={() => setPreferredPace(p.value)}
                      className="accent-[var(--gold)]"
                    />
                    <span>{vi ? p.labelVi : p.labelEn}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Destination Types */}
            <div>
              <label className="block text-sm font-bold mb-2 text-[var(--text-primary)]">
                {vi ? 'Loại điểm đến mong muốn' : 'Destination Types'}
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {destinationTypes.map(type => (
                  <span key={type} className="inline-flex items-center gap-1 bg-[var(--border-subtle)] text-[var(--text-primary)] text-xs font-semibold px-2.5 py-1 rounded-full">
                    {type}
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(type, destinationTypes, setDestinationTypes)}
                      className="hover:text-rose-500"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newDestType}
                  onChange={e => setNewDestType(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddItem(newDestType, setNewDestType, destinationTypes, setDestinationTypes);
                    }
                  }}
                  placeholder={vi ? 'Thêm điểm đến (VD: biển, núi...)' : 'Add destination (e.g. beach, mountain...)'}
                  className="flex-1 bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[var(--gold)]"
                />
                <button
                  type="button"
                  onClick={() => handleAddItem(newDestType, setNewDestType, destinationTypes, setDestinationTypes)}
                  className="bg-[var(--gold)] hover:bg-[var(--gold-hover)] text-black px-3 py-1.5 rounded text-sm font-bold flex items-center justify-center"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Activities */}
            <div>
              <label className="block text-sm font-bold mb-2 text-[var(--text-primary)]">
                {vi ? 'Hoạt động yêu thích' : 'Preferred Activities'}
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {activities.map(act => (
                  <span key={act} className="inline-flex items-center gap-1 bg-[var(--border-subtle)] text-[var(--text-primary)] text-xs font-semibold px-2.5 py-1 rounded-full">
                    {act}
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(act, activities, setActivities)}
                      className="hover:text-rose-500"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newActivity}
                  onChange={e => setNewActivity(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddItem(newActivity, setNewActivity, activities, setActivities);
                    }
                  }}
                  placeholder={vi ? 'Thêm hoạt động (VD: leo núi, dã ngoại...)' : 'Add activity (e.g. hiking, shopping...)'}
                  className="flex-1 bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[var(--gold)]"
                />
                <button
                  type="button"
                  onClick={() => handleAddItem(newActivity, setNewActivity, activities, setActivities)}
                  className="bg-[var(--gold)] hover:bg-[var(--gold-hover)] text-black px-3 py-1.5 rounded text-sm font-bold flex items-center justify-center"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Food Preferences */}
            <div>
              <label className="block text-sm font-bold mb-2 text-[var(--text-primary)]">
                {vi ? 'Sở thích ẩm thực' : 'Food Preferences'}
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {foodPreferences.map(food => (
                  <span key={food} className="inline-flex items-center gap-1 bg-[var(--border-subtle)] text-[var(--text-primary)] text-xs font-semibold px-2.5 py-1 rounded-full">
                    {food}
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(food, foodPreferences, setFoodPreferences)}
                      className="hover:text-rose-500"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newFoodPref}
                  onChange={e => setNewFoodPref(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddItem(newFoodPref, setNewFoodPref, foodPreferences, setFoodPreferences);
                    }
                  }}
                  placeholder={vi ? 'Thêm sở thích ăn uống (VD: đồ chay, ăn vặt...)' : 'Add food preference (e.g. vegan, street food...)'}
                  className="flex-1 bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[var(--gold)]"
                />
                <button
                  type="button"
                  onClick={() => handleAddItem(newFoodPref, setNewFoodPref, foodPreferences, setFoodPreferences)}
                  className="bg-[var(--gold)] hover:bg-[var(--gold-hover)] text-black px-3 py-1.5 rounded text-sm font-bold flex items-center justify-center"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t border-[var(--border-subtle)]">
              <button
                type="submit"
                disabled={saving}
                className="btn-gold flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-black"
              >
                {saving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                {vi ? 'Lưu cấu hình' : 'Save Preferences'}
              </button>
            </div>
          </form>
        )}

        <Link to="/profile" className="inline-block mt-6 text-sm font-semibold text-[var(--gold)] hover:underline">
          ← {vi ? 'Về hồ sơ' : 'Back to profile'}
        </Link>
        </div>
      </div>
    </div>
  );
}
