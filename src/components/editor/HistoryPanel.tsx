import { Undo2, Redo2, Clock } from 'lucide-react';
import { useImageStore } from '@/stores/useImageStore';

export function HistoryPanel() {
  const { history, historyIndex, undo, redo, canUndo, canRedo } = useImageStore();

  return (
    <div className="space-y-3">
      {/* Undo / Redo buttons */}
      <div className="flex gap-2">
        <button
          onClick={undo}
          disabled={!canUndo()}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            canUndo()
              ? 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
              : 'bg-zinc-800/50 text-zinc-600 cursor-not-allowed'
          }`}
        >
          <Undo2 className="w-4 h-4" />
          Undo
        </button>
        <button
          onClick={redo}
          disabled={!canRedo()}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            canRedo()
              ? 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
              : 'bg-zinc-800/50 text-zinc-600 cursor-not-allowed'
          }`}
        >
          <Redo2 className="w-4 h-4" />
          Redo
        </button>
      </div>

      {/* History list */}
      {history.length === 0 ? (
        <div className="text-center py-6">
          <Clock className="w-5 h-5 text-zinc-600 mx-auto mb-2" />
          <p className="text-xs text-zinc-500">No history yet</p>
          <p className="text-[10px] text-zinc-600 mt-1">Edits will appear here</p>
        </div>
      ) : (
        <div className="space-y-1">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
            History ({history.length})
          </h3>
          {history.map((entry, idx) => (
            <div
              key={entry.id}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors ${
                idx === historyIndex
                  ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                  : idx > historyIndex
                  ? 'text-zinc-600'
                  : 'text-zinc-400 hover:bg-zinc-800/50'
              }`}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  idx === historyIndex
                    ? 'bg-violet-400'
                    : idx > historyIndex
                    ? 'bg-zinc-700'
                    : 'bg-zinc-500'
                }`}
              />
              <span className="truncate">{entry.label}</span>
              <span className="text-[9px] text-zinc-600 ml-auto shrink-0">
                {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Keyboard hints */}
      <div className="text-[10px] text-zinc-600 space-y-0.5 pt-2 border-t border-zinc-800">
        <p>Ctrl+Z to undo, Ctrl+Shift+Z to redo</p>
      </div>
    </div>
  );
}
