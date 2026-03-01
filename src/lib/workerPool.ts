/**
 * Worker pool for concurrent image processing.
 * Feature-detects OffscreenCanvas and falls back to main-thread processing.
 */

import type { ProcessOptions, WorkerRequest, WorkerResponse } from '@/types/worker';

interface PendingTask {
  id: string;
  resolve: (result: { blob: Blob; width: number; height: number }) => void;
  reject: (error: Error) => void;
  onProgress?: (progress: number) => void;
}

interface QueuedWork {
  request: WorkerRequest;
  transferables: Transferable[];
  resolve: (result: { blob: Blob; width: number; height: number }) => void;
  reject: (error: Error) => void;
  onProgress?: (progress: number) => void;
}

export const supportsOffscreenCanvas = typeof OffscreenCanvas !== 'undefined';

let poolInstance: WorkerPoolInstance | null = null;

interface WorkerPoolInstance {
  process: (
    imageBitmap: ImageBitmap,
    options: ProcessOptions,
    onProgress?: (progress: number) => void,
    watermarkBitmap?: ImageBitmap | null
  ) => Promise<{ blob: Blob; width: number; height: number }>;
  terminate: () => void;
}

function createWorkerPool(): WorkerPoolInstance {
  const poolSize = Math.min(navigator.hardwareConcurrency || 2, 4);
  const workers: Worker[] = [];
  const pending = new Map<string, PendingTask>();
  const queue: QueuedWork[] = [];
  const busy = new Set<number>();

  // Create workers
  for (let i = 0; i < poolSize; i++) {
    const worker = new Worker(
      new URL('../workers/imageProcessor.worker.ts', import.meta.url),
      { type: 'module' }
    );

    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const { id, type } = e.data;
      const task = pending.get(id);
      if (!task) return;

      if (type === 'progress' && task.onProgress && e.data.progress !== undefined) {
        task.onProgress(e.data.progress);
      } else if (type === 'result' && e.data.blob) {
        pending.delete(id);
        busy.delete(i);
        task.resolve({ blob: e.data.blob, width: e.data.width!, height: e.data.height! });
        processQueue();
      } else if (type === 'error') {
        pending.delete(id);
        busy.delete(i);
        task.reject(new Error(e.data.error ?? 'Worker processing failed'));
        processQueue();
      }
    };

    worker.onerror = (e) => {
      console.error('Worker error:', e);
      busy.delete(i);
      processQueue();
    };

    workers.push(worker);
  }

  function processQueue(): void {
    while (queue.length > 0) {
      const freeIdx = findFreeWorker();
      if (freeIdx === -1) break;

      const work = queue.shift()!;
      busy.add(freeIdx);
      pending.set(work.request.id, {
        id: work.request.id,
        resolve: work.resolve,
        reject: work.reject,
        onProgress: work.onProgress,
      });
      workers[freeIdx].postMessage(work.request, work.transferables);
    }
  }

  function findFreeWorker(): number {
    for (let i = 0; i < workers.length; i++) {
      if (!busy.has(i)) return i;
    }
    return -1;
  }

  let idCounter = 0;

  return {
    process(
      imageBitmap: ImageBitmap,
      options: ProcessOptions,
      onProgress?: (progress: number) => void,
      watermarkBitmap?: ImageBitmap | null
    ): Promise<{ blob: Blob; width: number; height: number }> {
      return new Promise((resolve, reject) => {
        const id = `wp-${Date.now()}-${idCounter++}`;
        const request: WorkerRequest = {
          id,
          type: 'process',
          imageBitmap,
          watermarkBitmap: watermarkBitmap ?? undefined,
          options,
        };
        const transferables: Transferable[] = [imageBitmap];
        if (watermarkBitmap) transferables.push(watermarkBitmap);

        const work: QueuedWork = { request, transferables, resolve, reject, onProgress };
        queue.push(work);
        processQueue();
      });
    },

    terminate(): void {
      workers.forEach((w) => w.terminate());
      workers.length = 0;
      pending.clear();
      queue.length = 0;
      busy.clear();
    },
  };
}

export function getWorkerPool(): WorkerPoolInstance {
  if (!poolInstance) {
    poolInstance = createWorkerPool();
  }
  return poolInstance;
}

export function terminateWorkerPool(): void {
  if (poolInstance) {
    poolInstance.terminate();
    poolInstance = null;
  }
}
