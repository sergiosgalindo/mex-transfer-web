import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  Calendar,
  ChevronRight,
  CreditCard,
  Home,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  QrCode,
  Search,
  Settings,
  ShoppingBag,
  Sun,
  X,
} from 'lucide-react';
import {
  addTicketType,
  cancelOrder,
  checkIn,
  createEvent,
  listAlerts,
  listEvents,
  listOrders,
  renewOrder,
} from './api';
import {
  AccessLogEntry,
  EventItem,
  NavSection,
  OrderItem,
  ReconciliationCase,
} from './types';
import { DashboardPage } from './pages/DashboardPage';
import { EventsPage } from './pages/EventsPage';
import { OrdersPage } from './pages/OrdersPage';
import { ValidateAccessPage } from './pages/ValidateAccessPage';
import { ReconciliationPage } from './pages/ReconciliationPage';
import { AlertsPage, SettingsPage } from './pages/AlertsAndSettingsPages';

const NAV_GROUPS: {
  label: string;
  items: { id: NavSection; label: string; icon: React.ReactNode }[];
}[] = [
  {
    label: 'Operación',
    items: [
      { id: 'home', label: 'Inicio', icon: <Home className="h-4 w-4" /> },
      { id: 'events', label: 'Eventos', icon: <Calendar className="h-4 w-4" /> },
      { id: 'orders', label: 'Órdenes', icon: <ShoppingBag className="h-4 w-4" /> },
      {
        id: 'check_in',
        label: 'Validar accesos',
        icon: <QrCode className="h-4 w-4" />,
      },
    ],
  },
  {
    label: 'Control',
    items: [
      {
        id: 'payments',
        label: 'Pagos y conciliación',
        icon: <CreditCard className="h-4 w-4" />,
      },
      {
        id: 'alerts',
        label: 'Alertas / revisión manual',
        icon: <AlertTriangle className="h-4 w-4" />,
      },
    ],
  },
  {
    label: 'Configuración',
    items: [
      {
        id: 'settings',
        label: 'Equipo y configuración',
        icon: <Settings className="h-4 w-4" />,
      },
    ],
  },
];

const SECTION_TITLES: Record<NavSection, string> = {
  home: 'Inicio',
  events: 'Eventos',
  orders: 'Órdenes',
  check_in: 'Validar accesos',
  payments: 'Pagos y conciliación',
  alerts: 'Alertas y revisión manual',
  settings: 'Equipo y configuración',
};

export function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<NavSection>('home');
  const [loadingDemo, setLoadingDemo] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Domain state loaded from the Java core.
  const [events, setEvents] = useState<EventItem[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [reconciliationCases, setReconciliationCases] = useState<
    ReconciliationCase[]
  >([]);
  const [accessLogs, setAccessLogs] = useState<AccessLogEntry[]>([]);

  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [ordersEventFilter, setOrdersEventFilter] = useState<string>('all');

  // Global ⌘K search modal
  const [cmdOpen, setCmdOpen] = useState(false);
  const [cmdQuery, setCmdQuery] = useState('');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const refreshCore = async () => {
    setLoadingDemo(true);
    try {
      const [nextEvents, nextOrders] = await Promise.all([listEvents(), listOrders()]);
      const pendingByEvent = new Map<string, number>();
      nextOrders.forEach((order) => {
        if (order.paymentStatus === 'pending_payment') {
          pendingByEvent.set(order.eventId, (pendingByEvent.get(order.eventId) || 0) + 1);
        }
      });
      setEvents(
        nextEvents.map((event) => ({
          ...event,
          pendingOrders: pendingByEvent.get(event.id) || 0,
        }))
      );
      setOrders(nextOrders);
      setReconciliationCases(await listAlerts(nextOrders));
      setApiError(null);
    } catch {
      setApiError('No se pudo cargar el core. Revisa que el API esté en marcha.');
    } finally {
      setLoadingDemo(false);
    }
  };

  useEffect(() => {
    void refreshCore();
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setCmdOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const openAlertsCount = reconciliationCases.filter(
    (c) => c.status !== 'resolved'
  ).length;

  const handleValidateAccess = async (code: string) => {
    try {
      const result = await checkIn(code);
      const match = orders.find((order) => order.accessCode.toUpperCase() === code);
      const shown: OrderItem = {
        ...(match || emptyOrder(code)),
        customerName: result.customerName || match?.customerName || '',
        customerPhone: result.customerPhone || match?.customerPhone || '',
        eventName: result.eventName || match?.eventName || '',
        ticketType: result.ticketTypeName || match?.ticketType || '',
        quantity: result.quantity || match?.quantity || 0,
        accessCode: code,
        checkInTime: result.checkedInAt || match?.checkInTime,
      };
      if (result.admitted) {
        setAccessLogs((prev) => [accessLog(shown, 'valid'), ...prev]);
        void refreshCore();
        return { status: 'valid' as const, order: { ...shown, checkInStatus: 'checked_in' as const } };
      }
      if (result.reason === 'already_checked_in') {
        setAccessLogs((prev) => [accessLog(shown, 'already_used'), ...prev]);
        return {
          status: 'already_used' as const,
          order: shown,
          previousTime: result.checkedInAt || shown.checkInTime,
        };
      }
      const reason =
        result.reason === 'not_paid'
          ? 'La orden no está pagada. No tiene acceso autorizado.'
          : `El código ${code} no existe.`;
      return { status: 'invalid' as const, order: result.customerName ? shown : undefined, reason };
    } catch {
      return {
        status: 'invalid' as const,
        reason: 'No se pudo validar el código con el core.',
      };
    }
  };

  const handleCreateEvent = async () => {
    const created = await createEvent({
      name: 'Nuevo Evento CDMX',
      venue: 'Por definir, CDMX',
      startsAt: '2026-12-13T02:00:00Z',
      category: 'social',
      description: 'Evento creado desde el backoffice.',
    });
    await addTicketType(created.id, {
      name: 'Entrada General',
      regularPrice: 400,
      presalePrice: 300,
      presaleEndsAt: '2026-12-06T05:59:00Z',
      capacity: 100,
    });
    await refreshCore();
    return created.id;
  };

  const emptyOrder = (code: string): OrderItem => ({
    id: code,
    reference: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    eventId: '',
    eventName: '',
    ticketType: '',
    quantity: 0,
    totalMxn: 0,
    paymentStatus: 'paid',
    codiFolio: null,
    paymentOrigin: 'CoDi QR',
    checkInStatus: 'pending',
    accessCode: code,
    createdAt: '',
    expiresAt: '',
    timeline: [],
  });

  const accessLog = (order: OrderItem, result: AccessLogEntry['result']): AccessLogEntry => ({
    id: `acc-${Date.now()}`,
    accessCode: order.accessCode,
    holderName: order.customerName,
    eventName: order.eventName,
    ticketType: order.ticketType,
    quantity: order.quantity,
    timestamp: new Date().toISOString(),
    result,
    staffName: 'Puerta',
  });

  const cmdResults = cmdQuery.trim()
    ? orders
        .filter(
          (o) =>
            o.reference.toLowerCase().includes(cmdQuery.toLowerCase()) ||
            o.customerName.toLowerCase().includes(cmdQuery.toLowerCase()) ||
            o.customerPhone.includes(cmdQuery) ||
            o.eventName.toLowerCase().includes(cmdQuery.toLowerCase()) ||
            (o.codiFolio &&
              o.codiFolio.toLowerCase().includes(cmdQuery.toLowerCase()))
        )
        .slice(0, 6)
    : orders.slice(0, 4);

  const SidebarContent = () => (
    <div className="flex h-full flex-col justify-between">
      <div>
        {/* Logo */}
        <div className="flex h-14 items-center justify-between border-b border-slate-200 px-4 dark:border-zinc-800">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-xs font-bold text-white">
              C
            </div>
            {!sidebarCollapsed && (
              <span className="truncate text-sm font-semibold tracking-tight text-slate-900 dark:text-zinc-100">
                CoDi Eventos
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setSidebarCollapsed((c) => !c)}
            aria-label={
              sidebarCollapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'
            }
            className="hidden rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:inline-flex dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Nav Groups */}
        <nav className="space-y-5 px-2.5 py-4" aria-label="Navegación principal">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              {!sidebarCollapsed && (
                <div className="mb-1.5 px-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  {group.label}
                </div>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveSection(item.id);
                        setMobileMenuOpen(false);
                      }}
                      title={sidebarCollapsed ? item.label : undefined}
                      className={`relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-emerald-50/90 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                          : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100'
                      }`}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-emerald-600 dark:bg-emerald-400" />
                      )}
                      <span
                        className={
                          isActive
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-400 dark:text-zinc-500'
                        }
                      >
                        {item.icon}
                      </span>
                      {!sidebarCollapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                      {!sidebarCollapsed &&
                        item.id === 'alerts' &&
                        openAlertsCount > 0 && (
                          <span className="ml-auto rounded-full bg-violet-100 px-1.5 py-0.5 text-[11px] font-semibold text-violet-700 tabular-nums dark:bg-violet-950 dark:text-violet-300">
                            {openAlertsCount}
                          </span>
                        )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* User Profile */}
      <div className="border-t border-slate-200 p-3 dark:border-zinc-800">
        <div className="flex items-center gap-2.5 rounded-lg p-1.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            ML
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold text-slate-900 dark:text-zinc-100">
                Mariana López
              </div>
              <div className="truncate text-[11px] text-slate-500 dark:text-zinc-400">
                Organizadora
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900 dark:bg-[#09090B] dark:text-zinc-100">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden shrink-0 border-r border-slate-200 bg-white transition-all duration-200 lg:block dark:border-zinc-800 dark:bg-zinc-950 ${
          sidebarCollapsed ? 'w-16' : 'w-60'
        }`}
      >
        <div className="sticky top-0 h-screen">
          <SidebarContent />
        </div>
      </aside>

      {/* Mobile / Tablet Sidebar Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px]"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative z-10 w-64 border-r border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur-sm sm:px-6 dark:border-zinc-800 dark:bg-zinc-950/90">
          {/* Left: Mobile menu + Breadcrumbs */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Abrir menú"
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              <Menu className="h-5 w-5" />
            </button>
            <nav
              aria-label="Breadcrumb"
              className="hidden items-center gap-1.5 text-xs sm:flex"
            >
              <span className="text-slate-400 dark:text-zinc-500">
                CoDi Eventos
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-300 dark:text-zinc-600" />
              <span className="font-medium text-slate-900 dark:text-zinc-100">
                {SECTION_TITLES[activeSection]}
              </span>
            </nav>
          </div>

          {/* Center: Global Search */}
          <button
            type="button"
            onClick={() => setCmdOpen(true)}
            className="flex w-full max-w-md items-center justify-between rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-xs text-slate-400 transition-colors hover:border-slate-300 hover:bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-500 dark:hover:border-zinc-700"
          >
            <span className="flex items-center gap-2 truncate">
              <Search className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                Buscar orden, teléfono, folio o evento…
              </span>
            </span>
            <kbd className="hidden rounded border border-slate-200 bg-white px-1.5 py-0.5 font-sans text-[10px] font-medium text-slate-500 sm:inline-block dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
              ⌘ K
            </kbd>
          </button>

          {/* Right: Org selector, Skeleton demo, Notifications, Theme */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setLoadingDemo((l) => !l)}
              title="Alternar estado de carga (Skeleton)"
              className={`hidden rounded-lg border px-2.5 py-1 text-xs font-medium sm:inline-flex ${
                loadingDemo
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400'
              }`}
            >
              {loadingDemo ? 'Cargando…' : 'Skeleton'}
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('alerts')}
              aria-label="Notificaciones"
              className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            >
              <Bell className="h-4 w-4" />
              {openAlertsCount > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-violet-600" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setDarkMode((d) => !d)}
              aria-label={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            >
              {darkMode ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 lg:p-8">
          {apiError && (
            <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {apiError}
            </p>
          )}
          {activeSection === 'home' && (
            <DashboardPage
              events={events}
              orders={orders}
              reconciliationCases={reconciliationCases}
              loading={loadingDemo}
              onNavigate={setActiveSection}
              onSelectOrder={(ord) => {
                setSelectedOrder(ord);
                setActiveSection('orders');
              }}
            />
          )}

          {activeSection === 'events' && (
            <EventsPage
              events={events}
              loading={loadingDemo}
              onUpdateEvents={setEvents}
              onCreateEvent={handleCreateEvent}
              onAddTicketType={async (eventId, ticket) => {
                await addTicketType(eventId, {
                  name: ticket.name,
                  regularPrice: ticket.regularPrice,
                  presalePrice: ticket.presalePrice || null,
                  presaleEndsAt: null,
                  capacity: ticket.capacity,
                });
                await refreshCore();
              }}
              onViewEventOrders={(eventName) => {
                setOrdersEventFilter(eventName);
                setActiveSection('orders');
              }}
            />
          )}

          {activeSection === 'orders' && (
            <OrdersPage
              orders={orders}
              events={events}
              loading={loadingDemo}
              initialEventFilter={ordersEventFilter}
              selectedOrder={selectedOrder}
              onSelectOrder={setSelectedOrder}
              onUpdateOrder={(updated) =>
                setOrders((prev) =>
                  prev.map((o) => (o.id === updated.id ? updated : o))
                )
              }
              onCancelOrder={async (order) => {
                await cancelOrder(order.id);
                await refreshCore();
              }}
              onRenewOrder={async (order) => {
                await renewOrder(order.id);
                await refreshCore();
              }}
            />
          )}

          {activeSection === 'check_in' && (
            <ValidateAccessPage
              orders={orders}
              accessLogs={accessLogs}
              onValidateAccess={handleValidateAccess}
              onSearchOrder={() => setActiveSection('orders')}
            />
          )}

          {activeSection === 'payments' && (
            <ReconciliationPage
              cases={reconciliationCases}
              loading={loadingDemo}
              onUpdateCase={(updated) =>
                setReconciliationCases((prev) =>
                  prev.map((c) => (c.id === updated.id ? updated : c))
                )
              }
            />
          )}

          {activeSection === 'alerts' && (
            <AlertsPage
              cases={reconciliationCases}
              onNavigate={setActiveSection}
            />
          )}

          {activeSection === 'settings' && <SettingsPage />}
        </main>
      </div>

      {/* Global ⌘K Command Modal */}
      {cmdOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px] dark:bg-black/65"
            onClick={() => setCmdOpen(false)}
          />
          <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center border-b border-slate-200 px-3.5 dark:border-zinc-800">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                autoFocus
                value={cmdQuery}
                onChange={(e) => setCmdQuery(e.target.value)}
                placeholder="Buscar orden, teléfono, folio CoDi o evento..."
                className="w-full bg-transparent px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-zinc-100"
              />
              <button
                type="button"
                onClick={() => setCmdOpen(false)}
                className="rounded p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-72 overflow-y-auto p-2">
              {cmdResults.map((ord) => (
                <button
                  key={ord.id}
                  type="button"
                  onClick={() => {
                    setSelectedOrder(ord);
                    setActiveSection('orders');
                    setCmdOpen(false);
                  }}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm hover:bg-slate-100 dark:hover:bg-zinc-900"
                >
                  <div>
                    <div className="font-medium text-slate-900 dark:text-zinc-100">
                      {ord.reference} · {ord.customerName}
                    </div>
                    <div className="text-xs text-slate-500 tabular-nums dark:text-zinc-400">
                      {ord.eventName} · {ord.customerPhone}
                    </div>
                  </div>
                  <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400">
                    {ord.accessCode}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
