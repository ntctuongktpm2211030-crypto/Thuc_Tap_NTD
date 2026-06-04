import { LayoutGrid, Type, Palette, Square } from 'lucide-react';
import {
  POST_LAYOUT_PRESETS,
  TYPOGRAPHY_OPTIONS,
  THEME_OPTIONS,
  CARD_SHAPE_OPTIONS,
  type PostStyleSettings,
  type PostLayoutId,
  syncStyleToDisplayType,
} from '../../config/postStylePresets';

interface Props {
  style: PostStyleSettings;
  requestFeatured: boolean;
  onChange: (updates: Partial<PostStyleSettings> & { displayType?: import('../../utils/feedUtils').PostDisplayType; requestFeatured?: boolean }) => void;
}

export default function PostStyleCustomizer({ style, requestFeatured, onChange }: Props) {
  const pickLayout = (layoutId: PostLayoutId) => {
    const synced = syncStyleToDisplayType(layoutId, { requestFeatured });
    onChange({ layoutId, ...synced });
  };

  return (
    <div className="post-style-customizer space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <LayoutGrid size={15} className="text-[var(--gold)]" />
          <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Dạng bài đăng</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {POST_LAYOUT_PRESETS.map(layout => {
            const selected = style.layoutId === layout.id;
            return (
              <button
                key={layout.id}
                type="button"
                onClick={() => pickLayout(layout.id)}
                className={`text-left p-3 rounded-xl border-2 transition-all ${
                  selected
                    ? 'border-[var(--gold)] bg-[var(--gold-glow)]'
                    : 'border-[var(--border-subtle)] hover:border-[var(--gold)]/50 bg-[var(--bg-elevated)]'
                }`}
              >
                <p className="text-xs font-bold text-[var(--text-primary)]">{layout.label}</p>
                {layout.authorRef && (
                  <p className="text-[9px] text-[var(--gold)] font-semibold mt-0.5">{layout.authorRef}</p>
                )}
                <p className="text-[10px] text-[var(--text-muted)] mt-1 leading-snug">{layout.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Type size={15} className="text-[var(--gold)]" />
          <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Kiểu chữ</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {TYPOGRAPHY_OPTIONS.map(typo => (
            <button
              key={typo.id}
              type="button"
              onClick={() => onChange({ typography: typo.id })}
              className={`px-3 py-2 rounded-xl border text-left transition-all ${
                style.typography === typo.id
                  ? 'border-[var(--gold)] bg-[var(--gold-glow)]'
                  : 'border-[var(--border-subtle)] hover:border-[var(--gold)]/40'
              }`}
            >
              <span className="text-xs font-bold text-[var(--text-primary)] block">{typo.label}</span>
              <span className="text-[10px] text-[var(--text-muted)]">{typo.sample}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Palette size={15} className="text-[var(--gold)]" />
          <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Phong cách màu</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {THEME_OPTIONS.map(theme => (
            <button
              key={theme.id}
              type="button"
              title={theme.label}
              onClick={() => onChange({ theme: theme.id })}
              className={`flex items-center gap-2 px-3 py-2 rounded-full border transition-all ${
                style.theme === theme.id
                  ? 'border-[var(--gold)] bg-[var(--gold-glow)]'
                  : 'border-[var(--border-subtle)] hover:border-[var(--border-normal)]'
              }`}
            >
              <span
                className="w-4 h-4 rounded-full ring-2 ring-white/20"
                style={{ backgroundColor: theme.color }}
              />
              <span className="text-xs font-semibold text-[var(--text-secondary)]">{theme.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Square size={15} className="text-[var(--gold)]" />
          <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Bo góc thẻ</p>
        </div>
        <div className="flex gap-2">
          {CARD_SHAPE_OPTIONS.map(shape => (
            <button
              key={shape.id}
              type="button"
              onClick={() => onChange({ cardShape: shape.id })}
              className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition-all ${
                style.cardShape === shape.id
                  ? 'border-[var(--gold)] bg-[var(--gold-glow)] text-[var(--gold)]'
                  : 'border-[var(--border-subtle)] text-[var(--text-muted)]'
              }`}
            >
              {shape.label}
            </button>
          ))}
        </div>
      </div>

      {style.layoutId === 'hero' && (
        <label className="flex items-start gap-3 p-3 rounded-xl border border-amber-500/30 bg-amber-500/8 cursor-pointer">
          <input
            type="checkbox"
            checked={requestFeatured}
            onChange={e => onChange({ requestFeatured: e.target.checked })}
            className="mt-0.5 accent-amber-500"
          />
          <span className="text-xs text-[var(--text-secondary)]">Editor&apos;s Pick — hiển thị như bài nổi bật Minh Quân</span>
        </label>
      )}
    </div>
  );
}
