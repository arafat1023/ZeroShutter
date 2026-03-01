export type OutputFormat = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/avif';

export type FormatLabel = 'JPEG' | 'PNG' | 'WebP' | 'AVIF';

export interface FormatOption {
  value: OutputFormat;
  label: FormatLabel;
  extension: string;
  lossy: boolean;
}

export interface CropData {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ResizeData {
  width: number;
  height: number;
  maintainAspectRatio: boolean;
  mode: 'pixels' | 'percentage';
}

export interface RotateData {
  angle: number;
  flipH: boolean;
  flipV: boolean;
  backgroundColor: string;
}

export interface ColorAdjustments {
  brightness: number;   // -100 to 100
  contrast: number;     // -100 to 100
  saturation: number;   // -100 to 100
  hue: number;          // 0 to 360
  sharpness: number;    // 0 to 100
  preset: ColorPreset | null;
}

export type ColorPreset = 'grayscale' | 'sepia' | 'invert' | 'warm' | 'cool' | 'highContrast' | 'vintage';

export interface WatermarkData {
  type: 'text' | 'image';
  // Text watermark
  text: string;
  fontFamily: string;
  fontSize: number;
  fontColor: string;
  fontOpacity: number;   // 0-1
  bold: boolean;
  italic: boolean;
  rotation: number;
  // Image watermark
  imageUrl: string | null;
  imageOpacity: number;  // 0-1
  // Positioning
  position: WatermarkPosition;
  tiling: boolean;
  tileSpacing: number;
  // Size (% of image width for image watermark)
  scale: number;
}

export type WatermarkPosition =
  | 'top-left' | 'top-center' | 'top-right'
  | 'center-left' | 'center' | 'center-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right';

export interface BorderStroke {
  enabled: boolean;
  width: number;
  color: string;
}

export interface BorderData {
  top: number;
  right: number;
  bottom: number;
  left: number;
  color: string;
  mode: 'solid' | 'blur';
  uniform: boolean;
  stroke: BorderStroke;
}

export interface ExportSettings {
  format: OutputFormat;
  quality: number; // 0-1
}

export interface ImageFile {
  id: string;
  file: File;
  originalUrl: string;
  previewUrl: string;
  width: number;
  height: number;
  name: string;
  size: number;
}

export interface EditState {
  crop: CropData | null;
  resize: ResizeData | null;
  rotate: RotateData;
  colorAdjustments: ColorAdjustments;
  watermark: WatermarkData | null;
  border: BorderData | null;
  exportSettings: ExportSettings;
}

export type ActiveTool =
  | 'crop' | 'resize' | 'rotate'
  | 'color' | 'watermark' | 'border'
  | 'metadata' | 'history'
  | 'export' | null;

export interface HistoryEntry {
  id: string;
  label: string;
  editState: EditState;
  timestamp: number;
}

export interface AspectRatioPreset {
  label: string;
  ratio: number | null; // null = freeform
  width?: number;
  height?: number;
}

export interface ExportPreset {
  label: string;
  width: number;
  height: number;
  format: OutputFormat;
  quality: number;
}

export interface ExifData {
  [key: string]: unknown;
  Make?: string;
  Model?: string;
  LensModel?: string;
  ISO?: number;
  ExposureTime?: number;
  FNumber?: number;
  FocalLength?: number;
  DateTimeOriginal?: string;
  Software?: string;
  latitude?: number;
  longitude?: number;
  GPSLatitude?: number[];
  GPSLongitude?: number[];
  ImageWidth?: number;
  ImageHeight?: number;
  ColorSpace?: number;
}
