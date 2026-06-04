import { Check } from 'lucide-react';
import { JOURNEY_STEPS } from '../../config/modernIcons';

interface JourneyStepperProps {
  current: number;
}

export default function JourneyStepper({ current }: JourneyStepperProps) {
  return (
    <div className="journey-stepper">
      {JOURNEY_STEPS.map((step, i) => {
        const Icon = step.icon;
        const done = current > step.id;
        const active = current === step.id;
        return (
          <div key={step.id} className="flex items-start flex-1 max-w-[120px]">
            <div className={`journey-step flex-1 ${done ? 'journey-step--done' : ''} ${active ? 'journey-step--active' : ''}`}>
              <div className="journey-step-circle">
                {done ? <Check size={18} strokeWidth={2.5} /> : <Icon size={17} strokeWidth={active ? 2.5 : 2} />}
              </div>
              <span className="journey-step-label">{step.label}</span>
            </div>
            {i < JOURNEY_STEPS.length - 1 && (
              <div className={`journey-step-connector ${current > step.id ? 'journey-step-connector--done' : ''}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
