export type NavSection =
  | 'home'
  | 'events'
  | 'orders'
  | 'check_in'
  | 'payments'
  | 'alerts'
  | 'settings';

export type EventStatus = 'upcoming' | 'in_progress' | 'finished' | 'draft' | 'sold_out';

export interface TicketType {
  id: string;
  name: string;
  presalePrice: number;
  regularPrice: number;
  presaleEnd: string;
  capacity: number;
  sold: number;
  reserved: number;
}

export interface EventItem {
  id: string;
  name: string;
  date: string;
  time: string;
  timezone: string;
  venue: string;
  city: string;
  status: EventStatus;
  sold: number;
  reserved: number;
  capacity: number;
  revenueMxn: number;
  pendingOrders: number;
  description?: string;
  flyerImage?: string | null;
  ticketTypes: TicketType[];
}

export type OrderPaymentStatus =
  | 'pending_payment'
  | 'paid'
  | 'ticket_sent'
  | 'expired'
  | 'cancelled'
  | 'manual_review';

export type CheckInStatus = 'pending' | 'checked_in' | 'partial' | 'not_applicable';

export interface OrderTimelineEvent {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface OrderItem {
  id: string;
  reference: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  eventId: string;
  eventName: string;
  ticketType: string;
  quantity: number;
  totalMxn: number;
  paymentStatus: OrderPaymentStatus;
  codiFolio: string | null;
  paymentOrigin: 'CoDi QR' | 'CoDi Push' | 'Transferencia SPEI';
  checkInStatus: CheckInStatus;
  checkInTime?: string;
  accessCode: string;
  createdAt: string;
  expiresAt: string;
  reviewNote?: string | null;
  timeline: OrderTimelineEvent[];
}

export type ReconciliationIssueType =
  | 'late_payment'
  | 'amount_mismatch'
  | 'reference_not_found'
  | 'possible_duplicate'
  | 'ticket_delivery_error';

export type ReconciliationPriority = 'high' | 'medium' | 'low';

export interface ReconciliationCase {
  id: string;
  issueType: ReconciliationIssueType;
  priority: ReconciliationPriority;
  orderReference: string;
  customerName: string;
  customerPhone: string;
  expectedMxn: number;
  receivedMxn: number;
  codiFolio: string;
  detectedAt: string;
  status: 'open' | 'in_review' | 'resolved';
  technicalSummary: string;
  technicalEvents: { timestamp: string; detail: string }[];
  internalNotes: string[];
}

export interface AccessLogEntry {
  id: string;
  accessCode: string;
  holderName: string;
  eventName: string;
  ticketType: string;
  quantity: number;
  timestamp: string;
  result: 'valid' | 'already_used' | 'invalid';
  staffName: string;
}

export interface DailyMetric {
  date: string;
  label: string;
  revenueMxn: number;
  orders: number;
}
