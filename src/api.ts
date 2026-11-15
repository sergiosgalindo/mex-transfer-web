import {
  EventItem,
  EventStatus,
  OrderItem,
  OrderPaymentStatus,
  ReconciliationCase,
  ReconciliationIssueType,
  TicketType,
} from './types';

const CORE_API_URL = import.meta.env.VITE_CORE_API_URL || 'http://localhost:8080';

interface ApiTicket {
  id: string;
  name: string;
  regularPrice: number;
  presalePrice: number | null;
  presaleEndsAt: string | null;
  currentPrice: number;
  capacity: number;
  sold: number;
  reserved: number;
  available: number;
}

interface ApiEvent {
  id: string;
  name: string;
  venue: string;
  startsAt: string;
  category: string;
  description: string;
  flyerImage: string | null;
  ticketTypes: ApiTicket[];
}

interface ApiOrder {
  id: string;
  refNumber: number;
  eventId: string;
  quantity: number;
  customerName: string;
  customerPhone: string;
  amount: number;
  status: string;
  codiQrId: string | null;
  trackingKey: string | null;
  expiresAt: string | null;
  accessCode: string | null;
  checkedInAt: string | null;
  createdAt: string;
  paidAt: string | null;
  eventName: string | null;
  ticketTypeName: string | null;
  reviewNote: string | null;
}

interface ApiAlert {
  id: string;
  orderId: string | null;
  reason: string;
  expectedAmount: number | null;
  receivedAmount: number | null;
  trackingKey: string | null;
  detail: string;
  createdAt: string;
}

interface CheckInResponse {
  admitted: boolean;
  reason: string | null;
  customerName: string | null;
  customerPhone: string | null;
  quantity: number | null;
  checkedInAt: string | null;
  eventName: string | null;
  ticketTypeName: string | null;
}

export interface CreatedEvent {
  id: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${CORE_API_URL}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${path}`);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export function listEvents(): Promise<EventItem[]> {
  return request<ApiEvent[]>('/api/v1/events').then((rows) => rows.map(toEvent));
}

export function listOrders(): Promise<OrderItem[]> {
  return request<ApiOrder[]>('/api/v1/orders').then((rows) => rows.map(toOrder));
}

export function listAlerts(orders: OrderItem[]): Promise<ReconciliationCase[]> {
  return request<ApiAlert[]>('/api/v1/payment-alerts').then((rows) =>
    rows.map((alert) => toAlert(alert, orders))
  );
}

export function createEvent(input: {
  name: string;
  venue: string;
  startsAt: string;
  category: string;
  description: string;
  flyerImage?: string | null;
}): Promise<CreatedEvent> {
  return request<CreatedEvent>('/api/v1/events', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateEventFlyer(
  eventId: string,
  input: {
    description: string;
    flyerImage: string | null;
  }
): Promise<EventItem> {
  return request<ApiEvent>(`/api/v1/events/${eventId}/flyer`, {
    method: 'PUT',
    body: JSON.stringify(input),
  }).then(toEvent);
}

export function addTicketType(
  eventId: string,
  input: {
    name: string;
    regularPrice: number;
    presalePrice: number | null;
    presaleEndsAt: string | null;
    capacity: number;
  }
): Promise<TicketType> {
  return request<ApiTicket>(`/api/v1/events/${eventId}/ticket-types`, {
    method: 'POST',
    body: JSON.stringify(input),
  }).then(toTicket);
}

export function cancelOrder(orderId: string): Promise<void> {
  return request(`/api/v1/orders/${orderId}/cancel`, { method: 'POST' });
}

export function renewOrder(orderId: string): Promise<void> {
  return request(`/api/v1/orders/${orderId}/renew`, { method: 'POST' });
}

export function checkIn(accessCode: string): Promise<CheckInResponse> {
  return request<CheckInResponse>('/api/v1/tickets/check-in', {
    method: 'POST',
    body: JSON.stringify({ accessCode }),
  });
}

function toEvent(event: ApiEvent): EventItem {
  const tickets = (event.ticketTypes || []).map(toTicket);
  const capacity = tickets.reduce((sum, ticket) => sum + ticket.capacity, 0);
  const sold = tickets.reduce((sum, ticket) => sum + ticket.sold, 0);
  const reserved = tickets.reduce((sum, ticket) => sum + ticket.reserved, 0);
  const revenueMxn = tickets.reduce(
    (sum, ticket) => sum + ticket.sold * (ticket.presalePrice || ticket.regularPrice),
    0
  );
  return {
    id: event.id,
    name: event.name,
    date: formatDate(event.startsAt),
    time: formatTime(event.startsAt),
    timezone: 'CST (CDMX)',
    venue: event.venue,
    city: event.venue.includes(',') ? event.venue.split(',').slice(1).join(',').trim() : 'Ciudad de México',
    status: eventStatus(event.startsAt, capacity, sold, reserved),
    sold,
    reserved,
    capacity,
    revenueMxn,
    pendingOrders: 0,
    description: event.description || '',
    flyerImage: event.flyerImage || null,
    ticketTypes: tickets,
  };
}

function toTicket(ticket: ApiTicket): TicketType {
  return {
    id: ticket.id,
    name: ticket.name,
    presalePrice: ticket.presalePrice ?? 0,
    regularPrice: Number(ticket.regularPrice),
    presaleEnd: ticket.presaleEndsAt ? formatDateTime(ticket.presaleEndsAt) : 'Sin preventa',
    capacity: ticket.capacity,
    sold: ticket.sold,
    reserved: ticket.reserved,
  };
}

function toOrder(order: ApiOrder): OrderItem {
  const paymentStatus = toPaymentStatus(order.status);
  const paid = paymentStatus === 'paid' || paymentStatus === 'ticket_sent';
  const timeline: OrderItem['timeline'] = [
    {
      id: `${order.id}-created`,
      timestamp: formatDateTime(order.createdAt),
      title: 'Orden creada',
      description: `${order.quantity} entrada(s) por ${order.customerName}.`,
      type: 'info',
    },
  ];
  if (order.paidAt) {
    timeline.push({
      id: `${order.id}-paid`,
      timestamp: formatDateTime(order.paidAt),
      title: 'Pago CoDi acreditado y boleto enviado',
      description: `Folio CoDi: ${order.trackingKey || '—'} · Acceso: ${order.accessCode || '—'}`,
      type: 'success',
    });
  }
  if (order.reviewNote) {
    timeline.push({
      id: `${order.id}-review-note`,
      timestamp: formatDateTime(order.paidAt || order.createdAt),
      title: 'Nota de revisión en backoffice',
      description: order.reviewNote,
      type: 'warning',
    });
  }
  return {
    id: order.id,
    reference: String(order.refNumber),
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerEmail: '',
    eventId: order.eventId,
    eventName: order.eventName || 'Evento',
    ticketType: order.ticketTypeName || 'Boleto',
    quantity: order.quantity,
    totalMxn: Number(order.amount),
    paymentStatus,
    codiFolio: order.trackingKey,
    paymentOrigin: 'CoDi QR',
    checkInStatus: order.checkedInAt ? 'checked_in' : paid ? 'pending' : 'not_applicable',
    checkInTime: order.checkedInAt ? formatDateTime(order.checkedInAt) : undefined,
    accessCode: order.accessCode || '',
    createdAt: formatDateTime(order.createdAt),
    expiresAt: order.expiresAt ? formatDateTime(order.expiresAt) : '',
    reviewNote: order.reviewNote,
    timeline,
  };
}

function toAlert(alert: ApiAlert, orders: OrderItem[]): ReconciliationCase {
  const order = orders.find((item) => item.id === alert.orderId);
  const notes =
    alert.reason === 'duplicate_payment'
      ? [
          `Nota: Hay un pago duplicado (folio ${alert.trackingKey || '—'}) sobre la orden #${order?.reference || alert.orderId || '—'} que necesita revisión en el backoffice.`,
        ]
      : [];
  return {
    id: alert.id,
    issueType: toIssue(alert.reason),
    priority: alert.reason === 'amount_mismatch' || alert.reason === 'duplicate_payment' ? 'high' : 'medium',
    orderReference: order?.reference || alert.orderId || 'sin orden',
    customerName: order?.customerName || 'Sin titular',
    customerPhone: order?.customerPhone || '',
    expectedMxn: Number(alert.expectedAmount || 0),
    receivedMxn: Number(alert.receivedAmount || 0),
    codiFolio: alert.trackingKey || '',
    detectedAt: formatDateTime(alert.createdAt),
    status: 'open',
    technicalSummary: alert.detail,
    technicalEvents: [{ timestamp: formatDateTime(alert.createdAt), detail: alert.detail || alert.reason }],
    internalNotes: notes,
  };
}

function toPaymentStatus(status: string): OrderPaymentStatus {
  if (status === 'pendiente_de_pago') return 'pending_payment';
  if (status === 'pagada') return 'paid';
  if (status === 'boleto_enviado') return 'ticket_sent';
  if (status === 'expirada') return 'expired';
  if (status === 'cancelada') return 'cancelled';
  return 'manual_review';
}

function toIssue(reason: string): ReconciliationIssueType {
  if (reason === 'late_payment') return 'late_payment';
  if (reason === 'amount_mismatch') return 'amount_mismatch';
  if (reason === 'duplicate_payment') return 'possible_duplicate';
  if (reason === 'notification_failed') return 'ticket_delivery_error';
  return 'reference_not_found';
}

function eventStatus(startsAt: string, capacity: number, sold: number, reserved: number): EventStatus {
  if (capacity > 0 && sold + reserved >= capacity) return 'sold_out';
  if (new Date(startsAt).getTime() < Date.now()) return 'finished';
  return 'upcoming';
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'America/Mexico_City',
  }).format(new Date(value));
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: 'America/Mexico_City',
  }).format(new Date(value));
}

function formatDateTime(value: string): string {
  return `${formatDate(value)}, ${formatTime(value)} CST`;
}
