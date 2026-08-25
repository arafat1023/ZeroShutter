import { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useImageStore } from '@/stores/useImageStore';
import type { Notification, NotificationKind } from '@/types';

const AUTO_DISMISS_MS: Record<NotificationKind, number> = {
  success: 3000,
  info: 5000,
  error: 8000,
};

const STYLES: Record<NotificationKind, { icon: typeof Info; className: string }> = {
  success: { icon: CheckCircle2, className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' },
  error: { icon: AlertCircle, className: 'border-red-500/30 bg-red-500/10 text-red-200' },
  info: { icon: Info, className: 'border-violet-500/30 bg-violet-500/10 text-violet-200' },
};

export function Toasts() {
  const notifications = useImageStore((s) => s.notifications);

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-[min(22rem,calc(100vw-2rem))] pointer-events-none"
      role="status"
      aria-live="polite"
    >
      {notifications.map((notification) => (
        <Toast key={notification.id} notification={notification} />
      ))}
    </div>
  );
}

function Toast({ notification }: { notification: Notification }) {
  const dismiss = useImageStore((s) => s.dismissNotification);
  const { icon: Icon, className } = STYLES[notification.kind];

  useEffect(() => {
    const timer = setTimeout(() => dismiss(notification.id), AUTO_DISMISS_MS[notification.kind]);
    return () => clearTimeout(timer);
  }, [notification.id, notification.kind, dismiss]);

  return (
    <div
      className={`pointer-events-auto flex items-start gap-2.5 rounded-lg border px-3 py-2.5 shadow-lg backdrop-blur-sm animate-toast-in ${className}`}
    >
      <Icon className="w-4 h-4 mt-px shrink-0" />
      <p className="flex-1 text-xs leading-relaxed">{notification.message}</p>
      <button
        onClick={() => dismiss(notification.id)}
        aria-label="Dismiss notification"
        className="shrink-0 rounded p-0.5 opacity-60 hover:opacity-100 transition-opacity"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
