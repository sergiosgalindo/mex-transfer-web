import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  MessageSquarePlus,
} from 'lucide-react';
import { formatMXN } from '../data/mockData';
import { ReconciliationCase, ReconciliationIssueType } from '../types';
import {
  EmptyState,
  PriorityBadge,
  Skeleton,
  SlideOverDrawer,
} from '../components/ui';

interface ReconciliationPageProps {
  cases: ReconciliationCase[];
  loading: boolean;
  onUpdateCase: (updated: ReconciliationCase) => void;
}

const ISSUE_LABELS: Record<ReconciliationIssueType, string> = {
  late_payment: 'Pago recibido después de expiración',
  amount_mismatch: 'Importe distinto al esperado',
  reference_not_found: 'Referencia no encontrada',
  possible_duplicate: 'Posible pago duplicado',
  ticket_delivery_error: 'Error de envío de boleto',
};

export function ReconciliationPage({
  cases,
  loading,
  onUpdateCase,
}: ReconciliationPageProps) {
  const [selectedCase, setSelectedCase] = useState<ReconciliationCase | null>(null);
  const [noteInput, setNoteInput] = useState('');

  const openCases = cases.filter((c) => c.status !== 'resolved');
  const latePaymentsCount = openCases.filter(
    (c) => c.issueType === 'late_payment'
  ).length;

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase || !noteInput.trim()) return;
    const updated: ReconciliationCase = {
      ...selectedCase,
      internalNotes: [...selectedCase.internalNotes, noteInput.trim()],
    };
    onUpdateCase(updated);
    setSelectedCase(updated);
    setNoteInput('');
  };

  const handleMarkResolved = () => {
    if (!selectedCase) return;
    const updated: ReconciliationCase = {
      ...selectedCase,
      status: 'resolved',
      technicalEvents: [
        ...selectedCase.technicalEvents,
        {
          timestamp: '15:32:00 CST',
          detail: 'Caso marcado como resuelto por Mariana López',
        },
      ],
    };
    onUpdateCase(updated);
    setSelectedCase(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-zinc-100">
          Pagos y conciliación
        </h1>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-zinc-400">
          Control financiero de excepciones CoDi. Ningún pago en revisión se marca como confirmado automáticamente.
        </p>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
              Pagos confirmados (hoy)
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-semibold text-slate-900 tabular-nums dark:text-zinc-100">
            114
          </div>
          <p className="mt-1 text-xs text-slate-500 tabular-nums dark:text-zinc-400">
            {formatMXN(78450)} liquidados
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
              Pagos pendientes
            </span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-semibold text-amber-600 tabular-nums dark:text-amber-400">
            6
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
            En ventana de 15 min
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
              Pagos tardíos
            </span>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </div>
          <div className="mt-2 text-2xl font-semibold text-slate-900 tabular-nums dark:text-zinc-100">
            {latePaymentsCount}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
            Recibidos tras expiración
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
              Casos por revisar
            </span>
            <Eye className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          </div>
          <div className="mt-2 text-2xl font-semibold text-violet-700 tabular-nums dark:text-violet-400">
            {openCases.length}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
            Requieren resolución manual
          </p>
        </div>
      </div>

      {/* Incidents Table */}
      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      ) : openCases.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
          title="Operación al día"
          description="No hay discrepancias ni pagos pendientes de conciliación manual."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-400">
                  <th className="px-4 py-3">Prioridad</th>
                  <th className="px-4 py-3">Incidencia</th>
                  <th className="px-4 py-3">Orden</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3 text-right">Esperado</th>
                  <th className="px-4 py-3 text-right">Recibido</th>
                  <th className="px-4 py-3">Folio CoDi</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {openCases.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedCase(c)}
                    className="cursor-pointer transition-colors hover:bg-slate-50/80 dark:hover:bg-zinc-800/40"
                  >
                    <td className="px-4 py-3.5">
                      <PriorityBadge priority={c.priority} />
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-900 dark:text-zinc-100">
                      {ISSUE_LABELS[c.issueType]}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs tabular-nums text-slate-700 dark:text-zinc-300">
                      {c.orderReference}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="text-slate-900 dark:text-zinc-100">
                        {c.customerName}
                      </div>
                      <div className="text-xs text-slate-500 tabular-nums dark:text-zinc-400">
                        {c.customerPhone}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right tabular-nums text-slate-600 dark:text-zinc-400">
                      {formatMXN(c.expectedMxn)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-semibold tabular-nums text-slate-900 dark:text-zinc-100">
                      {formatMXN(c.receivedMxn)}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs tabular-nums text-slate-600 dark:text-zinc-400">
                      {c.codiFolio}
                    </td>
                    <td className="px-4 py-3.5 text-xs tabular-nums text-slate-500 whitespace-nowrap dark:text-zinc-400">
                      {c.detectedAt}
                    </td>
                    <td
                      className="px-4 py-3.5 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedCase(c)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                      >
                        Revisar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Case Detail Drawer */}
      <SlideOverDrawer
        open={Boolean(selectedCase)}
        onClose={() => setSelectedCase(null)}
        title={selectedCase ? ISSUE_LABELS[selectedCase.issueType] : ''}
        subtitle={
          selectedCase
            ? `${selectedCase.orderReference} · Folio ${selectedCase.codiFolio}`
            : undefined
        }
        footer={
          selectedCase && (
            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedCase(null)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={handleMarkResolved}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                <CheckCircle2 className="h-4 w-4" />
                Marcar como resuelto
              </button>
            </div>
          )
        }
      >
        {selectedCase && (
          <div className="space-y-6">
            <div className="rounded-xl border border-violet-200 bg-violet-50/70 p-4 dark:border-violet-800/60 dark:bg-violet-950/40">
              <div className="flex items-center gap-2 text-xs font-semibold text-violet-800 dark:text-violet-300">
                <Eye className="h-4 w-4" />
                En revisión manual (pago no confirmado)
              </div>
              <p className="mt-1.5 text-sm text-violet-950 dark:text-violet-100">
                {selectedCase.technicalSummary}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 p-4 text-sm dark:border-zinc-800">
              <div>
                <span className="text-xs text-slate-500 dark:text-zinc-400">
                  Importe esperado
                </span>
                <div className="mt-0.5 font-semibold tabular-nums text-slate-900 dark:text-zinc-100">
                  {formatMXN(selectedCase.expectedMxn)}
                </div>
              </div>
              <div>
                <span className="text-xs text-slate-500 dark:text-zinc-400">
                  Importe recibido
                </span>
                <div className="mt-0.5 font-semibold tabular-nums text-slate-900 dark:text-zinc-100">
                  {formatMXN(selectedCase.receivedMxn)}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                Historial técnico
              </h3>
              <div className="mt-2 space-y-2.5 rounded-xl border border-slate-200 p-4 dark:border-zinc-800">
                {selectedCase.technicalEvents.map((ev, i) => (
                  <div key={i} className="flex items-start gap-3 text-xs">
                    <span className="font-mono text-slate-400 tabular-nums shrink-0">
                      {ev.timestamp}
                    </span>
                    <span className="text-slate-700 dark:text-zinc-300">
                      {ev.detail}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                Notas internas
              </h3>
              <div className="mt-2 space-y-2">
                {selectedCase.internalNotes.length === 0 ? (
                  <p className="text-xs text-slate-400">Sin notas aún.</p>
                ) : (
                  selectedCase.internalNotes.map((note, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                    >
                      {note}
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleAddNote} className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="Agregar nota interna..."
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                >
                  <MessageSquarePlus className="h-3.5 w-3.5" />
                  Guardar
                </button>
              </form>
            </div>
          </div>
        )}
      </SlideOverDrawer>
    </div>
  );
}
