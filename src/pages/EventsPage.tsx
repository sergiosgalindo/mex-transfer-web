import React, { useEffect, useState } from 'react';
import {
  Archive,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Copy,
  Edit3,
  Image as ImageIcon,
  MapPin,
  MessageSquare,
  Plus,
  Search,
  ShoppingBag,
  Ticket,
  Upload,
} from 'lucide-react';
import { updateEventFlyer } from '../api';
import { formatMXN } from '../data/mockData';
import { EventItem, EventStatus, TicketType } from '../types';
import {
  ConfirmDialog,
  EmptyState,
  EventStatusBadge,
  Skeleton,
  SlideOverDrawer,
} from '../components/ui';

interface EventsPageProps {
  events: EventItem[];
  loading: boolean;
  onUpdateEvents: (events: EventItem[]) => void;
  onViewEventOrders: (eventName: string) => void;
  onCreateEvent?: () => Promise<string | void>;
  onAddTicketType?: (
    eventId: string,
    ticket: { name: string; presalePrice: number; regularPrice: number; capacity: number }
  ) => Promise<void>;
  onUpdateTicketType?: (
    eventId: string,
    ticketTypeId: string,
    ticket: { name: string; presalePrice: number; regularPrice: number; capacity: number }
  ) => Promise<void>;
}

export function EventsPage({
  events,
  loading,
  onUpdateEvents,
  onViewEventOrders,
  onCreateEvent,
  onAddTicketType,
  onUpdateTicketType,
}: EventsPageProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | EventStatus>('all');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<EventItem | null>(null);

  // Ticket Type Drawer state
  const [ticketDrawerOpen, setTicketDrawerOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<TicketType | null>(null);
  const [ttName, setTtName] = useState('');
  const [ttPresale, setTtPresale] = useState('');
  const [ttRegular, setTtRegular] = useState('');
  const [ttPresaleEnd, setTtPresaleEnd] = useState('');
  const [ttCapacity, setTtCapacity] = useState('');

  const selectedEvent = events.find((e) => e.id === selectedEventId) || null;

  // Flyer & WhatsApp Promo Text state
  const [promoText, setPromoText] = useState('');
  const [flyerPreview, setFlyerPreview] = useState<string | null>(null);
  const [savingFlyer, setSavingFlyer] = useState(false);
  const [flyerToast, setFlyerToast] = useState<string | null>(null);

  useEffect(() => {
    if (selectedEvent) {
      setPromoText(selectedEvent.description || '');
      setFlyerPreview(selectedEvent.flyerImage || null);
    }
  }, [selectedEvent?.id, selectedEvent?.description, selectedEvent?.flyerImage]);

  const handleFlyerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFlyerPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveFlyerAndMessage = async () => {
    if (!selectedEvent) return;
    setSavingFlyer(true);
    try {
      const updated = await updateEventFlyer(selectedEvent.id, {
        description: promoText,
        flyerImage: flyerPreview,
      });
      onUpdateEvents(
        events.map((ev) =>
          ev.id === selectedEvent.id
            ? {
                ...ev,
                description: updated.description,
                flyerImage: updated.flyerImage,
              }
            : ev
        )
      );
      setFlyerToast('Flyer y mensaje de WhatsApp guardados en el Core.');
      setTimeout(() => setFlyerToast(null), 3500);
    } catch {
      setFlyerToast('Error al guardar el flyer en el Core.');
      setTimeout(() => setFlyerToast(null), 3500);
    } finally {
      setSavingFlyer(false);
    }
  };

  const filteredEvents = events.filter((evt) => {
    const matchesSearch =
      evt.name.toLowerCase().includes(search.toLowerCase()) ||
      evt.venue.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || evt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDuplicate = (evt: EventItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const copy: EventItem = {
      ...evt,
      id: `evt-${Date.now()}`,
      name: `${evt.name} (Copia)`,
      status: 'draft',
      sold: 0,
      reserved: 0,
      revenueMxn: 0,
      pendingOrders: 0,
    };
    onUpdateEvents([copy, ...events]);
  };

  const handleArchiveConfirm = () => {
    if (!archiveTarget) return;
    onUpdateEvents(events.filter((e) => e.id !== archiveTarget.id));
    if (selectedEventId === archiveTarget.id) setSelectedEventId(null);
    setArchiveTarget(null);
  };

  const openTicketDrawer = (tt?: TicketType) => {
    if (tt) {
      setEditingTicket(tt);
      setTtName(tt.name);
      setTtPresale(String(tt.presalePrice));
      setTtRegular(String(tt.regularPrice));
      setTtPresaleEnd(tt.presaleEnd);
      setTtCapacity(String(tt.capacity));
    } else {
      setEditingTicket(null);
      setTtName('');
      setTtPresale('350');
      setTtRegular('450');
      setTtPresaleEnd('20 Nov 2026, 23:59 CST');
      setTtCapacity('100');
    }
    setTicketDrawerOpen(true);
  };

  const handleSaveTicketType = async (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    if (!selectedEvent) return;
    if (editingTicket && onUpdateTicketType) {
      await onUpdateTicketType(selectedEvent.id, editingTicket.id, {
        name: ttName.trim() || 'General',
        presalePrice: Number(ttPresale) || 0,
        regularPrice: Number(ttRegular) || 0,
        capacity: Number(ttCapacity) || 0,
      });
      setTicketDrawerOpen(false);
      return;
    }
    if (!editingTicket && onAddTicketType) {
      await onAddTicketType(selectedEvent.id, {
        name: ttName.trim() || 'Nuevo boleto',
        presalePrice: Number(ttPresale) || 0,
        regularPrice: Number(ttRegular) || 0,
        capacity: Number(ttCapacity) || 0,
      });
      setTicketDrawerOpen(false);
      return;
    }
    const newTt: TicketType = {
      id: editingTicket ? editingTicket.id : `tt-${Date.now()}`,
      name: ttName.trim() || 'Nuevo boleto',
      presalePrice: Number(ttPresale) || 0,
      regularPrice: Number(ttRegular) || 0,
      presaleEnd: ttPresaleEnd.trim() || 'Sin fecha',
      capacity: Number(ttCapacity) || 0,
      sold: editingTicket ? editingTicket.sold : 0,
      reserved: editingTicket ? editingTicket.reserved : 0,
    };

    const updatedEvents = events.map((evt) => {
      if (evt.id !== selectedEvent.id) return evt;
      const ticketTypes = editingTicket
        ? evt.ticketTypes.map((t) => (t.id === editingTicket.id ? newTt : t))
        : [...evt.ticketTypes, newTt];
      const capacity = ticketTypes.reduce((acc, t) => acc + t.capacity, 0);
      return { ...evt, ticketTypes, capacity };
    });

    onUpdateEvents(updatedEvents);
    setTicketDrawerOpen(false);
  };

  // Event Detail View
  if (selectedEvent) {
    const occupancyPct =
      selectedEvent.capacity > 0
        ? Math.round((selectedEvent.sold / selectedEvent.capacity) * 100)
        : 0;

    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSelectedEventId(null)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Eventos
            </button>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-semibold text-slate-900 dark:text-zinc-100">
                  {selectedEvent.name}
                </h1>
                <EventStatusBadge status={selectedEvent.status} />
              </div>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-slate-500 dark:text-zinc-400 tabular-nums">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {selectedEvent.date} · {selectedEvent.time} ({selectedEvent.timezone})
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {selectedEvent.venue}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onViewEventOrders(selectedEvent.name)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <ShoppingBag className="h-4 w-4" />
              Ver órdenes
            </button>
            <button
              type="button"
              onClick={() => openTicketDrawer()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-emerald-600"
            >
              <Plus className="h-4 w-4" />
              Nuevo tipo de boleto
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
              Ventas cobradas
            </span>
            <div className="mt-1.5 text-2xl font-semibold text-slate-900 tabular-nums dark:text-zinc-100">
              {formatMXN(selectedEvent.revenueMxn)}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
              Ocupación actual
            </span>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-slate-900 tabular-nums dark:text-zinc-100">
                {occupancyPct}%
              </span>
              <span className="text-xs text-slate-500 tabular-nums dark:text-zinc-400">
                ({selectedEvent.sold} / {selectedEvent.capacity} boletos)
              </span>
            </div>
            <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${occupancyPct}%` }}
              />
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
              Órdenes pendientes de pago
            </span>
            <div className="mt-1.5 text-2xl font-semibold text-amber-600 tabular-nums dark:text-amber-400">
              {selectedEvent.pendingOrders}
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
              {selectedEvent.reserved} boletos reservados temporalmente
            </p>
          </div>
        </div>

        {/* Flyer & WhatsApp Promo Message Section */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 dark:border-zinc-800">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-zinc-100">
                <MessageSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                Flyer y Mensaje Promocional para WhatsApp
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
                Cuando el comprador selecciona este evento en WhatsApp, recibe automáticamente este flyer con este mensaje promocional antes de elegir sus boletos.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {flyerToast && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {flyerToast}
                </span>
              )}
              <button
                type="button"
                disabled={savingFlyer}
                onClick={() => void handleSaveFlyerAndMessage()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {savingFlyer ? 'Guardando...' : 'Guardar flyer y mensaje'}
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-12">
            {/* Flyer Upload & Preview */}
            <div className="lg:col-span-4 flex flex-col gap-3">
              <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300">
                Imagen del Flyer (JPG / PNG)
              </label>
              <div className="relative flex min-h-[260px] flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-3 dark:border-zinc-700 dark:bg-zinc-950/50">
                {flyerPreview ? (
                  <img
                    src={
                      flyerPreview.startsWith('data:')
                        ? flyerPreview
                        : `data:image/jpeg;base64,${flyerPreview}`
                    }
                    alt={`Flyer ${selectedEvent.name}`}
                    className="max-h-[320px] w-auto rounded-lg object-contain shadow-sm"
                  />
                ) : (
                  <div className="flex flex-col items-center text-center text-slate-400">
                    <ImageIcon className="h-10 w-10 stroke-1" />
                    <span className="mt-2 text-xs">Sin flyer cargado</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                  <Upload className="h-3.5 w-3.5" />
                  {flyerPreview ? 'Cambiar imagen del flyer' : 'Subir flyer'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFlyerFileChange}
                    className="hidden"
                  />
                </label>
                {flyerPreview && (
                  <button
                    type="button"
                    onClick={() => setFlyerPreview(null)}
                    className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
                  >
                    Quitar
                  </button>
                )}
              </div>
            </div>

            {/* Promotional Message Textarea */}
            <div className="lg:col-span-8 flex flex-col">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300">
                  Texto del mensaje que acompaña al flyer en WhatsApp
                </label>
                <span className="text-[11px] tabular-nums text-slate-400">
                  {promoText.length} / 1024 caracteres
                </span>
              </div>
              <textarea
                rows={13}
                maxLength={1900}
                value={promoText}
                onChange={(e) => setPromoText(e.target.value)}
                placeholder="Escribe aquí el copy promocional con emojis, DJs, fecha, lugar y cover que acompañará al flyer en WhatsApp..."
                className="mt-1.5 w-full flex-1 rounded-xl border border-slate-200 bg-white p-3.5 font-sans text-xs leading-relaxed text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </div>
          </div>
        </div>

        {/* Ticket Types Table */}
        <div className="rounded-xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="border-b border-slate-200 px-5 py-4 dark:border-zinc-800">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
              Tipos de boleto
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-medium text-slate-500 dark:border-zinc-800 dark:text-zinc-400">
                  <th className="px-5 py-3">Nombre</th>
                  <th className="px-5 py-3 text-right">Preventa</th>
                  <th className="px-5 py-3 text-right">Regular</th>
                  <th className="px-5 py-3">Fin preventa</th>
                  <th className="px-5 py-3 text-right">Cupo</th>
                  <th className="px-5 py-3 text-right">Vendidos</th>
                  <th className="px-5 py-3 text-right">Reservados</th>
                  <th className="px-5 py-3 text-right">Disponibles</th>
                  <th className="px-5 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {selectedEvent.ticketTypes.map((tt) => {
                  const available = Math.max(0, tt.capacity - tt.sold - tt.reserved);
                  return (
                    <tr
                      key={tt.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-zinc-800/40"
                    >
                      <td className="px-5 py-3.5 font-medium text-slate-900 dark:text-zinc-100">
                        {tt.name}
                      </td>
                      <td className="px-5 py-3.5 text-right tabular-nums text-slate-700 dark:text-zinc-300">
                        {formatMXN(tt.presalePrice)}
                      </td>
                      <td className="px-5 py-3.5 text-right tabular-nums font-medium text-slate-900 dark:text-zinc-100">
                        {formatMXN(tt.regularPrice)}
                      </td>
                      <td className="px-5 py-3.5 text-xs tabular-nums text-slate-500 dark:text-zinc-400">
                        {tt.presaleEnd}
                      </td>
                      <td className="px-5 py-3.5 text-right tabular-nums text-slate-700 dark:text-zinc-300">
                        {tt.capacity}
                      </td>
                      <td className="px-5 py-3.5 text-right tabular-nums text-emerald-600 font-medium dark:text-emerald-400">
                        {tt.sold}
                      </td>
                      <td className="px-5 py-3.5 text-right tabular-nums text-amber-600 dark:text-amber-400">
                        {tt.reserved}
                      </td>
                      <td className="px-5 py-3.5 text-right tabular-nums font-semibold text-slate-900 dark:text-zinc-100">
                        {available}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => openTicketDrawer(tt)}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          Editar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Ticket Type Drawer */}
        <SlideOverDrawer
          open={ticketDrawerOpen}
          onClose={() => setTicketDrawerOpen(false)}
          title={editingTicket ? 'Editar tipo de boleto' : 'Nuevo tipo de boleto'}
          subtitle={selectedEvent.name}
          footer={
            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setTicketDrawerOpen(false)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveTicketType}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Guardar cambios
              </button>
            </div>
          }
        >
          <form id="ticket-type-form" onSubmit={handleSaveTicketType} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300">
                Nombre del boleto
              </label>
              <input
                type="text"
                required
                value={ttName}
                onChange={(e) => setTtName(e.target.value)}
                placeholder="Ej. General Pista"
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300">
                  Precio preventa (MXN)
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={ttPresale}
                  onChange={(e) => setTtPresale(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm tabular-nums text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300">
                  Precio regular (MXN)
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={ttRegular}
                  onChange={(e) => setTtRegular(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm tabular-nums text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300">
                Fin de preventa
              </label>
              <input
                type="text"
                value={ttPresaleEnd}
                onChange={(e) => setTtPresaleEnd(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm tabular-nums text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300">
                Cupo total
              </label>
              <input
                type="number"
                required
                min={1}
                value={ttCapacity}
                onChange={(e) => setTtCapacity(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm tabular-nums text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>
          </form>
        </SlideOverDrawer>
      </div>
    );
  }

  // Events List View
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-zinc-100">
            Eventos
          </h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-zinc-400">
            Disponibilidad de boletos, cupos y ventas por recinto.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (onCreateEvent) {
              void onCreateEvent().then((id) => {
                if (id) setSelectedEventId(id);
              });
              return;
            }
            const newEvt: EventItem = {
              id: `evt-${Date.now()}`,
              name: 'Nuevo Evento CDMX',
              date: '12 Dic 2026',
              time: '20:00 hrs',
              timezone: 'CST (CDMX)',
              venue: 'Por definir, CDMX',
              city: 'Ciudad de México',
              status: 'draft',
              sold: 0,
              reserved: 0,
              capacity: 100,
              revenueMxn: 0,
              pendingOrders: 0,
              ticketTypes: [
                {
                  id: `tt-${Date.now()}`,
                  name: 'Entrada General',
                  presalePrice: 300,
                  regularPrice: 400,
                  presaleEnd: '05 Dic 2026, 23:59 CST',
                  capacity: 100,
                  sold: 0,
                  reserved: 0,
                },
              ],
            };
            onUpdateEvents([newEvt, ...events]);
            setSelectedEventId(newEvt.id);
          }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-emerald-600"
        >
          <Plus className="h-4 w-4" />
          Crear evento
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar evento o recinto..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>
        <select
          aria-label="Filtrar por estado"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | EventStatus)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
        >
          <option value="all">Todos los estados</option>
          <option value="in_progress">En curso</option>
          <option value="upcoming">Próximo</option>
          <option value="sold_out">Agotado</option>
          <option value="draft">Borrador</option>
          <option value="finished">Finalizado</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <EmptyState
          icon={<Ticket className="h-5 w-5" />}
          title="No hay eventos para mostrar"
          description="Crea tu primer evento para comenzar a vender boletos con CoDi o ajusta los filtros de búsqueda."
          action={
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
              }}
              className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            >
              Limpiar filtros
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredEvents.map((evt) => {
            const pct =
              evt.capacity > 0 ? Math.round((evt.sold / evt.capacity) * 100) : 0;
            const available = Math.max(0, evt.capacity - evt.sold - evt.reserved);
            const fromPrice = Math.min(
              ...evt.ticketTypes.map((ticket) => ticket.presalePrice)
            );
            return (
              <div
                key={evt.id}
                onClick={() => setSelectedEventId(evt.id)}
                className="group flex cursor-pointer flex-col rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-emerald-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-emerald-800"
              >
                <div className="flex h-full flex-col gap-5">
                  {evt.flyerImage && (
                    <div className="h-36 w-full overflow-hidden rounded-lg bg-slate-950/90 flex items-center justify-center">
                      <img
                        src={
                          evt.flyerImage.startsWith('data:')
                            ? evt.flyerImage
                            : `data:image/jpeg;base64,${evt.flyerImage}`
                        }
                        alt={evt.name}
                        className="h-full w-full object-cover opacity-95 transition-transform group-hover:scale-105"
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="text-base font-semibold text-slate-900 group-hover:text-emerald-700 dark:text-zinc-100 dark:group-hover:text-emerald-400">
                        {evt.name}
                      </h3>
                      <EventStatusBadge status={evt.status} />
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-zinc-400 tabular-nums">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {evt.date} · {evt.time}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {evt.venue}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-lg bg-slate-50 px-3.5 py-3 dark:bg-zinc-800/70">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-zinc-400">
                          Desde
                        </p>
                        <p className="mt-0.5 text-lg font-semibold tabular-nums text-slate-900 dark:text-zinc-100">
                          {formatMXN(fromPrice)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-zinc-400">
                          Disponibles
                        </p>
                        <p className="mt-0.5 text-lg font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                          {available}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between text-xs tabular-nums">
                        <span className="text-slate-600 dark:text-zinc-300">
                          {evt.sold} / {evt.capacity} vendidos
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-zinc-100">
                          {pct}%
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
                        <div
                          className={`h-full rounded-full ${
                            pct >= 100 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                      <div className="mt-1 text-[11px] text-slate-400 tabular-nums">
                        {evt.reserved} reservados · {evt.ticketTypes.length}{' '}
                        {evt.ticketTypes.length === 1 ? 'tipo de boleto' : 'tipos de boleto'}
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div
                      className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-zinc-800"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedEventId(evt.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        <Ticket className="h-3.5 w-3.5" />
                        Ver boletos
                      </button>
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          title="Ver órdenes"
                          aria-label={`Ver órdenes de ${evt.name}`}
                          onClick={() => onViewEventOrders(evt.name)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                        >
                          <ShoppingBag className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="Duplicar evento"
                          aria-label={`Duplicar ${evt.name}`}
                          onClick={(e) => handleDuplicate(evt, e)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="Archivar evento"
                          aria-label={`Archivar ${evt.name}`}
                          onClick={() => setArchiveTarget(evt)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50 dark:hover:text-red-400"
                        >
                          <Archive className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(archiveTarget)}
        title="Archivar evento"
        description={`¿Estás segura de archivar "${archiveTarget?.name}"? Dejará de estar visible en la operación diaria.`}
        confirmLabel="Archivar evento"
        destructive
        onCancel={() => setArchiveTarget(null)}
        onConfirm={handleArchiveConfirm}
      />
    </div>
  );
}
