import React from 'react';
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Shield,
  Users,
} from 'lucide-react';
import { formatMXN } from '../data/mockData';
import { NavSection, ReconciliationCase } from '../types';
import { EmptyState, PriorityBadge } from '../components/ui';

export function AlertsPage({
  cases,
  onNavigate,
}: {
  cases: ReconciliationCase[];
  onNavigate: (s: NavSection) => void;
}) {
  const openCases = cases.filter((c) => c.status !== 'resolved');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-zinc-100">
          Alertas y revisión manual
        </h1>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-zinc-400">
          Cola centralizada de anomalías de cobro y entrega de boletos.
        </p>
      </div>

      {openCases.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
          title="Sin alertas pendientes"
          description="La operación está al día. Todos los pagos y boletos se encuentran conciliados."
        />
      ) : (
        <div className="space-y-3">
          {openCases.map((c) => (
            <div
              key={c.id}
              className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-violet-600 dark:text-violet-400" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                      {c.orderReference} · {c.customerName}
                    </span>
                    <PriorityBadge priority={c.priority} />
                  </div>
                  <p className="mt-1 text-xs text-slate-600 dark:text-zinc-400">
                    {c.technicalSummary}
                  </p>
                  <div className="mt-1.5 text-xs text-slate-400 tabular-nums">
                    Recibido: {formatMXN(c.receivedMxn)} · Folio {c.codiFolio} ·{' '}
                    {c.detectedAt}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('payments')}
                className="self-start rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 sm:self-center dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
              >
                Resolver en conciliación
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function SettingsPage() {
  const team = [
    {
      name: 'Mariana López',
      email: 'mariana@codieventos.mx',
      role: 'Organizadora (Admin)',
      status: 'Activo',
    },
    {
      name: 'Carlos Méndez',
      email: 'carlos.puerta@codieventos.mx',
      role: 'Staff de acceso',
      status: 'Activo',
    },
    {
      name: 'Ana Sofía Ruiz',
      email: 'finanzas@codieventos.mx',
      role: 'Conciliación y finanzas',
      status: 'Activo',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-zinc-100">
          Equipo y configuración
        </h1>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-zinc-400">
          Permisos del personal, cuenta CoDi receptora y preferencias de notificación.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-zinc-100">
            <Users className="h-4 w-4 text-emerald-600" />
            Miembros del equipo
          </div>
          <div className="mt-4 divide-y divide-slate-100 dark:divide-zinc-800">
            {team.map((m) => (
              <div
                key={m.email}
                className="flex items-center justify-between py-3 text-sm"
              >
                <div>
                  <div className="font-medium text-slate-900 dark:text-zinc-100">
                    {m.name}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-zinc-400">
                    {m.email}
                  </div>
                </div>
                <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-zinc-800 dark:text-zinc-300">
                  {m.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-zinc-100">
              <Shield className="h-4 w-4 text-emerald-600" />
              Cuenta CoDi receptora (Banxico)
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400">
              CLABE configurada: <span className="font-mono tabular-nums">012180001928374655</span> (BBVA México)
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
              Tiempo de expiración QR CoDi: <span className="font-medium">15 minutos</span>
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-zinc-100">
              <Bell className="h-4 w-4 text-emerald-600" />
              Notificaciones operativas
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400">
              Alertas inmediatas activas para pagos tardíos, discrepancias de importe y fallos de envío por WhatsApp.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
