import React, { useState, useEffect } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import api from '../../utils/api';
import { formatCOP } from '../../utils/dashboardUtils';
import { Bell, LogOut, CheckCircle2, AlertCircle, Clock, X, Plus, FileText, Wrench } from 'lucide-react';
import PaymentReportTab from './PaymentReportTab';

export default function TenantDashboard({ user, onLogout }) {
  const { activeTab } = useDashboard();
  const [tenant, setTenant] = useState(null);
  const [bills, setBills] = useState([]);
  const [maintenanceTickets, setMaintenanceTickets] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('transferencia');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [maintenanceDescription, setMaintenanceDescription] = useState('');
  const [maintenanceCategory, setMaintenanceCategory] = useState('plomeria');
  const [maintenancePriority, setMaintenancePriority] = useState('media');

  // Estados para cambio de contraseña
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    loadTenantData();
  }, []);

  const loadTenantData = async () => {
    try {
      const meRes = await api.get('/me');
      setTenant(meRes.data);

      if (meRes.data.mustChangePassword) {
        setShowChangePassword(true);
      }

      const billsRes = await api.get('/bills/tenant');
      setBills(billsRes.data);

      const maintRes = await api.get('/maintenance/tenant');
      setMaintenanceTickets(maintRes.data);
    } catch (error) {
      console.error('Error cargando datos del arrendatario', error);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    if (newPassword.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden.');
      return;
    }
    try {
      await api.put('/auth/change-password', { newPassword });
      setShowChangePassword(false);
      setNewPassword('');
      setConfirmPassword('');
      loadTenantData();
    } catch (error) {
      setPasswordError('Error al cambiar contraseña');
    }
  };

  const handleReportPayment = async (e) => {
    e.preventDefault();
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
      setShowPaymentModal(false);
      loadTenantData();
    } catch (error) {
      console.error('Error reportando pago', error);
    }
  };

  const handleCreateMaintenance = async (e) => {
    e.preventDefault();
    try {
      const property = tenant?.properties?.[0];
      if (!property) return;
      await api.post('/maintenance', {
        description: maintenanceDescription,
        category: maintenanceCategory,
        priority: maintenancePriority,
        propertyId: property.id,
      });
      setShowMaintenanceModal(false);
      loadTenantData();
    } catch (error) {
      console.error('Error creando mantenimiento', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pagado': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Atrasado': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  if (!tenant) {
    return <div className="min-h-screen bg-background text-on-surface flex items-center justify-center">Cargando...</div>;
  }

  const property = tenant.properties?.[0];
  const tenantName = tenant.name || 'Arrendatario';
  const unitName = property?.name || 'Sin unidad';

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <main className="p-4 max-w-5xl mx-auto space-y-6">
        <div className="glass-panel p-6 rounded-xl">
          <h2 className="text-2xl font-bold">Hola, {tenantName}</h2>
          <p className="text-on-surface-variant">Unidad: {unitName}</p>
        </div>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-panel p-5 rounded-xl">
              <p className="text-sm text-on-surface-variant">Recibos totales</p>
              <p className="text-2xl font-bold">{bills.length}</p>
            </div>
            <div className="glass-panel p-5 rounded-xl">
              <p className="text-sm text-on-surface-variant">Pendientes</p>
              <p className="text-2xl font-bold">{bills.filter(b => b.status !== 'Pagado').length}</p>
            </div>
            <div className="glass-panel p-5 rounded-xl">
              <p className="text-sm text-on-surface-variant">Último recibo</p>
              <p className="text-2xl font-bold">{formatCOP(bills[0]?.total || 0)}</p>
            </div>
          </div>
        )}

        {activeTab === 'bills' && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Mis Recibos</h3>
            {bills.length === 0 ? (
              <div className="glass-panel p-8 text-center text-on-surface-variant">No tienes recibos registrados.</div>
            ) : (
              bills.map(bill => (
                <div key={bill.id} className="glass-panel p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="font-medium">{bill.periodStart} a {bill.periodEnd}</p>
                    <p className="text-sm text-on-surface-variant">Consumo: {bill.consumption} kWh</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCOP(bill.total)}</p>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(bill.status)}`}>
                      {bill.status}
                    </span>
                  </div>
                  {bill.status !== 'Pagado' && (
                    <button
                      onClick={() => { setSelectedBill(bill); setShowPaymentModal(true); }}
                      className="px-3 py-1 bg-vibrant-cyan text-background rounded-lg text-sm"
                    >
                      Reportar pago
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
        {activeTab === 'payments' && (
          <PaymentReportTab bills={bills} loadTenantData={loadTenantData} />
        )}

        {activeTab === 'maintenance' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">Mantenimiento</h3>
              <button onClick={() => setShowMaintenanceModal(true)} className="px-4 py-2 bg-vibrant-cyan text-background rounded-lg">
                Nuevo reporte
              </button>
            </div>
            {maintenanceTickets.length === 0 ? (
              <div className="glass-panel p-8 text-center text-on-surface-variant">No tienes reportes de mantenimiento.</div>
            ) : (
              maintenanceTickets.map(ticket => (
                <div key={ticket.id} className="glass-panel p-4 rounded-xl">
                  <div className="flex justify-between">
                    <p className="font-medium">{ticket.description}</p>
                    <span className={`text-xs px-2 py-1 rounded-full border ${
                      ticket.status === 'open' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                      ticket.status === 'in-progress' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                      'bg-emerald-100 text-emerald-700 border-emerald-200'
                    }`}>
                      {ticket.status}
                    </span>
                  </div>
                  {ticket.adminNotes && <p className="mt-2 text-sm text-indigo-600">{ticket.adminNotes}</p>}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="glass-panel p-6 rounded-xl">
            <h3 className="text-xl font-semibold mb-4">Mi Perfil</h3>
            <div className="space-y-2">
              <p><strong>Nombre:</strong> {tenantName}</p>
              <p><strong>Email:</strong> {tenant.email}</p>
              <p><strong>Unidad:</strong> {unitName}</p>
              <p><strong>Teléfono:</strong> {tenant.phone || 'No registrado'}</p>
            </div>
            <button onClick={() => setShowChangePassword(true)} className="mt-4 px-4 py-2 bg-vibrant-cyan text-background rounded-lg">
              Cambiar contraseña
            </button>
          </div>
        )}
      </main>

      {/* Modal Reportar Pago */}
      {showPaymentModal && selectedBill && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-background border border-glass-stroke rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Reportar Pago</h3>
            <p className="text-sm mb-4">Recibo: {selectedBill.periodStart} a {selectedBill.periodEnd} - {formatCOP(selectedBill.total)}</p>
            <form onSubmit={handleReportPayment} className="space-y-3">
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full p-2 bg-midnight-slate border border-glass-stroke rounded">
                <option value="transferencia">Transferencia</option>
                <option value="efectivo">Efectivo</option>
                <option value="otro">Otro</option>
              </select>
              <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} className="w-full p-2 bg-midnight-slate border border-glass-stroke rounded" required />
              <input type="text" placeholder="Referencia" value={paymentReference} onChange={e => setPaymentReference(e.target.value)} className="w-full p-2 bg-midnight-slate border border-glass-stroke rounded" />
              <input type="number" placeholder="Monto pagado" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} className="w-full p-2 bg-midnight-slate border border-glass-stroke rounded" required />
              <textarea placeholder="Notas (opcional)" value={paymentNotes} onChange={e => setPaymentNotes(e.target.value)} className="w-full p-2 bg-midnight-slate border border-glass-stroke rounded" />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="flex-1 py-2 bg-glass-fill rounded">Cancelar</button>
                <button type="submit" className="flex-1 py-2 bg-vibrant-cyan text-background rounded">Enviar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Mantenimiento */}
      {showMaintenanceModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-background border border-glass-stroke rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Nuevo Reporte de Mantenimiento</h3>
            <form onSubmit={handleCreateMaintenance} className="space-y-3">
              <textarea placeholder="Describe el problema" value={maintenanceDescription} onChange={e => setMaintenanceDescription(e.target.value)} className="w-full p-2 bg-midnight-slate border border-glass-stroke rounded" required />
              <select value={maintenanceCategory} onChange={e => setMaintenanceCategory(e.target.value)} className="w-full p-2 bg-midnight-slate border border-glass-stroke rounded">
                <option value="plomeria">Plomería</option>
                <option value="electrico">Eléctrico</option>
                <option value="carpinteria">Carpintería</option>
                <option value="otro">Otro</option>
              </select>
              <select value={maintenancePriority} onChange={e => setMaintenancePriority(e.target.value)} className="w-full p-2 bg-midnight-slate border border-glass-stroke rounded">
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
              </select>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowMaintenanceModal(false)} className="flex-1 py-2 bg-glass-fill rounded">Cancelar</button>
                <button type="submit" className="flex-1 py-2 bg-vibrant-cyan text-background rounded">Enviar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cambiar Contraseña */}
      {showChangePassword && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-background border border-glass-stroke rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Cambiar Contraseña</h3>
            <p className="text-sm text-on-surface-variant mb-4">Por seguridad, debes cambiar tu contraseña provisional.</p>
            <form onSubmit={handleChangePassword} className="space-y-3">
              <input
                type="password"
                placeholder="Nueva contraseña"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full p-2 bg-midnight-slate border border-glass-stroke rounded"
                required
              />
              <input
                type="password"
                placeholder="Confirmar contraseña"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full p-2 bg-midnight-slate border border-glass-stroke rounded"
                required
              />
              {passwordError && <p className="text-error text-sm">{passwordError}</p>}
              <button type="submit" className="w-full py-2 bg-vibrant-cyan text-background rounded">Guardar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}