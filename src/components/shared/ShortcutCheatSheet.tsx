import { useEffect } from 'react';
import { X } from 'lucide-react';

interface ShortcutCheatSheetProps {
  open: boolean;
  onClose: () => void;
}

interface ShortcutGroup {
  title: string;
  shortcuts: { keys: string; description: string }[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'General',
    shortcuts: [
      { keys: 'Ctrl+Z', description: 'Undo' },
      { keys: 'Ctrl+Shift+Z', description: 'Redo' },
      { keys: 'Ctrl+S', description: 'Open Export panel' },
      { keys: 'Ctrl+Shift+S', description: 'Export all as ZIP' },
      { keys: 'Escape', description: 'Close active tool' },
      { keys: 'Delete', description: 'Remove active image' },
      { keys: '?', description: 'Toggle this cheat sheet' },
    ],
  },
  {
    title: 'Tools',
    shortcuts: [
      { keys: 'C', description: 'Crop tool' },
      { keys: 'V', description: 'Resize tool' },
      { keys: 'R', description: 'Rotate tool' },
      { keys: 'E', description: 'Export panel' },
    ],
  },
  {
    title: 'Transform',
    shortcuts: [
      { keys: '[', description: 'Rotate 90° counter-clockwise' },
      { keys: ']', description: 'Rotate 90° clockwise' },
      { keys: 'H', description: 'Flip horizontal' },
      { keys: 'F', description: 'Flip vertical' },
    ],
  },
  {
    title: 'Crop (when active)',
    shortcuts: [
      { keys: 'Arrow keys', description: 'Nudge crop area 1px' },
      { keys: 'Shift + Arrow', description: 'Nudge crop area 10px' },
    ],
  },
];

export function ShortcutCheatSheet({ open, onClose }: ShortcutCheatSheetProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === '?') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-100">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-200 rounded-md hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                {group.title}
              </h3>
              <div className="space-y-1.5">
                {group.shortcuts.map((s) => (
                  <div key={s.keys} className="flex items-center justify-between text-sm">
                    <span className="text-zinc-300">{s.description}</span>
                    <kbd className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-[11px] text-zinc-300 font-mono">
                      {s.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
