/// <reference lib="webworker" />
import { renderToBlob, type PipelineOptions } from '@/lib/pipeline';

export interface WorkerRequest {
  id: number;
  bitmap: ImageBitmap;
  options: PipelineOptions;
}

export type WorkerResponse =
  | { id: number; ok: true; blob: Blob; width: number; height: number }
  | { id: number; ok: false; error: string };

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const { id, bitmap, options } = event.data;
  try {
    const { blob, width, height } = await renderToBlob(bitmap, options);
    const response: WorkerResponse = { id, ok: true, blob, width, height };
    self.postMessage(response);
  } catch (error) {
    const response: WorkerResponse = {
      id,
      ok: false,
      error: error instanceof Error ? error.message : 'Image processing failed',
    };
    self.postMessage(response);
  } finally {
    bitmap.close();
  }
};
