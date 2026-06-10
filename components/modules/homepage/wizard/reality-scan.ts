import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { RealitySnapshot } from './types';

export const useHomepageWizardReality = (): RealitySnapshot | undefined => (
  useQuery(api.homepageWizard.getHomepageWizardReality) as RealitySnapshot | undefined
);
