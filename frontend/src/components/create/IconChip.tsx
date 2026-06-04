import type { LucideIcon } from 'lucide-react';

interface IconChipProps {
  icon: LucideIcon;
  label: string;
  selected?: boolean;
  onClick?: () => void;
  accent?: string;
  className?: string;
}

export default function IconChip({ icon: Icon, label, selected, onClick, accent = 'gold', className = '' }: IconChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`icon-chip icon-chip--${accent} ${selected ? 'icon-chip--selected' : ''} ${className}`}
    >
      <span className="icon-chip-icon">
        <Icon size={16} strokeWidth={2} />
      </span>
      <span className="icon-chip-label">{label}</span>
    </button>
  );
}
