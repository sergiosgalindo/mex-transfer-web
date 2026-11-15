import React, { useState } from 'react';
import {
  CheckCircle2,
  Download,
  Eye,
  MoreHorizontal,
  QrCode,
  RefreshCw,
  Search,
  Send,
  ShoppingBag,
  XCircle,
} from 'lucide-react';
import { formatMXN } from '../data/mockData';
import {
  CheckInStatus,
  EventItem,
  OrderItem,
  OrderPaymentStatus,
} from '../types';
import {
  CheckInBadge,
  ConfirmDialog,
  EmptyState,
  PaymentStatusBadge,
  Skeleton,
  SlideOverDrawer,
} from '../components/ui';

interface OrdersPageProps {
  orders: OrderItem[];
  events: EventItem[];
  loading: boolean;
  initialEventFilter?: string;
  selectedOrder: OrderItem | null;
  onSelectOrder: (order: OrderItem | null) => void;
  onUpdateOrder: (updated: OrderItem) => void;
  onCancelOrder?: (order: OrderItem) => Promise<void>;
  onRenewOrder?: (order: OrderItem) => Promise<void>;
}

export function OrdersPage({
  orders,
  events,
  loading,
  initialEventFilter = 'all',
  selectedOrder,
  onSelectOrder,
  onUpdateOrder,
  onCancelOrder,
  onRenewOrder,
}: OrdersPageProps) {
  const [search, setSearch] = useState('');
  const [eventFilter, setEventFilter] = useState(initialEventFilter);
  const [statusFilter, setStatusFilter] = useState<'all' | OrderPaymentStatus>('all');
  const [originFilter, setOriginFilter] = useState<'all' | string>('all');
  const [checkInFilter, setCheckInFilter] = useState<'all' | CheckInStatus>('all');

  const [confirmAction, setConfirmAction] = useState<{
    type: 'cancel' | 'review' | 'resend' | 'renew';
    order: OrderItem;
  } | null>(null);

  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  const filteredOrders = orders.filter((o) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      o.customerName.toLowerCase().includes(q) ||
      o.customerPhone.toLowerCase().includes(q) ||
      o.reference.toLowerCase().includes(q) ||
      o.accessCode.toLowerCase().includes(q) ||
      (o.codiFolio && o.codiFolio.toLowerCase().includes(q));

    const matchesEvent =
      eventFilter === 'all' || o.eventName === eventFilter;
    const matchesStatus =
      statusFilter === 'all' || o.paymentStatus === statusFilter;
    const matchesOrigin =
      originFilter === 'all' || o.paymentOrigin === originFilter;
    const matchesCheckIn =
      checkInFilter === 'all' || o.checkInStatus === checkInFilter;

    return (
      matchesSearch &&
      matchesEvent &&
      matchesStatus &&
      matchesOrigin &&
      matchesCheckIn
    );
  });

  const handleExportCsv = () => {
    const headers = [
      'Orden',
      'Cliente',
      'Telefono',
      'Evento',
      'Boleto',
      'Entradas',
      'Total MXN',
      'Estado Pago',
      'Folio CoDi',
      'Check-in',
      'Fecha',
    ];
    const rows = filteredOrders.map((o) => [
      o.reference,
      o.customerName,
      o.customerPhone,
      o.eventName,
      o.ticketType,
      o.quantity,
      o.totalMxn,
      o.paymentStatus,
      o.codiFolio ?? '',
      o.checkInStatus,
      o.createdAt,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ordenes-codi-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exportadas ${filteredOrders.length} órdenes a CSV.`);
  };

  const executeConfirmedAction = () => {
    if (!confirmAction) return;
    const { type, order } = confirmAction;
    const now = '14 Nov 2026, 15:30 CST';

    if (type === 'cancel' && onCancelOrder) {
      void onCancelOrder(order)
        .then(() => showToast(`Orden ${order.reference} cancelada.`))
        .catch(() => showToast('No se pudo cancelar la orden en el core.'));
      setConfirmAction(null);
      return;
    }
    if (type === 'renew' && onRenewOrder) {
      void onRenewOrder(order)
        .then(() => showToast(`QR de cobro CoDi renovado para ${order.reference}.`))
        .catch(() => showToast('No se pudo renovar el cobro en el core.'));
      setConfirmAction(null);
      return;
    }

    if (type === 'cancel') {
      const updated: OrderItem = {
        ...order,
        paymentStatus: 'cancelled',
        checkInStatus: 'not_applicable',
        timeline: [
          ...order.timeline,
          {
            id: `tl-${Date.now()}`,
            timestamp: now,
            title: 'Orden cancelada',
            description: 'Cancelada manualmente por Mariana López desde backoffice.',
            type: 'error',
          },
        ],
      };
      onUpdateOrder(updated);
      onSelectOrder(updated);
      showToast(`Orden ${order.reference} cancelada.`);
    } else if (type === 'review') {
      const updated: OrderItem = {
        ...order,
        paymentStatus: 'manual_review',
        timeline: [
          ...order.timeline,
          {
            id: `tl-${Date.now()}`,
            timestamp: now,
            title: 'Marcada para revisión manual',
            description: 'Enviada a cola de conciliación financiera.',
            type: 'warning',
          },
        ],
      };
      onUpdateOrder(updated);
      onSelectOrder(updated);
      showToast(`Orden ${order.reference} marcada para revisión manual.`);
    } else if (type === 'resend') {
      const updated: OrderItem = {
        ...order,
        paymentStatus: 'ticket_sent',
        timeline: [
          ...order.timeline,
          {
            id: `tl-${Date.now()}`,
            timestamp: now,
            title: 'Boleto reenviado por WhatsApp',
            description: `QR ${order.accessCode} reenviado a ${order.customerPhone}.`,
            type: 'success',
          },
        ],
      };
      onUpdateOrder(updated);
      onSelectOrder(updated);
      showToast(`Boleto reenviado a ${order.customerPhone}.`);
    } else if (type === 'renew') {
      const updated: OrderItem = {
        ...order,
        paymentStatus: 'pending_payment',
        expiresAt: '14 Nov 2026, 15:45 CST',
        timeline: [
          ...order.timeline,
          {
            id: `tl-${Date.now()}`,
            timestamp: now,
            title: 'QR de cobro CoDi renovado',
            description: 'Nuevo QR emitido con vigencia de 15 minutos.',
            type: 'info',
          },
        ],
      };
      onUpdateOrder(updated);
      onSelectOrder(updated);
      showToast(`QR de cobro CoDi renovado para ${order.reference}.`);
    }
    setConfirmAction(null);
  };

  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-800 shadow-lg dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-zinc-100">
            Órdenes
          </h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-zinc-400">
            Consulta rápida de pagos CoDi, boletos enviados y estado de check-in.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExportCsv}
          className="inline-flex items-center gap-1.5 self-start rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-emerald-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          <Download className="h-4 w-4" />
          Exportar CSV
        </button>
      </div>

      {/* Toolbar & Filters */}
      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-6">
        <div className="relative xl:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nombre, teléfono, orden, código o folio CoDi..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>

        <select
          aria-label="Filtrar por evento"
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
        >
          <option value="all">Todos los eventos</option>
          {events.map((evt) => (
            <option key={evt.id} value={evt.name}>
              {evt.name}
            </option>
          ))}
        </select>

        <select
          aria-label="Filtrar por estado de pago"
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as 'all' | OrderPaymentStatus)
          }
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
        >
          <option value="all">Estado de pago</option>
          <option value="ticket_sent">Boleto enviado</option>
          <option value="paid">Pagada</option>
          <option value="pending_payment">Pendiente de pago</option>
          <option value="manual_review">Revisión manual</option>
          <option value="expired">Expirada</option>
          <option value="cancelled">Cancelada</option>
        </select>

        <select
          aria-label="Filtrar por origen de pago"
          value={originFilter}
          onChange={(e) => setOriginFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
        >
          <option value="all">Origen de pago</option>
          <option value="CoDi QR">CoDi QR</option>
          <option value="CoDi Push">CoDi Push</option>
          <option value="Transferencia SPEI">Transferencia SPEI</option>
        </select>

        <select
          aria-label="Filtrar por check-in"
          value={checkInFilter}
          onChange={(e) =>
            setCheckInFilter(e.target.value as 'all' | CheckInStatus)
          }
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
        >
          <option value="all">Check-in</option>
          <option value="pending">Sin ingreso</option>
          <option value="checked_in">Validado</option>
          <option value="not_applicable">No aplica</option>
        </select>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="h-5 w-5" />}
          title="No se encontraron órdenes"
          description="Prueba ajustando los filtros de evento, estado o limpiando el término de búsqueda."
          action={
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setEventFilter('all');
                setStatusFilter('all');
                setOriginFilter('all');
                setCheckInFilter('all');
              }}
              className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            >
              Restablecer filtros
            </button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-400">
                  <th className="px-4 py-3">Orden</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Evento y boleto</th>
                  <th className="px-4 py-3 text-right">Entradas</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3">Estado pago</th>
                  <th className="px-4 py-3">Folio CoDi</th>
                  <th className="px-4 py-3">Check-in</th>
                  <th className="px-4 py-3">Fecha y hora</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {filteredOrders.map((ord) => (
                  <tr
                    key={ord.id}
                    onClick={() => onSelectOrder(ord)}
                    className="cursor-pointer transition-colors hover:bg-slate-50/80 dark:hover:bg-zinc-800/40"
                  >
                    <td className="px-4 py-3.5 font-medium text-slate-900 tabular-nums whitespace-nowrap dark:text-zinc-100">
                      {ord.reference}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="font-medium text-slate-900 dark:text-zinc-100">
                        {ord.customerName}
                      </div>
                      <div className="text-xs text-slate-500 tabular-nums dark:text-zinc-400">
                        {ord.customerPhone}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="text-slate-900 dark:text-zinc-100">
                        {ord.eventName}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-zinc-400">
                        {ord.ticketType}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right font-medium tabular-nums text-slate-800 dark:text-zinc-200">
                      {ord.quantity}
                    </td>
                    <td className="px-4 py-3.5 text-right font-semibold tabular-nums text-slate-900 dark:text-zinc-100">
                      {formatMXN(ord.totalMxn)}
                    </td>
                    <td className="px-4 py-3.5">
                      <PaymentStatusBadge status={ord.paymentStatus} />
                      {ord.reviewNote && (
                        <div className="mt-1 inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/50 dark:text-amber-300">
                          ⚠️ {ord.reviewNote}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-xs font-mono tabular-nums text-slate-600 whitespace-nowrap dark:text-zinc-400">
                      {ord.codiFolio ?? '—'}
                    </td>
                    <td className="px-4 py-3.5">
                      <CheckInBadge status={ord.checkInStatus} />
                    </td>
                    <td className="px-4 py-3.5 text-xs tabular-nums text-slate-500 whitespace-nowrap dark:text-zinc-400">
                      {ord.createdAt}
                    </td>
                    <td
                      className="px-4 py-3.5 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        aria-label={`Ver detalle de ${ord.reference}`}
                        onClick={() => onSelectOrder(ord)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Detail Drawer */}
      <SlideOverDrawer
        open={Boolean(selectedOrder)}
        onClose={() => onSelectOrder(null)}
        title={selectedOrder ? `Orden ${selectedOrder.reference}` : ''}
        subtitle={
          selectedOrder
            ? `${selectedOrder.createdAt} · ${selectedOrder.paymentOrigin}`
            : undefined
        }
        footer={
          selectedOrder && (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setConfirmAction({ type: 'resend', order: selectedOrder })
                  }
                  disabled={
                    selectedOrder.paymentStatus === 'cancelled' ||
                    selectedOrder.paymentStatus === 'expired'
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-40"
                >
                  <Send className="h-3.5 w-3.5" />
                  Reenviar boleto
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setConfirmAction({ type: 'renew', order: selectedOrder })
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Renovar QR
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setConfirmAction({ type: 'review', order: selectedOrder })
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Revisión
                </button>
              </div>
              <button
                type="button"
                onClick={() =>
                  setConfirmAction({ type: 'cancel', order: selectedOrder })
                }
                disabled={selectedOrder.paymentStatus === 'cancelled'}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-40 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-300"
              >
                <XCircle className="h-3.5 w-3.5" />
                Cancelar orden
              </button>
            </div>
          )
        }
      >
        {selectedOrder && (
          <div className="space-y-6">
            {/* Status */}
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
              <div>
                <div className="text-xs text-slate-500 dark:text-zinc-400">
                  Estado actual
                </div>
                <div className="mt-1">
                  <PaymentStatusBadge status={selectedOrder.paymentStatus} />
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500 dark:text-zinc-400">
                  Importe total
                </div>
                <div className="mt-0.5 text-lg font-semibold text-slate-900 tabular-nums dark:text-zinc-100">
                  {formatMXN(selectedOrder.totalMxn)}
                </div>
              </div>
            </div>

            {selectedOrder.reviewNote && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-3.5 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
                <div className="font-semibold">⚠️ Nota para revisión en Backoffice</div>
                <div className="mt-1">{selectedOrder.reviewNote}</div>
              </div>
            )}

            {/* Buyer */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                Datos del comprador
              </h3>
              <div className="mt-2 rounded-xl border border-slate-200 p-4 text-sm dark:border-zinc-800">
                <div className="font-medium text-slate-900 dark:text-zinc-100">
                  {selectedOrder.customerName}
                </div>
                <div className="mt-1 text-slate-600 tabular-nums dark:text-zinc-400">
                  {selectedOrder.customerPhone}
                </div>
                <div className="text-slate-500 dark:text-zinc-400">
                  {selectedOrder.customerEmail}
                </div>
              </div>
            </div>

            {/* Event & Payment */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                Detalle de compra y CoDi
              </h3>
              <dl className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200 text-sm dark:divide-zinc-800 dark:border-zinc-800">
                <div className="flex justify-between px-4 py-2.5">
                  <dt className="text-slate-500 dark:text-zinc-400">Evento</dt>
                  <dd className="font-medium text-slate-900 dark:text-zinc-100">
                    {selectedOrder.eventName}
                  </dd>
                </div>
                <div className="flex justify-between px-4 py-2.5">
                  <dt className="text-slate-500 dark:text-zinc-400">Boleto</dt>
                  <dd className="text-slate-900 dark:text-zinc-100">
                    {selectedOrder.quantity}× {selectedOrder.ticketType}
                  </dd>
                </div>
                <div className="flex justify-between px-4 py-2.5">
                  <dt className="text-slate-500 dark:text-zinc-400">Folio CoDi</dt>
                  <dd className="font-mono text-xs tabular-nums text-slate-900 dark:text-zinc-100">
                    {selectedOrder.codiFolio ?? 'Pendiente'}
                  </dd>
                </div>
                <div className="flex justify-between px-4 py-2.5">
                  <dt className="text-slate-500 dark:text-zinc-400">Vencimiento</dt>
                  <dd className="text-xs tabular-nums text-slate-700 dark:text-zinc-300">
                    {selectedOrder.expiresAt}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Access Code + QR Preview */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                Código de acceso
              </h3>
              <div className="mt-2 flex items-center gap-4 rounded-xl border border-slate-200 p-4 dark:border-zinc-800">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-900">
                  <QrCode className="h-14 w-14 text-slate-800 dark:text-zinc-100" />
                </div>
                <div>
                  <div className="font-mono text-base font-semibold tracking-wide text-slate-900 tabular-nums dark:text-zinc-100">
                    {selectedOrder.accessCode}
                  </div>
                  <div className="mt-1">
                    <CheckInBadge status={selectedOrder.checkInStatus} />
                  </div>
                  {selectedOrder.checkInTime && (
                    <p className="mt-1 text-xs text-slate-500 tabular-nums dark:text-zinc-400">
                      Validado: {selectedOrder.checkInTime}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                Cronología
              </h3>
              <div className="mt-3 space-y-3 border-l border-slate-200 pl-4 dark:border-zinc-800">
                {selectedOrder.timeline.map((ev) => (
                  <div key={ev.id} className="relative">
                    <span
                      className={`absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-zinc-950 ${
                        ev.type === 'success'
                          ? 'bg-emerald-500'
                          : ev.type === 'warning'
                          ? 'bg-amber-500'
                          : ev.type === 'error'
                          ? 'bg-red-500'
                          : 'bg-slate-400'
                      }`}
                    />
                    <div className="text-xs font-medium text-slate-900 dark:text-zinc-100">
                      {ev.title}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-zinc-400">
                      {ev.description}
                    </div>
                    <div className="mt-0.5 text-[11px] text-slate-400 tabular-nums">
                      {ev.timestamp}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </SlideOverDrawer>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(confirmAction)}
        title={
          confirmAction?.type === 'cancel'
            ? 'Cancelar orden'
            : confirmAction?.type === 'review'
            ? 'Marcar para revisión manual'
            : confirmAction?.type === 'resend'
            ? 'Reenviar boleto por WhatsApp'
            : 'Renovar QR de cobro CoDi'
        }
        description={
          confirmAction?.type === 'cancel'
            ? `¿Confirmas cancelar la orden ${confirmAction.order.reference}? Esta acción liberará los boletos.`
            : confirmAction?.type === 'review'
            ? `La orden ${confirmAction?.order.reference} pasará a revisión manual en Pagos y conciliación.`
            : confirmAction?.type === 'resend'
            ? `Se enviará nuevamente el código QR ${confirmAction?.order.accessCode} al ${confirmAction?.order.customerPhone}.`
            : `Se generará un nuevo QR CoDi con vigencia de 15 minutos para ${confirmAction?.order.reference}.`
        }
        confirmLabel={
          confirmAction?.type === 'cancel' ? 'Sí, cancelar orden' : 'Confirmar'
        }
        destructive={confirmAction?.type === 'cancel'}
        onCancel={() => setConfirmAction(null)}
        onConfirm={executeConfirmedAction}
      />
    </div>
  );
}
