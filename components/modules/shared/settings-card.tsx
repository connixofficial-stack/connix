'use client';

import { Settings, HelpCircle } from 'lucide-react';
import { ToggleSwitch } from './toggle-switch';

const DEFAULT_MAX = 100;
const DEFAULT_MIN = 1;

interface SettingsCardProps {
  children: React.ReactNode;
  title?: string;
  tooltip?: string;
}

export const SettingsCard: React.FC<SettingsCardProps> = ({ 
  children, 
  title = 'Cài đặt',
  tooltip
}) => (
  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4">
    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Settings size={14} className="text-slate-500" />
        <span>{title}</span>
      </div>
      {tooltip && (
        <div className="relative group/tooltip cursor-help flex items-center">
          <HelpCircle size={14} className="text-slate-400 hover:text-slate-600 transition-colors" />
          <div className="absolute bottom-full right-0 mb-2 w-64 p-2.5 bg-slate-900 dark:bg-slate-850 text-white text-[11px] leading-relaxed font-normal rounded shadow-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 z-50 pointer-events-none">
            {tooltip}
            <div className="absolute top-full right-1.5 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-900 dark:border-t-slate-850" />
          </div>
        </div>
      )}
    </h3>
    <div className="space-y-3">
      {children}
    </div>
  </div>
);

interface BaseSettingInputProps {
  label: string;
  focusColor?: string;
  min?: number;
  max?: number;
}

type NumberSettingInputProps = BaseSettingInputProps & {
  type?: 'number';
  value: number;
  onChange: (value: number) => void;
};

type TextSettingInputProps = BaseSettingInputProps & {
  type: 'text';
  value: string;
  onChange: (value: string) => void;
};

type SettingInputProps = NumberSettingInputProps | TextSettingInputProps;

const parseNumberInput = (value: string, minValue: number, maxValue: number): number => {
  if (value === '') {
    return minValue;
  }
  const parsedValue = Number.parseInt(value, 10);
  if (Number.isNaN(parsedValue)) {
    return minValue;
  }
  return Math.max(minValue, Math.min(maxValue, parsedValue));
};

export const SettingInput: React.FC<SettingInputProps> = (props) => {
  const {
    label,
    value,
    focusColor = 'focus:border-cyan-500',
    min = DEFAULT_MIN,
    max = DEFAULT_MAX,
  } = props;
  const type = props.type ?? 'number';

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    if (props.type === 'text') {
      props.onChange(event.target.value);
      return;
    }
    const nextValue = parseNumberInput(event.target.value, min, max);
    props.onChange(nextValue);
  };

  const inputProps: React.InputHTMLAttributes<HTMLInputElement> = {
    className: `w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none ${focusColor}`,
    onChange: handleChange,
    type,
    value,
  };

  if (type === 'number') {
    inputProps.max = max;
    inputProps.min = min;
  }

  return (
    <div>
      <label className="text-xs text-slate-500 mb-1 block">{label}</label>
      <input {...inputProps} />
    </div>
  );
};

interface SettingSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  focusColor?: string;
}

interface SettingTextareaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  focusColor?: string;
}

export const SettingSelect: React.FC<SettingSelectProps> = ({
  label,
  value,
  onChange,
  options,
  focusColor = 'focus:border-cyan-500'
}) => (
  <div>
    <label className="text-xs text-slate-500 mb-1 block">{label}</label>
    <select 
      value={value}
      onChange={(event) =>{  onChange(event.target.value); }}
      className={`w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none ${focusColor}`}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  </div>
);

export const SettingTextarea: React.FC<SettingTextareaProps> = ({
  label,
  value,
  onChange,
  rows = 6,
  focusColor = 'focus:border-cyan-500',
}) => (
  <div>
    <label className="text-xs text-slate-500 mb-1 block">{label}</label>
    <textarea
      value={value}
      rows={rows}
      onChange={(event) => onChange(event.target.value)}
      className={`w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono outline-none ${focusColor}`}
    />
  </div>
);

interface SettingToggleProps {
  label: string;
  value: boolean;
  onChange: () => void;
  description?: string;
  onHelpClick?: () => void;
}

export const SettingToggle: React.FC<SettingToggleProps> = ({
  label,
  value,
  onChange,
  description,
  onHelpClick,
}) => (
  <div className="flex items-center justify-between gap-4">
    <div>
      <div className="flex items-center gap-1.5">
        <p className="text-xs text-slate-600 dark:text-slate-300">{label}</p>
        {onHelpClick && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onHelpClick();
            }}
            className="text-slate-400 hover:text-cyan-500 transition-colors p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Xem hướng dẫn chi tiết"
          >
            <HelpCircle size={13} />
          </button>
        )}
      </div>
      {description && (
        <p className="text-xs text-slate-400 mt-1">{description}</p>
      )}
    </div>
    <ToggleSwitch enabled={value} onChange={onChange} />
  </div>
);
