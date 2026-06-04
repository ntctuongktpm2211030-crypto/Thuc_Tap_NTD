import type { LucideIcon } from 'lucide-react';

interface SectionHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  accent?: 'gold' | 'sky' | 'violet' | 'emerald' | 'rose' | 'amber';
}

export default function SectionHeader({ icon: Icon, title, subtitle, accent = 'gold' }: SectionHeaderProps) {
  return (
    <div className="modern-section-header">
      <div className={`modern-section-icon modern-section-icon--${accent}`}>
        <Icon size={16} strokeWidth={2} />
      </div>
      <div>
        <h3 className="modern-section-title">{title}</h3>
        {subtitle && <p className="modern-section-subtitle">{subtitle}</p>}
      </div>
    </div>
  );
}
