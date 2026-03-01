import type { FormatOption, AspectRatioPreset, ExportPreset } from '@/types';

export const FORMAT_OPTIONS: FormatOption[] = [
  { value: 'image/jpeg', label: 'JPEG', extension: 'jpg', lossy: true },
  { value: 'image/png', label: 'PNG', extension: 'png', lossy: false },
  { value: 'image/webp', label: 'WebP', extension: 'webp', lossy: true },
  { value: 'image/avif', label: 'AVIF', extension: 'avif', lossy: true },
];

export const ASPECT_RATIO_PRESETS: AspectRatioPreset[] = [
  { label: 'Free', ratio: null },
  { label: '1:1', ratio: 1 },
  { label: '4:3', ratio: 4 / 3 },
  { label: '3:2', ratio: 3 / 2 },
  { label: '16:9', ratio: 16 / 9 },
  { label: '9:16', ratio: 9 / 16 },
  { label: '2:3', ratio: 2 / 3 },
  { label: '3:4', ratio: 3 / 4 },
];

export const SOCIAL_PRESETS: AspectRatioPreset[] = [
  { label: 'Instagram Post', ratio: 1, width: 1080, height: 1080 },
  { label: 'Instagram Story', ratio: 9 / 16, width: 1080, height: 1920 },
  { label: 'Twitter/X Post', ratio: 16 / 9, width: 1200, height: 675 },
  { label: 'Facebook Cover', ratio: 820 / 312, width: 820, height: 312 },
  { label: 'YouTube Thumbnail', ratio: 16 / 9, width: 1280, height: 720 },
  { label: 'LinkedIn Banner', ratio: 1584 / 396, width: 1584, height: 396 },
  { label: 'Pinterest Pin', ratio: 2 / 3, width: 1000, height: 1500 },
];

export const EXPORT_PRESETS: ExportPreset[] = [
  { label: 'Instagram Post', width: 1080, height: 1080, format: 'image/jpeg', quality: 0.85 },
  { label: 'Instagram Story', width: 1080, height: 1920, format: 'image/jpeg', quality: 0.85 },
  { label: 'Twitter/X Post', width: 1200, height: 675, format: 'image/jpeg', quality: 0.85 },
  { label: 'YouTube Thumbnail', width: 1280, height: 720, format: 'image/jpeg', quality: 0.9 },
  { label: 'Favicon', width: 32, height: 32, format: 'image/png', quality: 1 },
  { label: 'OG Image', width: 1200, height: 630, format: 'image/png', quality: 1 },
  { label: 'Web Optimized', width: 1920, height: 1080, format: 'image/webp', quality: 0.8 },
];

export const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/bmp',
  'image/tiff',
  'image/gif',
  'image/svg+xml',
];

export const ACCEPTED_EXTENSIONS = '.jpg,.jpeg,.png,.webp,.avif,.bmp,.tiff,.tif,.gif,.svg';

export const DEFAULT_QUALITY = 0.85;

export const MAX_HISTORY_ENTRIES = 20;
