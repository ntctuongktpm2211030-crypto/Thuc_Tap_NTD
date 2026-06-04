import { Check } from 'lucide-react';
import { JOURNEY_STEPS } from '../../config/modernIcons';

interface JourneyProgressSidebarProps {
  current: number;
  completion: { label: string; done: boolean }[];
  percent: number;
}

export default function JourneyProgressSidebar({ current, completion, percent }: JourneyProgressSidebarProps) {
  return (
    <div className="journey-sidebar">
      <div className="journey-sidebar-card">
        <p className="journey-sidebar-title">Tiến độ hành trình</p>
        <div className="journey-sidebar-progress">
          <div className="journey-sidebar-progress-bar" style={{ width: `${percent}%` }} />
        </div>
        <p className="journey-sidebar-percent">{percent}% hoàn thành</p>
      </div>

      <div className="journey-sidebar-card">
        <p className="journey-sidebar-title">Các bước</p>
        <ul className="journey-sidebar-steps">
          {JOURNEY_STEPS.map(s => {
            const Icon = s.icon;
            const done = current > s.id;
            const active = current === s.id;
            return (
              <li key={s.id} className={`journey-sidebar-step ${done ? 'journey-sidebar-step--done' : ''} ${active ? 'journey-sidebar-step--active' : ''}`}>
                <span className="journey-sidebar-step-icon">
                  {done ? <Check size={14} strokeWidth={2.5} /> : <Icon size={14} strokeWidth={active ? 2.5 : 2} />}
                </span>
                <span>{s.label}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="journey-sidebar-card journey-sidebar-card--checklist">
        <p className="journey-sidebar-title">Checklist</p>
        <ul className="journey-sidebar-checklist">
          {completion.map(item => (
            <li key={item.label} className={item.done ? 'journey-sidebar-check--done' : ''}>
              <span className="journey-sidebar-check-dot">
                {item.done && <Check size={10} strokeWidth={3} />}
              </span>
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
