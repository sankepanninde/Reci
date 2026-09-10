import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { formatCOP, formatDate } from '../../../utils/dashboardUtils';

export default function PaymentReportTab({ bills, loadTenantData }) {
  const [selectedBill, setSelectedBill] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('bancolombia');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // Seleccionar automáticamente el primer recibo pendiente sin comprobante
    const pending = bills.find(b => b.status !== 'Pagado' && !b.paymentProof);
    if (pending) {
      setSelectedBill(pending);
      setPaymentAmount(pending.total.toString());
    }
  }, [bills]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBill) return;

    try {
      const payload = {
        status: 'Pendiente',
        paymentProof: {
          method: paymentMethod,
          date: paymentDate,
          reference: paymentReference,
          amount: parseFloat(paymentAmount),
          notes: paymentNotes,
        },
      };
      await api.put(`/bills/${selectedBill.id}`, payload);
      setShowSuccess(true);
      setPaymentReference('');
      setPaymentNotes('');
      if (loadTenantData) await loadTenantData();
      setTimeout(() => setShowSuccess(false), 4000);
    } catch (error) {
      console.error('Error reportando pago', error);
    }
  };

  const paymentMethods = [
    { id: 'bancolombia', label: 'Bancolombia', icon: 'account_balance' },
    { id: 'nequi', label: 'Nequi', icon: 'smartphone' },
    { id: 'daviplata', label: 'Daviplata', icon: 'send_to_mobile' },
    { id: 'corresponsal', label: 'Corresponsal', icon: 'storefront' },
    { id: 'efectivo', label: 'Efectivo', icon: 'payments' },
  ];

  const history = bills.map(bill => {
    const proof = typeof bill.paymentProof === 'string' ? JSON.parse(bill.paymentProof) : bill.paymentProof;
    return {
      id: bill.id,
      amount: bill.total,
      date: proof?.date || bill.createdAt?.slice(0,10) || '—',
      status: bill.status,
      reference: proof?.reference || '—',
      notes: proof?.notes || '',
    };
  });

  return (
    <div className="space-y-8">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-glass-stroke">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-on-surface">Reportar Pago</h1>
          <p className="text-on-surface-variant mt-1">Registra tu comprobante para validación contable.</p>
        </div>
        {selectedBill && (
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-electric-blue/20 text-vibrant-cyan border border-vibrant-cyan/30">
              Factura vigente: {selectedBill.periodStart} a {selectedBill.periodEnd}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Columna izquierda: formulario */}
        <div className="col-span-12 lg:col-span-8 space-y-4">
          {/* Tarjeta resumen del recibo pendiente */}
          {selectedBill && (
            <div className="glass-card kinetic-border shimmer-element rounded-xl p-6 shadow-2xl relative overflow-hidden group hover:border-vibrant-cyan/40">
              <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-electric-blue/15 rounded-full blur-3xl pointer-events-none"></div>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-glass-stroke relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-midnight-slate border border-glass-stroke flex items-center justify-center text-vibrant-cyan">
                    <span className="material-symbols-outlined text-2xl">receipt_long</span>
                  </div>
                  <div>
                    <span className="text-xs text-outline">FACTURA POR SERVICIOS</span>
                    <h2 className="text-xl font-semibold text-on-surface">{selectedBill.periodStart} a {selectedBill.periodEnd}</h2>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs bg-electric-blue/20 text-vibrant-cyan border border-vibrant-cyan/30">
                  Pendiente de validación
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 relative z-10">
                <div>
                  <span className="text-xs text-on-surface-variant block">Total a pagar</span>
                  <p className="text-2xl font-bold text-on-surface">{formatCOP(selectedBill.total)}</p>
                </div>
                <div>
                  <span className="text-xs text-on-surface-variant block">Fecha límite</span>
                  <p className="text-lg font-semibold text-on-surface">{formatDate(selectedBill.dueDate)}</p>
                </div>
                <div className="sm:text-right">
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(selectedBill.total.toString())}
                    className="px-4 py-2 rounded-lg bg-surface-container-high text-vibrant-cyan border border-vibrant-cyan/40 text-sm hover:bg-surface-bright"
                  >
                    Usar monto total
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="glass-card rounded-xl p-6 space-y-5">
            <h3 className="text-lg font-semibold text-on-surface">Formulario de Registro de Comprobante</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-on-surface-variant mb-1">Monto *</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                  className="w-full bg-midnight-slate border border-glass-stroke rounded-lg px-3 py-2 text-on-surface focus:outline-none focus:border-vibrant-cyan"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-on-surface-variant mb-1">Fecha de consignación *</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={e => setPaymentDate(e.target.value)}
                  className="w-full bg-midnight-slate border border-glass-stroke rounded-lg px-3 py-2 text-on-surface focus:outline-none focus:border-vibrant-cyan"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-on-surface-variant mb-2">Método de pago *</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {paymentMethods.map(method => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.id)}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      paymentMethod === method.id
                        ? 'border-vibrant-cyan bg-secondary-container/20 text-vibrant-cyan shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                        : 'border-glass-stroke bg-midnight-slate text-on-surface-variant hover:border-vibrant-cyan/50'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xl mb-1">{method.icon}</span>
                    <span className="block text-xs font-semibold">{method.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-on-surface-variant mb-1">Número de referencia / Aprobación *</label>
              <input
                type="text"
                value={paymentReference}
                onChange={e => setPaymentReference(e.target.value)}
                placeholder="Ej: BC-984210"
                className="w-full bg-midnight-slate border border-glass-stroke rounded-lg px-3 py-2 text-on-surface focus:outline-none focus:border-vibrant-cyan"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-on-surface-variant mb-1">Notas (opcional)</label>
              <textarea
                value={paymentNotes}
                onChange={e => setPaymentNotes(e.target.value)}
                rows={2}
                placeholder="Ej: Pago realizado desde cuenta titular..."
                className="w-full bg-midnight-slate border border-glass-stroke rounded-lg px-3 py-2 text-on-surface focus:outline-none focus:border-vibrant-cyan resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-lg bg-secondary-container text-on-surface font-bold hover:bg-electric-blue transition-all"
            >
              Enviar Comprobante para Verificación
            </button>

            {showSuccess && (
              <p className="text-center text-emerald-400">Comprobante enviado correctamente.</p>
            )}
          </form>
        </div>

        {/* Columna derecha: historial */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <div className="glass-card rounded-xl p-6 border border-glass-stroke">
            <div className="flex items-center justify-between pb-3 border-b border-glass-stroke">
              <h3 className="text-lg font-semibold text-on-surface">Historial de Reportes</h3>
              <span className="text-xs text-outline">{history.length} registros</span>
            </div>
            <div className="space-y-3">
              {history.map(item => (
                <div key={item.id} className="p-3 rounded-lg bg-surface-container-low border border-glass-stroke">
                  <div className="flex justify-between">
                    <span className="font-semibold text-on-surface">{formatCOP(item.amount)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${
                      item.status === 'Pagado' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                      item.status === 'Pendiente' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                      'bg-rose-100 text-rose-700 border-rose-200'
                    }`}>{item.status}</span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1">Fecha: {item.date} • Ref: {item.reference}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}