export interface HomeComponentRecord {
  _id: string;
  type: string;
  title: string;
  active: boolean;
  order: number;
  config: Record<string, unknown>;
}

export interface HomeComponentSectionProps {
  config: Record<string, unknown>;
  brandColor: string;
  secondary: string;
  mode: 'single' | 'dual';
  title: string;
}

export interface SnapshotAwareHomeComponentSectionProps extends HomeComponentSectionProps {
  snapshotComponentKey?: string;
}
