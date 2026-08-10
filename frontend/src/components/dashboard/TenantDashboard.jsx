import React, { useState, useEffect } from 'react';
import { LogOut, Zap, FileText, CheckCircle2, AlertCircle, Clock, Home, ChevronDown, ChevronUp, Download } from 'lucide-react';

export const TenantDashboard = ({ user, onLogout }) => {
  const [bills, setBills] = useState([]);
  const [expandedBill, setExpandedBill] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('bap_bills');
    if (saved) {
      const all = JSON.parse(saved);
      // Filtrar solo los recibos de esta unidad
      const mine = all.filter(b =>
        b.propertyId === user?.unit ||
        b.unit === user?.unit ||
        b.tenant === user?.name
      );
      setBills(mine.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    }
  }, [user]);

  const formatCOP = (val) => {
    if (!val && val !== 0) return '$0';
    return '$' + Number(val).toLocaleString('es-CO');
  };

  const latestBill = bills[0];

  const statusConfig = (status) => {
    switch (status) {
      case 'Pagado': return { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Pagado' };
      case 'Atrasado': return { icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', label: 'Vencido' };
      default: return { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Pendiente de pago' };
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const isOverdue = (dueDate) => dueDate && dueDate < today;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <nav className="bg-white border-b border-slate-200 px-6 py-3.5 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="bg-slate-950 text-white p-2 rounded-lg">
            <Zap size={18} />
          </div>
          <div>
            <h1 className="font-bold text-sm leading-tight">Mi Recibo de Luz</h1>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Portal Arrendatario</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline text-xs text-slate-500 font-medium">{user?.name}</span>
          <button onClick={onLogout} className="flex items-center gap-1.5 text-slate-500 hover:text-rose-600 transition-colors text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-lg hover:bg-slate-100">
            <LogOut size={15} /> Salir
          </button>
        </div>
      </nav>

      <main className="p-4 md:p-8 max-w-3xl mx-auto w-full space-y-6">
        {/* Bienvenida */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Hola, {user?.name || 'Arrendatario'}</h2>
          <p className="text-slate-500 text-sm mt-1">Aquí puedes consultar tus recibos de energía y aseo.</p>
        </div>

        {/* Recibo Actual */}
        {latestBill ? (
          <div className={`bg-white rounded-xl border shadow-sm overflow-hidden ${
            latestBill.status === 'Pagado' ? 'border-emerald-200' :
            isOverdue(latestBill.dueDate) ? 'border-rose-200' : 'border-amber-200'
          }`}>
            <div className={`px-6 py-4 border-b flex items-center justify-between ${
              latestBill.status === 'Pagado' ? 'bg-emerald-50/50 border-emerald-100' :
              isOverdue(latestBill.dueDate) ? 'bg-rose-50/50 border-rose-100' : 'bg-amber-50/50 border-amber-100'
            }`}>
              <div className="flex items-center gap-2">
                <FileText size={18} className={latestBill.status === 'Pagado' ? 'text-emerald-600' : isOverdue(latestBill.dueDate) ? 'text-rose-600' : 'text-amber-600'} />
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Recibo Actual</h3>
                  <p className="text-[11px] text-slate-500">Período: {latestBill.periodStart} al {latestBill.periodEnd}</p>
                </div>
              </div>
              {(() => {
                const cfg = statusConfig(latestBill.status);
                const Icon = cfg.icon;
                return (
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                    <Icon size={13} /> {cfg.label}
                  </span>
                );
              })()}
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Lectura Anterior</span>
                  <span className="font-mono font-bold text-slate-900 text-lg">{latestBill.prevReading} <span className="text-xs font-normal text-slate-400">kWh</span></span>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Lectura Actual</span>
                  <span className="font-mono font-bold text-slate-900 text-lg">{latestBill.currReading} <span className="text-xs font-normal text-slate-400">kWh</span></span>
                </div>
              </div>

              <div className="bg-indigo-50/50 rounded-lg p-4 border border-indigo-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-bold text-indigo-500">Consumo Calculado</span>
                  <span className="font-mono font-extrabold text-indigo-700 text-xl">{latestBill.consumption} kWh</span>
                </div>
                <div className="w-full bg-indigo-100 rounded-full h-1.5">
                  <div className="bg-indigo-500 h-1.5 rounded-full transition-all" style={{ width: `${Math.min(100, (latestBill.consumption / 500) * 100)}%` }} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm py-1.5 border-b border-slate-50">
                  <span className="text-slate-500">Tarifa kWh</span>
                  <span className="font-mono text-slate-700">{formatCOP(latestBill.kwhRate)}</span>
                </div>
                <div className="flex justify-between text-sm py-1.5 border-b border-slate-50">
                  <span className="text-slate-500">Valor Energía</span>
                  <span className="font-mono font-bold text-slate-900">{formatCOP(latestBill.energyTotal)}</span>
                </div>
                <div className="flex justify-between text-sm py-1.5 border-b border-slate-50">
                  <span className="text-slate-500">Aseo / Otros</span>
                  <span className="font-mono text-slate-700">{formatCOP(latestBill.trashCost)}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-sm font-bold text-slate-900">Total a Pagar</span>
                  <span className="font-mono font-extrabold text-slate-900 text-2xl">{formatCOP(latestBill.total)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <CalendarIcon />
                  <span className="text-xs text-slate-500">Fecha límite: <span className="font-mono font-bold text-slate-700">{latestBill.dueDate}</span></span>
                </div>
                {latestBill.status !== 'Pagado' && (
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                    isOverdue(latestBill.dueDate) ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {isOverdue(latestBill.dueDate) ? 'Vencido' : 'En plazo'}
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
            <Zap size={32} className="text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-medium">Aún no tienes recibos generados.</p>
            <p className="text-xs text-slate-400 mt-1">El administrador debe generar tu primer recibo desde el panel.</p>
          </div>
        )}

        {/* Historial */}
        <div>
          <h3 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
            <FileText size={16} className="text-slate-400" /> Historial de Recibos
          </h3>

          {bills.length <= 1 ? (
            <p className="text-xs text-slate-400">No hay recibos anteriores para mostrar.</p>
          ) : (
            <div className="space-y-2">
              {bills.slice(1).map((bill) => {
                const cfg = statusConfig(bill.status);
                const Icon = cfg.icon;
                const isOpen = expandedBill === bill.id;
                return (
                  <div key={bill.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <button
                      onClick={() => setExpandedBill(isOpen ? null : bill.id)}
                      className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                          <Icon size={11} /> {cfg.label}
                        </span>
                        <span className="text-sm font-bold text-slate-900">{bill.periodStart} → {bill.periodEnd}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-slate-900 text-sm">{formatCOP(bill.total)}</span>
                        {isOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-4 pt-1 border-t border-slate-100 space-y-2">
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                            <span className="text-slate-400 block mb-0.5">Consumo</span>
                            <span className="font-mono font-bold text-slate-900">{bill.consumption} kWh</span>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                            <span className="text-slate-400 block mb-0.5">Tarifa</span>
                            <span className="font-mono font-bold text-slate-900">{formatCOP(bill.kwhRate)}</span>
                          </div>
                        </div>
                        <div className="flex justify-between text-xs py-1">
                          <span className="text-slate-500">Energía:</span>
                          <span className="font-mono text-slate-700">{formatCOP(bill.energyTotal)}</span>
                        </div>
                        <div className="flex justify-between text-xs py-1">
                          <span className="text-slate-500">Aseo:</span>
                          <span className="font-mono text-slate-700">{formatCOP(bill.trashCost)}</span>
                        </div>
                        <div className="flex justify-between text-xs py-1 border-t border-slate-100 pt-2">
                          <span className="text-slate-500">Límite de pago:</span>
                          <span className="font-mono text-slate-700">{bill.dueDate}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}