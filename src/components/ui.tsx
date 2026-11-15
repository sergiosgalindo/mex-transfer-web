import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  FileEdit,
  Loader2,
  X,
  XCircle,
} from 'lucide-react';
import {
  CheckInStatus,
  EventStatus,
  OrderPaymentStatus,
  ReconciliationPriority,
} from '../types';

export function PaymentStatusBadge({ status }: { status: OrderPaymentStatus }) {
  const map: Record<
    OrderPaymentStatus,
    { label: string; classes: string; icon: React.ReactNode }
  > = {
    paid: {
      label: 'Pagada',
      classes:
        'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60',
      icon: <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />,
    },
    ticket_sent: {
      label: 'Boleto enviado',
      classes:
        'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60',
      icon: <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />,
    },
    pending_payment: {
      label: 'Pendiente de pago',
      classes:
        'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60',
      icon: <Clock className="h-3.5 w-3.5 shrink-0" />,
    },
    expired: {
      label: 'Expirada',
      classes:
        'bg-stone-100 text-stone-600 border-stone-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700',
      icon: <XCircle className="h-3.5 w-3.5 shrink-0" />,
    },
    cancelled: {
      label: 'Cancelada',
      classes:
        'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800/60',
      icon: <XCircle className="h-3.5 w-3.5 shrink-0" />,
    },
    manual_review: {
      label: 'Revisión manual',
      classes:
        'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-800/60',
      icon: <Eye className="h-3.5 w-3.5 shrink-0" />,
    },
  };

  const cfg = map[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${cfg.classes}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

export function CheckInBadge({ status }: { status: CheckInStatus }) {
  const map: Record<CheckInStatus, { label: string; classes: string }> = {
    checked_in: {
      label: 'Validado',
      classes:
        'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
    },
    pending: {
      label: 'Sin ingreso',
      classes:
        'bg-slate-100 text-slate-700 border-slate-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700',
    },
    partial: {
      label: 'Parcial',
      classes:
        'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
    },
    not_applicable: {
      label: 'No aplica',
      classes:
        'bg-slate-50 text-slate-400 border-slate-200 dark:bg-zinc-900 dark:text-zinc-500 dark:border-zinc-800',
    },
  };
  const cfg = map[status];
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap ${cfg.classes}`}
    >
      {cfg.label}
    </span>
  );
}

export function EventStatusBadge({ status }: { status: EventStatus }) {
  const map: Record<
    EventStatus,
    { label: string; classes: string; icon: React.ReactNode }
  > = {
    in_progress: {
      label: 'En curso',
      classes:
        'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60',
      icon: <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />,
    },
    upcoming: {
      label: 'Próximo',
      classes:
        'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800/60',
      icon: <Clock className="h-3 w-3" />,
    },
    sold_out: {
      label: 'Agotado',
      classes:
        'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60',
      icon: <AlertTriangle className="h-3 w-3" />,
    },
    draft: {
      label: 'Borrador',
      classes:
        'bg-slate-100 text-slate-600 border-slate-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700',
      icon: <FileEdit className="h-3 w-3" />,
    },
    finished: {
      label: 'Finalizado',
      classes:
        'bg-stone-100 text-stone-600 border-stone-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700',
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
  };
  const cfg = map[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${cfg.classes}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: ReconciliationPriority }) {
  const map: Record<ReconciliationPriority, { label: string; classes: string }> = {
    high: {
      label: 'Alta',
      classes:
        'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800/60',
    },
    medium: {
      label: 'Media',
      classes:
        'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60',
    },
    low: {
      label: 'Baja',
      classes:
        'bg-slate-100 text-slate-600 border-slate-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700',
    },
  };
  const cfg = map[priority];
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${cfg.classes}`}
    >
      {cfg.label}
    </span>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-slate-200/80 dark:bg-zinc-800/80 ${className}`}
    />
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-zinc-400">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function SlideOverDrawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="fixed inset-0 bg-slate-900/35 backdrop-blur-[1px] transition-opacity dark:bg-black/60"
        onClick={onClose}
      />
      <div className="relative z-10 flex h-full w-full max-w-lg flex-col border-l border-slate-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4 dark:border-zinc-800">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-zinc-100">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400 tabular-nums">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar panel"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-2 focus-visible:outline-emerald-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <div className="border-t border-slate-200 bg-slate-50/70 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900/60">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  destructive = false,
  loading = false,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="alertdialog"
      aria-modal="true"
    >
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px] dark:bg-black/65"
        onClick={onCancel}
      />
      <div className="relative z-10 w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
              destructive
                ? 'bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400'
                : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
            }`}
          >
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
              {title}
            </h3>
            <p className="mt-1.5 text-sm text-slate-600 dark:text-zinc-400">{description}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-emerald-600 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 ${
              destructive
                ? 'bg-red-600 hover:bg-red-700 focus-visible:outline-red-600'
                : 'bg-emerald-600 hover:bg-emerald-700 focus-visible:outline-emerald-600'
            }`}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
