import { Undo2, Redo2 } from 'lucide-react';
import { useImageStore } from '@/stores/useImageStore';

export function HistoryPanel() {
  const { history, historyIndex, undo, redo, canUndo, canRedo, jumpToHistory } = useImageStore();

  const actionButton = (enabled: boolean) =>
    `flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
      enabled ? 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700' : 'cursor-not-allowed bg-zinc-800/50 text-zinc-600'
    }`;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button onClick={undo} disabled={!canUndo()} className={actionButton(canUndo())}>
          <Undo2 className="h-4 w-4" />
          Undo
        </button>
        <button onClick={redo} disabled={!canRedo()} className={actionButton(canRedo())}>
          <Redo2 className="h-4 w-4" />
          Redo
        </button>
      </div>

      <div className="space-y-1">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Steps ({history.length})
        </h3>
        {history.map((entry, index) => {
          const isCurrent = index === historyIndex;
          const isFuture = index > historyIndex;
          return (
            <button
              key={entry.id}
              onClick={() => jumpToHistory(index)}
              aria-current={isCurrent}
              className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                isCurrent
                  ? 'border border-violet-500/30 bg-violet-600/20 text-violet-200'
                  : isFuture
                  ? 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-400'
                  : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                  isCurrent ? 'bg-violet-400' : isFuture ? 'bg-zinc-700' : 'bg-zinc-500'
                }`}
              />
              <span className="truncate">{entry.label}</span>
              <span className="ml-auto shrink-0 text-[11px] tabular-nums text-zinc-400">
                {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </button>
          );
        })}
      </div>

      <p className="border-t border-zinc-800 pt-2 text-[11px] text-zinc-400">
        Click any step to jump straight to it. History is kept per image and is not saved when you close the tab.
      </p>
    </div>
  );
}
