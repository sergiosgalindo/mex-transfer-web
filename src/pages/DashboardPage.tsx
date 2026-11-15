import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Calendar,
  Clock,
  DollarSign,
  MapPin,
  Ticket,
  Users,
} from 'lucide-react';
import { DAILY_METRICS, formatMXN } from '../data/mockData';
import { EventItem, NavSection, OrderItem, ReconciliationCase } from '../types';
import { PaymentStatusBadge, Skeleton } from '../components/ui';

interface DashboardPageProps {
  events: EventItem[];
  orders: OrderItem[];
  reconciliationCases: ReconciliationCase[];
  loading: boolean;
  onNavigate: (section: NavSection) => void;
  onSelectOrder: (order: OrderItem) => void;
}

export function DashboardPage({
  events,
  orders,
  reconciliationCases,
  loading,
  onNavigate,
  onSelectOrder,
}: DashboardPageProps) {
  const [dateRange, setDateRange] = useState<'7d' | '14d' | '30d'>('14d');
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [chartMetric, setChartMetric] = useState<'revenue' | 'orders'>('revenue');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const visibleMetrics =
    dateRange === '7d' ? DAILY_METRICS.slice(-7) : DAILY_METRICS;

  const maxVal = Math.max(
    ...visibleMetrics.map((m) =>
      chartMetric === 'revenue' ? m.revenueMxn : m.orders
    )
  );

  const totalRevenue = events.reduce((acc, e) => acc + e.revenueMxn, 0);
  const paidOrdersCount = orders.filter(
    (o) => o.paymentStatus === 'paid' || o.paymentStatus === 'ticket_sent'
  ).length;
  const totalSold = events.reduce((acc, e) => acc + e.sold, 0);
  const totalCapacity = events.reduce((acc, e) => acc + e.capacity, 0);
  const avgOccupancy =
    totalCapacity > 0 ? Math.round((totalSold / totalCapacity) * 100) : 0;

  const upcomingEvents = events.filter(
    (e) => e.status === 'in_progress' || e.status === 'upcoming' || e.status === 'sold_out'
  );

  const openCases = reconciliationCases.filter((c) => c.status !== 'resolved');

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-zinc-100">
            Resumen operativo
          </h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-zinc-400">
            Estado de ventas CoDi, ocupación y alertas en tiempo real (CST / CDMX).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Filtrar por evento"
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-2xs focus:border-emerald-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
          >
            <option value="all">Todos los eventos</option>
            {events.map((evt) => (
              <option key={evt.id} value={evt.id}>
                {evt.name}
              </option>
            ))}
          </select>

          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 dark:border-zinc-800 dark:bg-zinc-900">
            {(['7d', '14d', '30d'] as const).map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setDateRange(range)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  dateRange === range
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                {range === '7d' ? '7 días' : range === '14d' ? '14 días' : '30 días'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4 KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <Skeleton className="h-4 w-28" />
              <Skeleton className="mt-3 h-7 w-36" />
              <Skeleton className="mt-2 h-3.5 w-24" />
            </div>
          ))
        ) : (
          <>
            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                  Ventas cobradas
                </span>
                <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 tabular-nums dark:text-zinc-100">
                {formatMXN(totalRevenue)}
              </div>
              <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                <span className="inline-flex items-center font-medium text-emerald-600 dark:text-emerald-400 tabular-nums">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  +14.2%
                </span>
                <span className="text-slate-500 dark:text-zinc-400">
                  vs. periodo anterior
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                  Órdenes pagadas
                </span>
                <Ticket className="h-4 w-4 text-slate-400" />
              </div>
              <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 tabular-nums dark:text-zinc-100">
                {paidOrdersCount + 340}
              </div>
              <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                <span className="inline-flex items-center font-medium text-emerald-600 dark:text-emerald-400 tabular-nums">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  +9.8%
                </span>
                <span className="text-slate-500 dark:text-zinc-400">
                  98.2% vía CoDi QR/Push
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                  Boletos vendidos
                </span>
                <Users className="h-4 w-4 text-slate-400" />
              </div>
              <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 tabular-nums dark:text-zinc-100">
                {totalSold.toLocaleString('es-MX')}
              </div>
              <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                <span className="inline-flex items-center font-medium text-emerald-600 dark:text-emerald-400 tabular-nums">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  +11.4%
                </span>
                <span className="text-slate-500 dark:text-zinc-400">
                  de {totalCapacity.toLocaleString('es-MX')} cupo total
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                  Ocupación promedio
                </span>
                <Calendar className="h-4 w-4 text-slate-400" />
              </div>
              <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 tabular-nums dark:text-zinc-100">
                {avgOccupancy}%
              </div>
              <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                <span className="inline-flex items-center font-medium text-emerald-600 dark:text-emerald-400 tabular-nums">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  +4.1 pts
                </span>
                <span className="text-slate-500 dark:text-zinc-400">
                  en {upcomingEvents.length} eventos activos
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Chart + Operational Alerts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-2 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                {chartMetric === 'revenue'
                  ? 'Ingresos diarios (MXN)'
                  : 'Órdenes pagadas por día'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Pasa el cursor sobre cada barra para ver el detalle exacto.
              </p>
            </div>
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 dark:border-zinc-800 dark:bg-zinc-950">
              <button
                type="button"
                onClick={() => setChartMetric('revenue')}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  chartMetric === 'revenue'
                    ? 'bg-white text-slate-900 shadow-2xs dark:bg-zinc-800 dark:text-zinc-100'
                    : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400'
                }`}
              >
                Ingresos
              </button>
              <button
                type="button"
                onClick={() => setChartMetric('orders')}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  chartMetric === 'orders'
                    ? 'bg-white text-slate-900 shadow-2xs dark:bg-zinc-800 dark:text-zinc-100'
                    : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400'
                }`}
              >
                Órdenes
              </button>
            </div>
          </div>

          {loading ? (
            <Skeleton className="mt-6 h-52 w-full" />
          ) : (
            <div className="relative mt-6">
              <div className="flex h-52 items-end gap-2 border-b border-slate-100 pb-2 dark:border-zinc-800">
                {visibleMetrics.map((m, idx) => {
                  const val =
                    chartMetric === 'revenue' ? m.revenueMxn : m.orders;
                  const heightPct = Math.max(8, Math.round((val / maxVal) * 100));
                  const isHovered = hoveredIdx === idx;
                  return (
                    <div
                      key={m.date}
                      onMouseEnter={() => setHoveredIdx(idx)}
                      onMouseLeave={() => setHoveredIdx(null)}
                      className="group relative flex flex-1 flex-col items-center justify-end h-full"
                    >
                      {isHovered && (
                        <div className="absolute -top-10 z-10 whitespace-nowrap rounded-md border border-slate-200 bg-slate-900 px-2.5 py-1 text-xs font-medium text-white shadow-md tabular-nums dark:border-zinc-700 dark:bg-zinc-800">
                          {m.label}:{' '}
                          {chartMetric === 'revenue'
                            ? formatMXN(m.revenueMxn)
                            : `${m.orders} órdenes`}
                        </div>
                      )}
                      <div
                        style={{ height: `${heightPct}%` }}
                        className={`w-full max-w-[28px] rounded-t-md transition-all ${
                          isHovered
                            ? 'bg-emerald-500 dark:bg-emerald-400'
                            : 'bg-emerald-500/80 dark:bg-emerald-500/70'
                        }`}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 flex justify-between text-[11px] text-slate-400 tabular-nums dark:text-zinc-500">
                {visibleMetrics.map((m, idx) => (
                  <span
                    key={m.date}
                    className={`flex-1 text-center ${
                      visibleMetrics.length > 10 && idx % 2 !== 0
                        ? 'hidden sm:inline'
                        : ''
                    }`}
                  >
                    {m.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Operational Alerts */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
              Alertas operativas
            </h2>
            <span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700 tabular-nums dark:bg-violet-950/60 dark:text-violet-300">
              {openCases.length} activas
            </span>
          </div>

          <div className="mt-4 space-y-2.5">
            {openCases.slice(0, 4).map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onNavigate('payments')}
                className="flex w-full items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/60 p-3 text-left transition-colors hover:border-slate-200 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-950/50 dark:hover:border-zinc-700"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-violet-600 dark:text-violet-400" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-medium text-slate-900 dark:text-zinc-100">
                      {c.issueType === 'late_payment' && 'Pago tardío'}
                      {c.issueType === 'amount_mismatch' && 'Importe distinto'}
                      {c.issueType === 'possible_duplicate' && 'Posible duplicado'}
                      {c.issueType === 'ticket_delivery_error' && 'Error envío boleto'}
                      {c.issueType === 'reference_not_found' && 'Sin referencia'}
                    </span>
                    <span className="text-[11px] text-slate-500 tabular-nums dark:text-zinc-400">
                      {c.orderReference}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-zinc-400">
                    {c.customerName} · {formatMXN(c.receivedMxn)}
                  </p>
                </div>
              </button>
            ))}
          </div>

          <button
            type="button"
            disabled
            className="mt-4 w-full rounded-lg border border-slate-200 py-2 text-xs font-medium text-slate-400 opacity-60 cursor-not-allowed dark:border-zinc-800 dark:text-zinc-500"
            title="Módulo desactivado temporalmente"
          >
            Pagos y conciliación (Desactivado)
          </button>
        </div>
      </div>

      {/* Upcoming Events + Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Upcoming Events */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
              Próximos eventos
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('events')}
              className="text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
            >
              Ver todos
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {upcomingEvents.slice(0, 3).map((evt) => {
              const pct = Math.round((evt.sold / evt.capacity) * 100);
              return (
                <div
                  key={evt.id}
                  className="rounded-lg border border-slate-100 p-3.5 dark:border-zinc-800"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-medium text-slate-900 dark:text-zinc-100">
                      {evt.name}
                    </h3>
                    <span className="text-xs font-semibold text-emerald-600 tabular-nums dark:text-emerald-400">
                      {pct}%
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-zinc-400">
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <Clock className="h-3 w-3" />
                      {evt.date} · {evt.time}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {evt.venue}
                    </span>
                  </div>
                  <div className="mt-2.5">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="mt-1 flex justify-between text-[11px] text-slate-500 tabular-nums dark:text-zinc-400">
                      <span>
                        {evt.sold} / {evt.capacity} boletos
                      </span>
                      <span>{formatMXN(evt.revenueMxn)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity Table */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-2 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
              Actividad reciente
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('orders')}
              className="text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
            >
              Ver órdenes
            </button>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-medium text-slate-500 dark:border-zinc-800 dark:text-zinc-400">
                  <th className="pb-2.5 pr-4">Hora</th>
                  <th className="pb-2.5 pr-4">Cliente</th>
                  <th className="pb-2.5 pr-4">Evento</th>
                  <th className="pb-2.5 pr-4 text-right">Entradas</th>
                  <th className="pb-2.5 pr-4 text-right">Importe</th>
                  <th className="pb-2.5">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {orders.slice(0, 5).map((ord) => (
                  <tr
                    key={ord.id}
                    onClick={() => onSelectOrder(ord)}
                    className="cursor-pointer transition-colors hover:bg-slate-50/80 dark:hover:bg-zinc-800/50"
                  >
                    <td className="py-3 pr-4 text-xs text-slate-500 tabular-nums whitespace-nowrap dark:text-zinc-400">
                      {ord.createdAt.split(', ')[1]}
                    </td>
                    <td className="py-3 pr-4 font-medium text-slate-900 whitespace-nowrap dark:text-zinc-100">
                      {ord.customerName}
                    </td>
                    <td className="py-3 pr-4 text-slate-600 whitespace-nowrap dark:text-zinc-300">
                      {ord.eventName}
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums text-slate-700 dark:text-zinc-300">
                      {ord.quantity}
                    </td>
                    <td className="py-3 pr-4 text-right font-medium tabular-nums text-slate-900 dark:text-zinc-100">
                      {formatMXN(ord.totalMxn)}
                    </td>
                    <td className="py-3">
                      <PaymentStatusBadge status={ord.paymentStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
