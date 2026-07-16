import { Check, BookOpen, Camera, MapPin, Calendar, Eye, Route } from 'lucide-react';

interface JourneyProgressSidebarProps {
  current: number;
  completion: { label: string; done: boolean }[];
  percent: number;
}

const STEP_METAS = [
  { id: 1, label: 'Kiểu hiển thị', icon: BookOpen },
  { id: 2, label: 'Media', icon: Camera },
  { id: 3, label: 'Vị trí', icon: MapPin },
  { id: 4, label: 'Lịch trình', icon: Calendar },
  { id: 5, label: 'Xem trước', icon: Eye },
];

export default function JourneyProgressSidebar({ current, completion, percent }: JourneyProgressSidebarProps) {
  // Circular progress math
  const radius = 42;
  const stroke = 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="journey-sidebar-modern select-none">
      {/* Circular Progress Wheel */}
      <div className="sidebar-section flex flex-col items-center justify-center mb-4">
        <div className="relative flex items-center justify-center">
          <svg className="w-28 h-28 transform -rotate-90">
            {/* Background Circle */}
            <circle
              cx="56"
              cy="56"
              r={radius}
              className="text-slate-100"
              strokeWidth={stroke}
              stroke="currentColor"
              fill="transparent"
            />
            {/* Foreground Circle */}
            <circle
              cx="56"
              cy="56"
              r={radius}
              className="text-[var(--gold)] transition-all duration-500 ease-out"
              strokeWidth={stroke}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
            />
          </svg>
          {/* Inner Content */}
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bước</span>
            <span className="text-2xl font-black text-slate-800 leading-none my-0.5">{current}</span>
            <span className="text-[9px] font-semibold text-slate-500">{percent}% hoàn thành</span>
          </div>
        </div>
      </div>

      {/* Stepper Timeline */}
      <div className="sidebar-section mb-4">
        <h4 className="sidebar-title flex items-center gap-1.5 mb-3">
          <Route size={13} className="text-[var(--gold)]" /> Các bước tiến hành
        </h4>
        <div className="relative pl-3 space-y-4">
          {/* Timeline Line */}
          <div className="absolute left-6 top-2 bottom-2 w-0.5 bg-slate-200/80" />

          {STEP_METAS.map((s) => {
            const Icon = s.icon;
            const done = current > s.id;
            const active = current === s.id;

            return (
              <div key={s.id} className="relative flex items-center gap-3">
                {/* Timeline Dot/Icon */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center z-10 transition-all duration-300 ${
                    done
                      ? 'bg-emerald-500 text-white shadow-sm ring-4 ring-emerald-500/10'
                      : active
                      ? 'bg-[var(--gold)] text-white shadow-sm ring-4 ring-blue-500/20 scale-105'
                      : 'bg-white border-2 border-slate-200 text-slate-400'
                  }`}
                >
                  {done ? <Check size={12} strokeWidth={3} /> : <Icon size={12} strokeWidth={active ? 2.5 : 2} />}
                </div>
                {/* Label */}
                <span
                  className={`text-xs font-semibold transition-colors duration-200 ${
                    active ? 'text-slate-900 font-extrabold' : done ? 'text-slate-600' : 'text-slate-400'
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Checklist */}
      <div className="sidebar-section">
        <h4 className="sidebar-title flex items-center gap-1.5 mb-3">
          <Check size={13} className="text-emerald-500" strokeWidth={2.5} /> Checklist tiến trình
        </h4>
        <ul className="space-y-2">
          {completion.map((item) => (
            <li key={item.label} className="flex items-center gap-2 text-xs">
              <div
                className={`w-4 h-4 rounded flex items-center justify-center transition-all ${
                  item.done
                    ? 'bg-emerald-500 text-white'
                    : 'border-2 border-slate-200 bg-white'
                }`}
              >
                {item.done && <Check size={10} strokeWidth={3} />}
              </div>
              <span
                className={`transition-colors ${
                  item.done ? 'text-slate-500 line-through' : 'text-slate-600 font-medium'
                }`}
              >
                {item.label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
