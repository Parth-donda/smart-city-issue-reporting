import React from 'react';
import { Check } from 'lucide-react';

export interface StepItem {
  id: string | number;
  label?: string;
  title?: string;
  description?: string;
  timestamp?: string;
}

export type Step = StepItem;
export type StepperProps = HorizontalStepperProps;

export interface HorizontalStepperProps {
  steps: StepItem[];
  currentStep: number; // 0-indexed
  onStepClick?: (stepIndex: number) => void;
  className?: string;
}

export const HorizontalStepper: React.FC<HorizontalStepperProps> = ({
  steps,
  currentStep,
  onStepClick,
  className = '',
}) => {
  return (
    <div className={`w-full flex items-center justify-between ${className}`}>
      {steps.map((step, idx) => {
        const isCompleted = idx < currentStep;
        const isActive = idx === currentStep;
        const isUpcoming = idx > currentStep;

        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              <button
                type="button"
                disabled={!onStepClick || isUpcoming}
                onClick={() => onStepClick && onStepClick(idx)}
                className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-semibold transition-all duration-150 ${
                  isCompleted
                    ? 'bg-primary-700 text-card'
                    : isActive
                    ? 'bg-primary-100 text-primary-700 ring-2 ring-primary-700 ring-offset-2'
                    : 'bg-surface text-ink-300 border border-line'
                } ${onStepClick && !isUpcoming ? 'cursor-pointer' : 'cursor-default'}`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : idx + 1}
              </button>
              <span
                className={`text-xs mt-2 font-medium max-w-[80px] text-center truncate ${
                  isActive ? 'text-primary-700 font-semibold' : isCompleted ? 'text-ink-950' : 'text-ink-300'
                }`}
              >
                {step.label || step.title}
              </span>
            </div>

            {idx < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 -mt-5 transition-colors duration-150 ${
                  idx < currentStep ? 'bg-primary-700' : 'bg-line'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export const Stepper = HorizontalStepper;

export interface TimelineProps {
  items: StepItem[];
  className?: string;
}

export const VerticalTimeline: React.FC<TimelineProps> = ({ items, className = '' }) => {
  return (
    <div className={`relative pl-6 space-y-6 ${className}`}>
      {/* Vertical Track Line */}
      <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-line" />

      {items.map((item, idx) => (
        <div key={item.id} className="relative flex items-start gap-4">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center -ml-[35px] border-2 bg-card ${
              idx === 0
                ? 'border-primary-700 text-primary-700'
                : 'border-line text-ink-500'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-primary-700' : 'bg-ink-300'}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <h4 className="text-sm font-semibold text-ink-950">{item.title}</h4>
              {item.timestamp && (
                <span className="font-mono text-xs text-ink-500">{item.timestamp}</span>
              )}
            </div>
            {item.description && (
              <p className="text-xs text-ink-500 mt-1">{item.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

