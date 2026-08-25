import { useCallback } from 'react';
import { useImageStore } from '@/stores/useImageStore';
import { filterImageFiles, describeRejected, extractFilesFromDataTransfer } from '@/lib/files';

/** Shared drop handling: filter, report what was skipped, then add the rest. */
export function useImageDrop() {
  const addImages = useImageStore((s) => s.addImages);
  const notify = useImageStore((s) => s.notify);

  const acceptFiles = useCallback(
    async (files: Iterable<File>) => {
      const { accepted, rejected } = filterImageFiles(files);
      if (rejected.length > 0) notify('error', describeRejected(rejected));
      if (accepted.length > 0) await addImages(accepted);
      else if (rejected.length === 0) notify('info', 'No image files were found in that drop.');
    },
    [addImages, notify]
  );

  const acceptDataTransfer = useCallback(
    async (dataTransfer: DataTransfer) => {
      const files = await extractFilesFromDataTransfer(dataTransfer);
      await acceptFiles(files);
    },
    [acceptFiles]
  );

  return { acceptFiles, acceptDataTransfer };
}
