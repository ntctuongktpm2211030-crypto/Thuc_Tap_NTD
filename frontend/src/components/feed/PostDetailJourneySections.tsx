import {
  Calendar, DollarSign, Users, CloudSun, Star, Tag, Lightbulb, MapPin,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  ACTIVITY_TYPES, MOODS, TRANSPORTS, TIP_CATEGORIES, WEATHER_OPTIONS, RATING_LABELS,
} from '../../config/modernIcons';
import type { JourneyDayView, JourneyTipView, ParsedPostPayload } from '../../utils/feedUtils';

function labelFromOptions(id: string | undefined, options: { id: string; label: string }[]): string {
  if (!id) return '';
  return options.find(o => o.id === id)?.label ?? id;
}

function formatDateRange(dates?: { start?: string; end?: string }): string | null {
  if (!dates?.start && !dates?.end) return null;
  const fmt = (s: string) => {
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return s;
    return d.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  if (dates.start && dates.end) return `${fmt(dates.start)} → ${fmt(dates.end)}`;
  return dates.start ? fmt(dates.start) : dates.end ? fmt(dates.end!) : null;
}

function formatBudget(budget?: { amount?: string; currency?: string }): string | null {
  if (!budget?.amount?.trim()) return null;
  const n = parseFloat(budget.amount);
  const cur =
    budget.currency === 'USD' ? 'USD' :
    budget.currency === 'EUR' ? 'EUR' :
    budget.currency || 'VND';
  const formatted = Number.isFinite(n) ? n.toLocaleString('vi-VN') : budget.amount;
  return `${formatted} ${cur}`;
}

function MetaChip({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <span className="post-detail-meta-chip">
      <Icon size={12} className="flex-shrink-0" />
      {label}
    </span>
  );
}

export function PostDetailMetaRow({ payload }: { payload: ParsedPostPayload }) {
  const dateRange = formatDateRange(payload.dates);
  const budget = formatBudget(payload.budget);
  const mood = labelFromOptions(payload.mood, MOODS);
  const weather = labelFromOptions(payload.weather, WEATHER_OPTIONS);
  const transport = payload.transport
    ?.map(t => labelFromOptions(t, TRANSPORTS))
    .filter(Boolean)
    .join(', ');
  const rating = payload.rating ? RATING_LABELS[payload.rating]?.text : null;

  const chips: { icon: LucideIcon; label: string }[] = [];
  if (dateRange) chips.push({ icon: Calendar, label: dateRange });
  if (budget) chips.push({ icon: DollarSign, label: budget });
  if (payload.companions) chips.push({ icon: Users, label: payload.companions });
  if (transport) chips.push({ icon: MapPin, label: transport });
  if (weather) chips.push({ icon: CloudSun, label: weather });
  if (mood) chips.push({ icon: Star, label: mood });
  if (rating) chips.push({ icon: Star, label: rating });

  if (chips.length === 0) return null;

  return (
    <div className="post-detail-meta-row">
      {chips.map((c, i) => (
        <MetaChip key={i} icon={c.icon} label={c.label} />
      ))}
    </div>
  );
}

export function PostDetailTags({ tags }: { tags: string[] }) {
  if (!tags.length) return null;
  return (
    <div className="post-detail-tags">
      <Tag size={13} className="text-[var(--gold)] flex-shrink-0 mt-0.5" />
      <div className="flex flex-wrap gap-1.5">
        {tags.map(tag => (
          <span key={tag} className="post-detail-tag">{tag}</span>
        ))}
      </div>
    </div>
  );
}

function getActivityIcon(id?: string) {
  return ACTIVITY_TYPES.find(a => a.id === id)?.icon ?? MapPin;
}

function activityTitle(act: JourneyDayView['activities'][0]): string {
  if (act.title?.trim()) return act.title.trim();
  return labelFromOptions(act.icon, ACTIVITY_TYPES) || 'Hoạt động';
}

export function PostDetailItinerary({ days }: { days: JourneyDayView[] }) {
  if (!days.length) return null;

  return (
    <section className="post-detail-itinerary">
      <h3 className="post-detail-section-title">
        <Calendar size={16} className="text-[var(--gold)]" />
        Lịch trình từng ngày
        <span className="post-detail-section-count">{days.length} ngày</span>
      </h3>

      <div className="post-detail-days">
        {days.map((day, dayIdx) => (
          <div key={dayIdx} className="post-detail-day">
            <div className="post-detail-day-header">
              <span className="post-detail-day-num">{day.day || dayIdx + 1}</span>
              <div className="min-w-0">
                <h4 className="post-detail-day-title">{day.title}</h4>
                {day.location && (
                  <p className="post-detail-day-location">
                    <MapPin size={11} /> {day.location}
                  </p>
                )}
              </div>
            </div>

            {day.activities.length > 0 ? (
              <ul className="post-detail-activities">
                {day.activities.map((act, actIdx) => {
                  const ActIcon = getActivityIcon(act.icon);
                  const typeLabel = labelFromOptions(act.icon, ACTIVITY_TYPES);
                  return (
                    <li key={actIdx} className="post-detail-activity">
                      <span className="post-detail-activity-icon" aria-hidden>
                        <ActIcon size={14} strokeWidth={2} />
                      </span>
                      <div className="post-detail-activity-body min-w-0">
                        <div className="post-detail-activity-head">
                          {act.time && (
                            <span className="post-detail-activity-time">{act.time}</span>
                          )}
                          <span className="post-detail-activity-type">{typeLabel}</span>
                          <span className="post-detail-activity-name">{activityTitle(act)}</span>
                          {act.cost?.trim() && (
                            <span className="post-detail-activity-cost">{act.cost}</span>
                          )}
                        </div>
                        {act.description?.trim() && (
                          <p className="post-detail-activity-desc">{act.description}</p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="post-detail-day-empty">Chưa có hoạt động chi tiết cho ngày này.</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export function PostDetailTips({ tips }: { tips: JourneyTipView[] }) {
  const visible = tips.filter(t => t.content?.trim());
  if (!visible.length) return null;

  return (
    <section className="post-detail-tips">
      <h3 className="post-detail-section-title">
        <Lightbulb size={16} className="text-[var(--gold)]" />
        Mẹo du lịch
      </h3>
      <ul className="post-detail-tips-list">
        {visible.map((tip, i) => {
          const cat = TIP_CATEGORIES.find(c => c.id === tip.category);
          const CatIcon = cat?.icon ?? Lightbulb;
          return (
            <li key={tip.id || i} className="post-detail-tip">
              <span className="post-detail-tip-cat">
                <CatIcon size={12} />
                {cat?.label ?? 'Mẹo'}
              </span>
              <p>{tip.content}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
