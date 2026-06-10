'use client';

import type { PreviewDevice } from '../hooks/usePreviewDevice';

type DeviceClasses = {
  mobile: string;
  tablet: string;
  desktop: string;
};

export const getPreviewDeviceClass = (
  device: PreviewDevice,
  classes: DeviceClasses,
) => {
  if (device === 'mobile') {return classes.mobile;}
  if (device === 'tablet') {return classes.tablet;}
  return classes.desktop;
};

export const getPreviewAwareClass = ({
  isPreview,
  device,
  preview,
  site,
}: {
  isPreview: boolean;
  device: PreviewDevice;
  preview: DeviceClasses;
  site: string;
}) => {
  if (!isPreview) {return site;}
  return getPreviewDeviceClass(device, preview);
};
