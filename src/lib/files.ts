import { ACCEPTED_EXTENSIONS, ACCEPTED_IMAGE_TYPES } from '@/lib/constants';

const EXTENSION_SET = new Set(ACCEPTED_EXTENSIONS.split(',').map((ext) => ext.trim().toLowerCase()));

/**
 * Files dropped from a folder — and some files on Linux — arrive with an empty
 * `type`, so fall back to the extension instead of silently discarding them.
 */
export function isSupportedImage(file: File): boolean {
  if (file.type && ACCEPTED_IMAGE_TYPES.includes(file.type)) return true;
  if (file.type && file.type.startsWith('image/')) return true;
  const dot = file.name.lastIndexOf('.');
  if (dot === -1) return false;
  return EXTENSION_SET.has(file.name.slice(dot).toLowerCase());
}

export interface FileFilterResult {
  accepted: File[];
  rejected: string[];
}

export function filterImageFiles(files: Iterable<File>): FileFilterResult {
  const accepted: File[] = [];
  const rejected: string[] = [];
  for (const file of files) {
    // Skip macOS/Windows folder metadata rather than reporting it as an error.
    if (file.name === '.DS_Store' || file.name === 'Thumbs.db') continue;
    if (isSupportedImage(file)) accepted.push(file);
    else rejected.push(file.name);
  }
  return { accepted, rejected };
}

export function describeRejected(rejected: string[]): string {
  if (rejected.length === 1) return `"${rejected[0]}" isn't a supported image format.`;
  return `${rejected.length} files were skipped — unsupported formats.`;
}

/** Opens the native picker without needing a rendered <input> to hang a ref on. */
export function openFilePicker(options: { directory?: boolean } = {}): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    if (options.directory) input.setAttribute('webkitdirectory', '');
    else input.accept = ACCEPTED_EXTENSIONS;
    input.style.display = 'none';

    const cleanup = () => {
      input.remove();
    };

    input.addEventListener('change', () => {
      resolve(Array.from(input.files ?? []));
      cleanup();
    });
    // `cancel` is not universally supported; the input is removed on change too.
    input.addEventListener('cancel', () => {
      resolve([]);
      cleanup();
    });

    document.body.appendChild(input);
    input.click();
  });
}

async function readEntryRecursive(entry: FileSystemEntry, depth = 0): Promise<File[]> {
  if (depth > 8) return []; // guard against pathological nesting
  if (entry.isFile) {
    return new Promise((resolve) => {
      (entry as FileSystemFileEntry).file(
        (file) => resolve([file]),
        () => resolve([])
      );
    });
  }
  if (entry.isDirectory) {
    const reader = (entry as FileSystemDirectoryEntry).createReader();
    // readEntries returns at most 100 entries per call, so keep reading until
    // it comes back empty or the whole directory has been walked.
    const entries: FileSystemEntry[] = [];
    for (;;) {
      const batch = await new Promise<FileSystemEntry[]>((resolve) => {
        reader.readEntries(
          (result) => resolve(result),
          () => resolve([])
        );
      });
      if (batch.length === 0) break;
      entries.push(...batch);
    }
    const nested = await Promise.all(entries.map((child) => readEntryRecursive(child, depth + 1)));
    return nested.flat();
  }
  return [];
}

/** Pulls files out of a drop, walking into folders when the browser allows it. */
export async function extractFilesFromDataTransfer(dataTransfer: DataTransfer): Promise<File[]> {
  const items = dataTransfer.items;
  if (items?.length) {
    const entries: FileSystemEntry[] = [];
    for (let i = 0; i < items.length; i++) {
      const entry = items[i].webkitGetAsEntry?.();
      if (entry) entries.push(entry);
    }
    if (entries.length > 0) {
      const files = (await Promise.all(entries.map((entry) => readEntryRecursive(entry)))).flat();
      if (files.length > 0) return files;
    }
  }
  return Array.from(dataTransfer.files);
}

/** True when a drag is carrying files rather than, say, selected page text. */
export function dragHasFiles(dataTransfer: DataTransfer | null): boolean {
  if (!dataTransfer) return false;
  return Array.from(dataTransfer.types).includes('Files');
}
