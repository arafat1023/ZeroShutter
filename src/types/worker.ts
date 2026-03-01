import type { CropData, RotateData, OutputFormat, ColorAdjustments, WatermarkData, BorderData } from './index';

export interface ProcessOptions {
  crop?: CropData | null;
  resizeWidth?: number;
  resizeHeight?: number;
  rotate?: RotateData;
  colorAdjustments?: ColorAdjustments;
  watermark?: WatermarkData | null;
  border?: BorderData | null;
  format: OutputFormat;
  quality: number;
}

export interface WorkerRequest {
  id: string;
  type: 'process';
  imageBitmap: ImageBitmap;
  watermarkBitmap?: ImageBitmap | null;
  options: ProcessOptions;
}

export interface WorkerResponse {
  id: string;
  type: 'result' | 'progress' | 'error';
  blob?: Blob;
  width?: number;
  height?: number;
  progress?: number;
  error?: string;
}
