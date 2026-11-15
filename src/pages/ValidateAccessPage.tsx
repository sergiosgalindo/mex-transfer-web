import React, { useState } from 'react';
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  QrCode,
  Search,
  ShieldAlert,
  Ticket,
  XCircle,
} from 'lucide-react';
import { AccessLogEntry, OrderItem } from '../types';

interface ValidateAccessPageProps {
  orders: OrderItem[];
  accessLogs: AccessLogEntry[];
  onValidateAccess: (code: string) => Promise<{
    status: 'valid' | 'already_used' | 'invalid';
    order?: OrderItem;
    reason?: string;
    previousTime?: string;
  }>;
  onSearchOrder: (query: string) => void;
}

export function ValidateAccessPage({
  accessLogs,
  onValidateAccess,
  onSearchOrder,
}: ValidateAccessPageProps) {
  const [manualCode, setManualCode] = useState('');
  const [scanResult, setScanResult] = useState<{
    status: 'idle' | 'valid' | 'already_used' | 'invalid';
    order?: OrderItem;
    reason?: string;
    previousTime?: string;
    checkedCode?: string;
  }>({ status: 'idle' });

  const handleCheckCode = (codeToTest: string) => {
    const clean = codeToTest.trim().toUpperCase();
    if (!clean) return;
    void onValidateAccess(clean).then((res) => {
      setScanResult({
        ...res,
        checkedCode: clean,
      });
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleCheckCode(manualCode);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-zinc-100">
            Validar accesos
          </h1>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-zinc-400">
            Control de puerta rápido para lectura de QR y códigos de entrada.
          </p>
        </div>

        {/* Quick demo triggers for testing all states */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-slate-400 mr-1">Simular:</span>
          <button
            type="button"
            onClick={() => {
              setManualCode('SLSA-4829-MX');
              handleCheckCode('SLSA-4829-MX');
            }}
            className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
          >
            QR válido
          </button>
          <button
            type="button"
            onClick={() => {
              setManualCode('ACST-7731-MX');
              handleCheckCode('ACST-7731-MX');
            }}
            className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-950/60 dark:text-red-300"
          >
            Ya utilizado
          </button>
          <button
            type="button"
            onClick={() => {
              setManualCode('MZCL-1094-MX');
              handleCheckCode('MZCL-1094-MX');
            }}
            className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
          >
            Expirado / inválido
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Main Scanner & Result Area */}
        <div className="space-y-5 lg:col-span-7">
          {/* Camera / Scanner Box */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/80 px-6 py-10 text-center dark:border-zinc-700 dark:bg-zinc-950/60">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                <Camera className="h-7 w-7" />
              </div>
              <h2 className="mt-3 text-base font-semibold text-slate-900 dark:text-zinc-100">
                Escanea el QR de entrada
              </h2>
              <p className="mt-1 max-w-xs text-xs text-slate-500 dark:text-zinc-400">
                Apunta la cámara de la tablet al boleto del asistente o captura el código manualmente abajo.
              </p>
            </div>

            {/* Manual Input */}
            <form onSubmit={handleSubmit} className="mt-4 flex gap-2.5">
              <div className="relative flex-1">
                <QrCode className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Capturar o pegar código (ej. SLSA-4829-MX)"
                  className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-3 font-mono text-sm uppercase text-slate-900 placeholder:normal-case placeholder:font-sans placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                />
              </div>
              <button
                type="submit"
                className="rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-emerald-600"
              >
                Validar
              </button>
            </form>
          </div>

          {/* Result Banner */}
          {scanResult.status === 'valid' && scanResult.order && (
            <div
              role="status"
              className="rounded-xl border-2 border-emerald-500 bg-emerald-50 p-6 dark:border-emerald-500/80 dark:bg-emerald-950/50"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-9 w-9 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                      Confirmación de puerta
                    </span>
                    <h3 className="text-2xl font-bold text-emerald-950 dark:text-emerald-50">
                      Acceso válido
                    </h3>
                  </div>
                </div>
                <div className="rounded-xl bg-emerald-600 px-4 py-2 text-center text-white">
                  <div className="text-[11px] font-medium uppercase tracking-wider opacity-90">
                    Entradas
                  </div>
                  <div className="text-3xl font-bold tabular-nums leading-none mt-0.5">
                    {scanResult.order.quantity}
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 border-t border-emerald-200/80 pt-4 text-sm sm:grid-cols-2 dark:border-emerald-800/60">
                <div>
                  <span className="text-xs text-emerald-700 dark:text-emerald-300">
                    Titular
                  </span>
                  <div className="font-semibold text-emerald-950 dark:text-emerald-50">
                    {scanResult.order.customerName}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-emerald-700 dark:text-emerald-300">
                    Evento y boleto
                  </span>
                  <div className="font-medium text-emerald-950 dark:text-emerald-50">
                    {scanResult.order.eventName} · {scanResult.order.ticketType}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-emerald-700 dark:text-emerald-300">
                    Hora de check-in
                  </span>
                  <div className="font-mono text-xs font-medium tabular-nums text-emerald-900 dark:text-emerald-100">
                    14 Nov 2026, 15:29 CST
                  </div>
                </div>
                <div>
                  <span className="text-xs text-emerald-700 dark:text-emerald-300">
                    Código de acceso
                  </span>
                  <div className="font-mono text-xs font-semibold tabular-nums text-emerald-900 dark:text-emerald-100">
                    {scanResult.order.accessCode}
                  </div>
                </div>
              </div>
            </div>
          )}

          {scanResult.status === 'already_used' && (
            <div
              role="alert"
              className="rounded-xl border-2 border-red-500 bg-red-50 p-6 dark:border-red-500/80 dark:bg-red-950/50"
            >
              <div className="flex items-start gap-3">
                <XCircle className="h-9 w-9 shrink-0 text-red-600 dark:text-red-400" />
                <div>
                  <h3 className="text-xl font-bold text-red-950 dark:text-red-50">
                    QR ya utilizado
                  </h3>
                  <p className="mt-1 text-sm text-red-800 dark:text-red-200">
                    Este boleto ya registró su ingreso anteriormente el{' '}
                    <span className="font-semibold tabular-nums">
                      {scanResult.previousTime}
                    </span>
                    .
                  </p>
                  {scanResult.order && (
                    <p className="mt-2 text-xs text-red-700 dark:text-red-300">
                      Titular: {scanResult.order.customerName} ({scanResult.order.quantity}{' '}
                      entradas · {scanResult.order.eventName})
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {scanResult.status === 'invalid' && (
            <div
              role="alert"
              className="rounded-xl border-2 border-amber-500 bg-amber-50 p-6 dark:border-amber-500/80 dark:bg-amber-950/50"
            >
              <div className="flex items-start gap-3">
                <ShieldAlert className="h-9 w-9 shrink-0 text-amber-600 dark:text-amber-400" />
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-amber-950 dark:text-amber-50">
                    Acceso no válido
                  </h3>
                  <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">
                    {scanResult.reason}
                  </p>
                  <button
                    type="button"
                    onClick={() => onSearchOrder(scanResult.checkedCode || '')}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3.5 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100/60 dark:border-amber-700 dark:bg-zinc-900 dark:text-amber-200"
                  >
                    <Search className="h-3.5 w-3.5" />
                    Buscar orden en Órdenes
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recent Validations History */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
              Últimos accesos validados
            </h2>
            <span className="text-xs text-slate-500 tabular-nums dark:text-zinc-400">
              {accessLogs.length} registros
            </span>
          </div>

          <div className="mt-4 space-y-2.5">
            {accessLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-slate-100 p-3 dark:border-zinc-800"
              >
                <div className="flex items-start gap-2.5">
                  {log.result === 'valid' ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  ) : log.result === 'already_used' ? (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                  ) : (
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  )}
                  <div>
                    <div className="text-sm font-medium text-slate-900 dark:text-zinc-100">
                      {log.holderName}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-zinc-400">
                      {log.eventName} · {log.quantity}× {log.ticketType}
                    </div>
                    <div className="mt-0.5 font-mono text-[11px] text-slate-400 tabular-nums">
                      {log.accessCode} · {log.timestamp}
                    </div>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium ${
                    log.result === 'valid'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                      : log.result === 'already_used'
                      ? 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300'
                      : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                  }`}
                >
                  <Ticket className="h-3 w-3" />
                  {log.result === 'valid'
                    ? 'Válido'
                    : log.result === 'already_used'
                    ? 'Duplicado'
                    : 'Inválido'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
