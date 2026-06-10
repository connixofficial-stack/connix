'use client';

import React from 'react';

interface ToggleSwitchProps {
  enabled: boolean;
  onChange: () => void;
  disabled?: boolean;
  color?: string;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ 
  enabled, 
  onChange, 
  disabled = false,
  color = 'bg-cyan-500'
}) => {
  let stateClass = 'cursor-pointer';
  if (disabled) {
    stateClass = 'opacity-50 cursor-not-allowed';
  }

  let trackColorClass = color;
  if (!enabled) {
    trackColorClass = 'bg-slate-300 dark:bg-slate-700';
  }

  let knobPositionClass = 'left-0.5';
  if (enabled) {
    knobPositionClass = 'left-5';
  }

  return (
    <button
      type="button"
      onClick={() => !disabled && onChange()}
      disabled={disabled}
      className={`relative w-10 h-5 rounded-full shrink-0 transition-colors ${stateClass} ${trackColorClass}`}
    >
      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${knobPositionClass}`} />
    </button>
  );
};

