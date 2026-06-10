export interface SpeedDialAction {
  id: string | number;
  icon: string;
  label: string;
  url: string;
  bgColor: string;
}

export type SpeedDialStyle = 'fab' | 'sidebar' | 'pills' | 'stack' | 'dock' | 'minimal' | 'builder-bar';

export type SpeedDialPosition = 'bottom-right' | 'bottom-left';

export type SpeedDialBrandMode = 'single' | 'dual';

export interface SpeedDialConfig {
  actions: SpeedDialAction[];
  style: SpeedDialStyle;
  position: SpeedDialPosition;
  defaultOpen: boolean;
  showOnAllPages: boolean;
  enableShadow: boolean;
}
