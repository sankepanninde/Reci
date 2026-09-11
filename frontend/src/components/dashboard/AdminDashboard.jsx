import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Calculator, Users, LogOut, PlusCircle, Trash2, Edit3,
  CheckCircle2, Zap, X, Calendar, CreditCard, Home, ChevronRight,
  FileText, Download, Send, Loader2, Bell, Wrench, AlertCircle, Eye, Search,
  TrendingUp, Wallet, Clock, BarChart3
} from 'lucide-react';
import CreateTenantModalNew from './CreateTenantModalNew';
import ServicesTab from './tabs/ServicesTab';
import EnviosTab from './tabs/EnviosTab';
import CreatePropertyModal from './CreatePropertyModal';
import { useDashboard } from '../../context/DashboardContext';
import { adminTabs } from '../../config/dashboardTabs';
import api from '../../utils/api';
import {
  MULTI_METER, SINGLE_METER,
  ensureMultiMeterFields, formatCOP, getPropertyConsumption,
  getPropertyTrashCost, getPropertyTotal, STATUS_STYLES, TICKET_STATUS, PRIORITY_STYLES
} from '../../utils/dashboardUtils';

/* ============================================================
   Componentes reutilizables internos
   ============================================================ */

function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-6">
      <div>
        <h2 className="text-headline-md font-semibold text-on-surface tracking-tight">{title}</h2>
        {subtitle && <p className="text-body-sm text-on-surface-variant mt-1">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

function KpiCard({ icon, label, value, accent = 'cyan', trend }) {
  const accentMap = {
    cyan:    { text: 'text-vibrant-cyan',    bg: 'bg-vibrant-cyan/10',    border: 'border-vibrant-cyan/20' },
    blue:    { text: 'text-electric-blue',   bg: 'bg-electric-blue/10',   border: 'border-electric-blue/20' },
    success: { text: 'text-emerald-400',     bg: 'bg-emerald-400/10',     border: 'border-emerald-400/20' },
    error:   { text: 'text-error',           bg: 'bg-error/10',           border: 'border-error/20' },
  };
  const a = accentMap[accent] || accentMap.cyan;

  return (
    <div className="relative bg-surface-container-low border border-outline-variant rounded-lg p-3 overflow-hidden group hover:border-outline transition-all min-w-0">
      <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl opacity-40 ${a.bg}`}></div>
      <div className="flex items-center justify-between gap-2 mb-1.5 relative">
        <div className={`p-1.5 rounded-md border ${a.border} ${a.bg} shrink-0`}>
          <span className={`material-symbols-outlined text-[15px] ${a.text}`}>{icon}</span>
        </div>
        {trend && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${trend.positive ? 'bg-emerald-400/10 text-emerald-400' : 'bg-error/10 text-error'} flex items-center gap-0.5 shrink-0`}>
            <span className="material-symbols-outlined text-[10px]">{trend.positive ? 'trending_up' : 'trending_down'}</span>
            {trend.value}
          </span>
        )}
      </div>
      <h3 className="text-[9px] text-on-surface-variant uppercase tracking-[0.06em] mb-0.5 relative truncate">{label}</h3>
      <p className="text-title-lg font-semibold text-on-surface relative tabular-nums truncate leading-tight">{value}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const s = status?.toLowerCase() || '';
  const map = {
    pagado:    'badge success',
    pendiente: 'badge warning',
    atrasado:  'badge error',
  };
  const cls = map[s] || 'badge';
  return <span className={cls}>{status}</span>;
}

function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="bg-surface-container-low border border-outline-variant rounded-xl p-12 text-center">
      <div className="w-14 h-14 bg-surface-container border border-outline-variant rounded-full flex items-center justify-center mx-auto mb-3">
        <Icon size={22} className="text-on-surface-variant" />
      </div>
      <p className="text-body-sm text-on-surface font-medium">{title}</p>
      {description && <p className="text-label-md text-on-surface-variant mt-1">{description}</p>}
    </div>
  );
}

/* ============================================================
   AdminDashboard
   ============================================================ */

function AdminDashboard({ user, onLogout }) {
  const { activeTab, setActiveTab } = useDashboard();
  const [properties, setProperties] = useState([]);
  const [bills, setBills] = useState([]);
  const [maintenanceTickets, setMaintenanceTickets] = useState([]);

  const [kwhRate, setKwhRate] = useState(850);
  const [kwhInputText, setKwhInputText] = useState('850');
  const [totalTrashBill, setTotalTrashBill] = useState(180000);
  const [trashInputText, setTrashInputText] = useState('180.000');
  const [apartmentTrashBill, setApartmentTrashBill] = useState(45000);
  const [apartmentTrashInputText, setApartmentTrashInputText] = useState('45.000');
  const [readingStartDate, setReadingStartDate] = useState('2026-07-01');
  const [readingEndDate, setReadingEndDate] = useState('2026-07-31');
  const [globalDueDate, setGlobalDueDate] = useState('2026-08-30');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTenantData, setEditingTenantData] = useState(null);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifyStep, setNotifyStep] = useState(0);
  const [notifyProgress, setNotifyProgress] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [maintFilter, setMaintFilter] = useState('all');
  const [maintSearch, setMaintSearch] = useState('');
  const [proofFilter, setProofFilter] = useState('all');
  const [respondingTicket, setRespondingTicket] = useState(null);
  const [adminNoteText, setAdminNoteText] = useState('');
  const [showCreatePropertyModal, setShowCreatePropertyModal] = useState(false);

  const addToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  const loadProperties = async () => {
    try {
      const res = await api.get('/properties');
      const mapped = res.data
        .filter(p => p.name !== 'Sin unidad')
        .map(p => ({
          id: p.id,
          unit: p.name,
          tenant: p.tenantName || '',
          email: p.email || '',
          document: p.document || '',
          password: p.password || '',
          phone: p.phone || '',
          meters: p.meters,
          status: p.status,
          baseAmount: p.baseAmount,
          dueDate: p.dueDate ? p.dueDate.slice(0, 10) : '',
          prev: p.prevReading,
          curr: p.currReading,
          m1Prev: p.m1Prev,
          m1Curr: p.m1Curr,
          m2Prev: p.m2Prev,
          m2Curr: p.m2Curr,
          m3Prev: p.m3Prev,
          m3Curr: p.m3Curr,
        }));
      setProperties(mapped);
    } catch (error) {
      addToast('Error al cargar propiedades', 'error');
    }
  };

  const loadBills = async () => {
    try {
      const res = await api.get('/bills');
      setBills(res.data);
    } catch (error) {
      addToast('Error al cargar recibos', 'error');
    }
  };

  const loadMaintenance = async () => {
    try {
      const res = await api.get('/maintenance');
      setMaintenanceTickets(res.data);
    } catch (error) {
      addToast('Error al cargar mantenimiento', 'error');
    }
  };

  useEffect(() => {
    loadProperties();
    loadBills();
    loadMaintenance();
  }, []);

  const trashUnitsCount = properties.filter(p => p.unit !== 'Apartamento' && p.unit !== 'Garaje').length || 1;
  const trashPerUnit = totalTrashBill / trashUnitsCount;

  const totalGeneralServices = properties.reduce((a, p) => a + getPropertyTotal(p, kwhRate, trashPerUnit, apartmentTrashBill), 0);
  const pendingAmount = properties.filter(p => p.status !== 'Pagado').reduce((a, p) => a + getPropertyTotal(p, kwhRate, trashPerUnit, apartmentTrashBill), 0);
  const collectedAmount = totalGeneralServices - pendingAmount;

  const handleStatusChange = (id, newStatus) => {
    setProperties(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
  };

  const handleEditClick = (p) => {
    setEditingTenantData(p);
    setShowCreateModal(true);
  };

  const handleUnassignTenant = async (id) => {
    if (!confirm('¿Desasignar este arrendatario? El local quedará libre.')) return;
    try {
      await api.put(`/properties/${id}`, {
        tenant: '', email: '', phone: '', document: '', password: '',
      });
      addToast('Arrendatario desasignado', 'success');
      loadProperties();
    } catch (error) {
      addToast('Error al desasignar', 'error');
    }
  };

  const handleTenantCreated = async (data) => {
    try {
      const payload = {
        unit: data.unit,
        tenant: data.tenant,
        email: data.email,
        document: data.document,
        phone: data.phone,
        password: data.password,
        meters: data.meters,
        status: data.status || 'Pendiente',
        baseAmount: data.baseAmount,
        dueDate: data.dueDate || globalDueDate,
        ...(data.meters === MULTI_METER
          ? { m1Prev: 0, m1Curr: 0, m2Prev: 0, m2Curr: 0, m3Prev: 0, m3Curr: 0 }
          : { prev: 0, curr: 0 }),
      };

      if (editingTenantData) {
        await api.put(`/properties/${editingTenantData.id}`, payload);
        addToast('Arrendatario actualizado', 'success');
      } else {
        const prop = properties.find(p => p.unit === data.unit);
        if (prop) {
          await api.put(`/properties/${prop.id}`, { ...payload, tenant: data.tenant });
          addToast('Arrendatario asignado', 'success');
        } else {
          await api.post('/properties', payload);
          addToast('Arrendatario creado', 'success');
        }
      }
      loadProperties();
      setShowCreateModal(false);
      setEditingTenantData(null);
    } catch (error) {
      addToast(error.response?.data?.message || 'Error al guardar arrendatario', 'error');
    }
  };

  const handlePropertyCreated = async (data) => {
    try {
      await api.post('/properties', { unit: data.name, meters: data.meters, tenant: '' });
      loadProperties();
      setShowCreatePropertyModal(false);
      addToast('Unidad creada correctamente', 'success');
    } catch (error) {
      addToast('Error al crear unidad', 'error');
    }
  };

  const handleDeleteProperty = async (id) => {
    if (!confirm('¿Eliminar esta unidad? Esta acción no se puede deshacer.')) return;
    try {
      await api.delete(`/properties/${id}`);
      addToast('Unidad eliminada', 'success');
      loadProperties();
    } catch (error) {
      addToast('Error al eliminar unidad', 'error');
    }
  };

  const exportBillsCSV = () => {
    if (!bills.length) return;
    const headers = ['Unidad','Arrendatario','Periodo','Consumo','Tarifa','Energia','Aseo','Total','Estado','Limite'];
    const rows = bills.map(b => [b.property?.name || '', b.property?.tenantName || '', `${b.periodStart} al ${b.periodEnd}`, b.consumption, b.kwhRate, b.energyTotal, b.trashCost, b.total, b.status, b.dueDate].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recibos_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleVerifyPayment = async (billId) => {
    if (!confirm('¿Marcar este recibo como PAGADO?')) return;
    try {
      await api.put(`/bills/${billId}`, { status: 'Pagado', paidDate: new Date().toISOString() });
      addToast('Pago verificado', 'success');
      loadBills();
    } catch (error) {
      addToast('Error al verificar pago', 'error');
    }
  };

  const handleRejectPayment = async (billId) => {
    if (!confirm('¿Rechazar este comprobante?')) return;
    try {
      await api.put(`/bills/${billId}`, { status: 'Pendiente', paymentProof: null, paymentProofDate: null });
      addToast('Comprobante rechazado', 'error');
      loadBills();
    } catch (error) {
      addToast('Error al rechazar', 'error');
    }
  };

  const handleRespondTicket = async (ticketId) => {
    if (!adminNoteText.trim()) return;
    try {
      await api.put(`/maintenance/${ticketId}`, { adminNotes: adminNoteText, status: 'in-progress' });
      addToast('Respuesta enviada', 'success');
      setRespondingTicket(null);
      setAdminNoteText('');
      loadMaintenance();
    } catch (error) {
      addToast('Error al responder', 'error');
    }
  };

  const handleResolveTicket = async (ticketId) => {
    try {
      await api.put(`/maintenance/${ticketId}`, { status: 'resolved' });
      addToast('Ticket resuelto', 'success');
      loadMaintenance();
    } catch (error) {
      addToast('Error al resolver', 'error');
    }
  };

  const handleSendNotifications = async () => {
    try {
      for (const p of properties) {
        await api.put(`/properties/${p.id}`, {
          prev: p.prev, curr: p.curr,
          m1Prev: p.m1Prev, m1Curr: p.m1Curr,
          m2Prev: p.m2Prev, m2Curr: p.m2Curr,
          m3Prev: p.m3Prev, m3Curr: p.m3Curr,
        });
      }

      const newBills = properties.map(p => {
        const consumption = getPropertyConsumption(p);
        const energyTotal = consumption * kwhRate;
        const trashCost = getPropertyTrashCost(p, trashPerUnit, apartmentTrashBill);
        return {
          propertyId: p.id,
          periodStart: readingStartDate,
          periodEnd: readingEndDate,
          dueDate: globalDueDate,
          consumption, kwhRate, energyTotal, trashCost,
          total: energyTotal + trashCost,
          status: p.status || 'Pendiente',
        };
      });

      const emailTemplate = localStorage.getItem('bap_email_template') || '';
      const whatsappTemplate = localStorage.getItem('bap_whatsapp_template') || '';

      await api.post('/bills/generate', { bills: newBills, emailTemplate, whatsappTemplate });

      addToast('Recibos guardados y notificaciones enviadas', 'success');
      loadBills();
    } catch (error) {
      console.error('Error en handleSendNotifications:', error);
      addToast('Error al guardar liquidación', 'error');
    }
  };

  const filteredTickets = maintenanceTickets
    .filter(t => maintFilter === 'all' ? true : t.status === maintFilter)
    .filter(t => maintSearch ? (t.property?.name || '').toLowerCase().includes(maintSearch.toLowerCase()) || (t.description || '').toLowerCase().includes(maintSearch.toLowerCase()) : true)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const billsWithProofs = bills
    .filter(b => b.paymentProof)
    .filter(b => proofFilter === 'all' ? true : b.status === proofFilter)
    .sort((a, b) => new Date(b.paymentProofDate || b.createdAt) - new Date(a.paymentProofDate || a.createdAt));

  return (
    <>
      {/* ===================== OVERVIEW ===================== */}
      {activeTab === 'overview' && (
        <div className="space-y-5 animate-fadeIn">
          <SectionHeader
            title="Visión General"
            subtitle="Métricas de rendimiento y estado del portafolio."
            action={
              <div className="flex gap-2">
                <button className="px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-on-surface text-body-sm hover:border-vibrant-cyan hover:text-vibrant-cyan transition-all">
                  Exportar PDF
                </button>
                <button className="px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-on-surface text-body-sm hover:border-vibrant-cyan hover:text-vibrant-cyan transition-all flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                  Este Mes
                </button>
              </div>
            }
          />

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard
              icon="payments"
              label="Total Recaudado"
              value={formatCOP(collectedAmount)}
              accent="cyan"
              trend={{ positive: true, value: '+12%' }}
            />
            <KpiCard
              icon="groups"
              label="Inquilinos Activos"
              value={properties.length}
              accent="blue"
            />
            <KpiCard
              icon="real_estate_agent"
              label="Propiedades Disp."
              value={properties.filter(p => p.status === 'Pendiente').length}
              accent="success"
            />
            <KpiCard
              icon="warning"
              label="Alertas de Pago"
              value={`${properties.filter(p => p.status === 'Atrasado').length} atrasados`}
              accent="error"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="lg:col-span-2 bg-surface-container-low border border-outline-variant rounded-xl p-5 flex flex-col">
              <div className="flex justify-between items-center mb-5">
                <div>
                  <h3 className="text-title-lg font-semibold text-on-surface">Tendencia de Consumos Energéticos</h3>
                  <p className="text-body-sm text-on-surface-variant">Uso agregado (kWh) en todo el portafolio</p>
                </div>
                <button className="p-2 bg-surface-container border border-outline-variant rounded-lg hover:border-vibrant-cyan transition-colors">
                  <span className="material-symbols-outlined text-on-surface-variant text-[18px]">more_horiz</span>
                </button>
              </div>
              <div className="flex-1 min-h-[240px] relative w-full flex items-end">
                <div className="absolute inset-0 flex flex-col justify-between">
                  {[0,1,2,3,4].map(i => (
                    <div key={i} className={`w-full h-px ${i === 4 ? 'border-t border-solid' : 'border-t border-dashed'} border-outline-variant`}></div>
                  ))}
                </div>
                <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                  <defs>
                    <linearGradient id="chartGradient" x1="0%" x2="0%" y1="0%" y2="100%">
                      <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.3"></stop>
                      <stop offset="100%" stopColor="#00e5ff" stopOpacity="0"></stop>
                    </linearGradient>
                  </defs>
                  <polygon fill="url(#chartGradient)" points="0,100 0,60 20,40 40,70 60,30 80,45 100,20 100,100"></polygon>
                  <polyline fill="none" points="0,60 20,40 40,70 60,30 80,45 100,20" stroke="#00e5ff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" style={{ filter: 'drop-shadow(0px 0px 6px rgba(0,229,255,0.5))' }}></polyline>
                  {[[20,40],[40,70],[60,30],[80,45]].map(([cx,cy], i) => (
                    <circle key={i} cx={cx} cy={cy} fill="#141314" r="1.5" stroke="#00e5ff" strokeWidth="1"></circle>
                  ))}
                  <circle cx="100" cy="20" fill="#00e5ff" r="1.5" stroke="#FFFFFF" strokeWidth="0.5"></circle>
                </svg>
                <div className="absolute -bottom-5 w-full flex justify-between px-2 text-label-sm text-on-surface-variant">
                  <span>Ene</span><span>Feb</span><span>Mar</span><span>Abr</span><span>May</span><span>Jun</span>
                </div>
              </div>
            </div>

            <div className="bg-surface-container-low border border-outline-variant rounded-xl p-5 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-title-lg font-semibold text-on-surface">Próximos Vencimientos</h3>
                <a className="text-label-sm text-vibrant-cyan hover:underline" href="#">Ver Todos</a>
              </div>
              <div className="space-y-2 overflow-y-auto pr-1">
                {properties.filter(p => p.dueDate).length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                    <span className="material-symbols-outlined text-[36px] text-on-surface-variant/40 mb-2">event_available</span>
                    <p className="text-body-sm text-on-surface-variant font-medium">Sin vencimientos próximos</p>
                    <p className="text-label-sm text-on-surface-variant/70 mt-1">Los recibos con fecha límite aparecerán acá</p>
                  </div>
                ) : (
                  properties.filter(p => p.dueDate).slice(0, 4).map(prop => (
                    <div key={prop.id} className="bg-surface-container border border-outline-variant rounded-lg p-3 flex gap-3 items-center group hover:border-vibrant-cyan/30 transition-colors">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                        prop.status === 'Atrasado' ? 'bg-error/10 text-error' : 'bg-electric-blue/10 text-secondary'
                      }`}>
                        <span className="material-symbols-outlined text-[16px]">{prop.status === 'Atrasado' ? 'assignment_late' : 'receipt_long'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-body-sm font-medium text-on-surface truncate">{prop.unit}</h4>
                        <p className="text-label-sm text-on-surface-variant truncate">Vence {prop.dueDate} · {prop.tenant}</p>
                      </div>
                      <button className="text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== CALCULATOR ===================== */}
      {activeTab === 'calculator' && (
        <ServicesTab
          properties={properties} setProperties={setProperties}
          bills={bills} setBills={setBills}
          kwhRate={kwhRate} setKwhRate={setKwhRate}
          kwhInputText={kwhInputText} setKwhInputText={setKwhInputText}
          totalTrashBill={totalTrashBill} setTotalTrashBill={setTotalTrashBill}
          trashInputText={trashInputText} setTrashInputText={setTrashInputText}
          apartmentTrashBill={apartmentTrashBill} setApartmentTrashBill={setApartmentTrashBill}
          apartmentTrashInputText={apartmentTrashInputText} setApartmentTrashInputText={setApartmentTrashInputText}
          readingStartDate={readingStartDate} setReadingStartDate={setReadingStartDate}
          readingEndDate={readingEndDate} setReadingEndDate={setReadingEndDate}
          globalDueDate={globalDueDate} setGlobalDueDate={setGlobalDueDate}
          hasUnsavedChanges={hasUnsavedChanges} setHasUnsavedChanges={setHasUnsavedChanges}
          trashUnitsCount={trashUnitsCount} trashPerUnit={trashPerUnit}
          totalGeneralServices={totalGeneralServices}
          handleSendNotifications={handleSendNotifications}
          addToast={addToast}
        />
      )}

      {/* ===================== ENVIOS ===================== */}
      {activeTab === 'envios' && <EnviosTab />}

      {/* ===================== UNITS ===================== */}
      {activeTab === 'units' && (
        <div className="space-y-5 animate-fadeIn">
          <SectionHeader
            title="Unidades"
            subtitle="Gestiona los locales y propiedades disponibles."
            action={
              <button
                onClick={() => setShowCreatePropertyModal(true)}
                className="inline-flex items-center gap-1.5 bg-vibrant-cyan text-background font-semibold px-4 py-2 rounded-lg text-body-sm transition-all hover:shadow-[0_0_20px_rgba(0,229,255,0.4)] active:scale-[0.98]"
              >
                <PlusCircle size={15} /> Nueva Unidad
              </button>
            }
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '12px' }}>
            {properties.map(prop => (
              <div key={prop.id} className="bg-surface-container-low border border-outline-variant rounded-xl p-4 hover:border-vibrant-cyan/30 transition-colors relative group">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="text-title-lg font-semibold text-on-surface truncate">{prop.unit}</h4>
                    <p className="text-body-sm text-on-surface-variant mt-0.5">{prop.meters}</p>
                  </div>
                  <span className="material-symbols-outlined text-vibrant-cyan text-[20px] shrink-0">home</span>
                </div>
                <div className="mt-3 pt-3 border-t border-outline-variant">
                  <p className="text-body-sm text-on-surface-variant truncate">
                    {prop.tenant ? `Arrendatario: ${prop.tenant}` : 'Sin arrendatario asignado'}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteProperty(prop.id)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-error/10 text-error hover:bg-error/20"
                  title="Eliminar unidad"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================== TENANTS ===================== */}
      {activeTab === 'tenants' && (
        <div className="space-y-5 animate-fadeIn">
          <SectionHeader
            title="Gestión de Arrendatarios"
            subtitle="Administra inquilinos, credenciales y unidades."
            action={
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-1.5 bg-vibrant-cyan text-background font-semibold px-4 py-2 rounded-lg text-body-sm transition-all hover:shadow-[0_0_20px_rgba(0,229,255,0.4)] active:scale-[0.98]"
              >
                <PlusCircle size={15} /> Nuevo Arrendatario
              </button>
            }
          />

          <div className="bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-outline-variant">
              <h3 className="text-title-lg font-semibold text-on-surface">Arrendatarios <span className="text-on-surface-variant font-normal">({properties.length})</span></h3>
              <p className="text-body-sm text-on-surface-variant mt-0.5">Haz clic en editar para reasignar un local o modificar datos.</p>
            </div>
            <div className="divide-y divide-outline-variant/50">
              {properties.map((p) => (
                <div key={p.id} className="p-4 flex items-start justify-between gap-4 transition-colors hover:bg-surface-container">
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Home size={15} className="text-vibrant-cyan shrink-0" />
                      <h4 className="text-body-lg font-semibold text-on-surface">{p.unit}</h4>
                      <span className="bg-surface-container text-on-surface-variant text-label-sm px-2 py-0.5 rounded-full border border-outline-variant">
                        {p.meters}
                      </span>
                    </div>
                    <p className={`text-body-md font-medium ${p.tenant ? 'text-on-surface' : 'text-on-surface-variant italic'}`}>
                      {p.tenant || 'Sin arrendatario'}
                    </p>
                    <div className="text-body-sm text-on-surface-variant flex flex-wrap gap-x-4 gap-y-1">
                      <span className="inline-flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">mail</span>
                        {p.email || '—'}
                      </span>
                      {p.phone && (
                        <span className="inline-flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">smartphone</span>
                          {p.phone}
                        </span>
                      )}
                      {p.document && (
                        <span className="inline-flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">badge</span>
                          {p.document}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleEditClick(p)}
                      className="p-2 text-on-surface-variant hover:text-vibrant-cyan hover:bg-surface-container rounded-lg transition-all"
                      title="Editar"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      onClick={() => handleUnassignTenant(p.id)}
                      className="p-2 text-error hover:bg-error/10 rounded-lg transition-all"
                      title="Desasignar"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================== MAINTENANCE ===================== */}
      {activeTab === 'maintenance' && (
        <div className="space-y-5 animate-fadeIn">
          <SectionHeader
            title="Mantenimiento"
            subtitle="Reportes enviados por los arrendatarios."
            action={
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Buscar unidad o descripción..."
                    value={maintSearch}
                    onChange={e => setMaintSearch(e.target.value)}
                    className="input pl-8 w-56"
                  />
                </div>
                <select
                  value={maintFilter}
                  onChange={e => setMaintFilter(e.target.value)}
                  className="input w-auto"
                >
                  <option value="all">Todos</option>
                  <option value="open">Abiertos</option>
                  <option value="in-progress">En progreso</option>
                  <option value="resolved">Resueltos</option>
                </select>
              </div>
            }
          />

          {filteredTickets.length === 0 ? (
            <EmptyState
              icon={Wrench}
              title="No hay reportes de mantenimiento"
              description="Cuando los arrendatarios reporten problemas, aparecerán acá."
            />
          ) : (
            <div className="space-y-2.5">
              {filteredTickets.map(ticket => (
                <div key={ticket.id} className="bg-surface-container-low border border-outline-variant rounded-xl p-4 hover:border-outline transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-label-sm font-semibold border ${TICKET_STATUS[ticket.status]?.bg || 'bg-surface-container text-on-surface-variant'} ${TICKET_STATUS[ticket.status]?.text || ''} ${TICKET_STATUS[ticket.status]?.border || 'border-outline-variant'}`}>
                          {TICKET_STATUS[ticket.status]?.label || ticket.status}
                        </span>
                        <span className="text-body-sm text-on-surface-variant font-medium">{ticket.property?.name || 'Sin unidad'}</span>
                        <span className="text-label-sm text-on-surface-variant">{new Date(ticket.createdAt).toLocaleDateString('es-CO')}</span>
                        <span className={`text-label-sm font-bold px-2 py-0.5 rounded ${PRIORITY_STYLES[ticket.priority]?.bg || 'bg-surface-container'} ${PRIORITY_STYLES[ticket.priority]?.text || 'text-on-surface-variant'}`}>
                          {PRIORITY_STYLES[ticket.priority]?.label || ticket.priority}
                        </span>
                      </div>
                      <p className="text-body-md text-on-surface leading-relaxed">{ticket.description}</p>
                      {ticket.adminNotes && (
                        <div className="mt-3 p-3 bg-electric-blue/5 rounded-lg border border-electric-blue/20">
                          <p className="text-label-sm font-semibold text-secondary mb-1 uppercase tracking-wider">Tu respuesta</p>
                          <p className="text-body-sm text-on-surface">{ticket.adminNotes}</p>
                        </div>
                      )}
                      {respondingTicket === ticket.id && (
                        <div className="mt-3 space-y-2">
                          <textarea
                            value={adminNoteText}
                            onChange={e => setAdminNoteText(e.target.value)}
                            rows={3}
                            placeholder="Escribe una respuesta para el arrendatario..."
                            className="input resize-none"
                          />
                          <div className="flex gap-2">
                            <button onClick={() => handleRespondTicket(ticket.id)} className="btn">Enviar respuesta</button>
                            <button onClick={() => { setRespondingTicket(null); setAdminNoteText(''); }} className="btn secondary">Cancelar</button>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5 shrink-0">
                      {ticket.status !== 'resolved' && (
                        <>
                          <button onClick={() => setRespondingTicket(ticket.id)} className="px-3 py-1.5 text-label-sm font-medium text-secondary bg-electric-blue/10 hover:bg-electric-blue/20 rounded-lg transition-colors">
                            Responder
                          </button>
                          <button onClick={() => handleResolveTicket(ticket.id)} className="px-3 py-1.5 text-label-sm font-medium text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20 rounded-lg transition-colors">
                            Resolver
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================== PROOFS ===================== */}
      {activeTab === 'proofs' && (
        <div className="space-y-5 animate-fadeIn">
          <SectionHeader
            title="Comprobantes de Pago"
            subtitle="Verifica pagos reportados por los arrendatarios."
            action={
              <select value={proofFilter} onChange={e => setProofFilter(e.target.value)} className="input w-auto">
                <option value="all">Todos</option>
                <option value="Pendiente">Pendientes de verificación</option>
                <option value="Pagado">Ya verificados</option>
              </select>
            }
          />

          {billsWithProofs.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="No hay comprobantes de pago"
              description="Los comprobantes subidos por arrendatarios aparecerán acá."
            />
          ) : (
            <div className="space-y-2.5">
              {billsWithProofs.map(bill => (
                <div key={bill.id} className="bg-surface-container-low border border-outline-variant rounded-xl p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h4 className="font-semibold text-body-md text-on-surface">{bill.property?.name || 'Unidad'}</h4>
                        <StatusBadge status={bill.status} />
                        <span className="text-label-sm text-on-surface-variant">{bill.periodStart} → {bill.periodEnd}</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-body-sm">
                        <div>
                          <span className="text-label-sm text-on-surface-variant block uppercase tracking-wider">Método</span>
                          <span className="font-medium text-on-surface capitalize">
                            {bill.paymentProof?.method === 'transfer' ? 'Transferencia' : bill.paymentProof?.method === 'cash' ? 'Efectivo' : 'Otro'}
                          </span>
                        </div>
                        <div>
                          <span className="text-label-sm text-on-surface-variant block uppercase tracking-wider">Fecha pago</span>
                          <span className="font-medium text-on-surface">{bill.paymentProof?.date}</span>
                        </div>
                        <div>
                          <span className="text-label-sm text-on-surface-variant block uppercase tracking-wider">Referencia</span>
                          <span className="font-medium text-on-surface">{bill.paymentProof?.reference || '—'}</span>
                        </div>
                        <div>
                          <span className="text-label-sm text-on-surface-variant block uppercase tracking-wider">Monto reportado</span>
                          <span className="font-medium text-on-surface tabular-nums">{formatCOP(bill.paymentProof?.amount)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="text-label-sm text-on-surface-variant block uppercase tracking-wider">Total recibo</span>
                        <span className="font-mono font-semibold text-on-surface tabular-nums">{formatCOP(bill.total)}</span>
                      </div>
                      {bill.status !== 'Pagado' && (
                        <div className="flex flex-col gap-1.5">
                          <button onClick={() => handleVerifyPayment(bill.id)} className="px-3 py-1.5 text-label-sm font-medium text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20 rounded-lg transition-colors">
                            Verificar
                          </button>
                          <button onClick={() => handleRejectPayment(bill.id)} className="px-3 py-1.5 text-label-sm font-medium text-error bg-error/10 hover:bg-error/20 rounded-lg transition-colors">
                            Rechazar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================== HISTORY ===================== */}
      {activeTab === 'history' && (
        <div className="space-y-5 animate-fadeIn">
          <SectionHeader
            title="Historial de Recibos"
            subtitle="Recibos generados y guardados en el sistema."
            action={
              <button
                onClick={exportBillsCSV}
                disabled={!bills.length}
                className="btn secondary"
              >
                <Download size={14} /> Exportar CSV
              </button>
            }
          />

          {bills.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Aún no has generado recibos"
              description="Ve a la pestaña 'Servicios' y guarda los cálculos."
            />
          ) : (
            <div className="bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Recibo</th>
                      <th>Unidad</th>
                      <th>Período</th>
                      <th>Consumo</th>
                      <th>Energía</th>
                      <th>Aseo</th>
                      <th>Total</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bills.map((b) => (
                      <tr key={b.id}>
                        <td className="font-mono text-label-md text-on-surface-variant">{b.id.split('-')[1]}</td>
                        <td className="font-semibold text-on-surface">{b.property?.name || ''}</td>
                        <td className="text-label-md text-on-surface-variant">{b.periodStart} → {b.periodEnd}</td>
                        <td className="font-mono tabular-nums">{b.consumption} kWh</td>
                        <td className="font-mono tabular-nums">{formatCOP(b.energyTotal)}</td>
                        <td className="font-mono tabular-nums">{formatCOP(b.trashCost)}</td>
                        <td className="font-mono font-semibold text-on-surface tabular-nums">{formatCOP(b.total)}</td>
                        <td><StatusBadge status={b.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================== MODAL NOTIFICACIONES ===================== */}
      {showNotifyModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-surface-container-low border border-outline-variant rounded-2xl max-w-md w-full p-5 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-surface-container border border-outline-variant rounded-lg">
                <Bell size={16} className="text-vibrant-cyan" />
              </div>
              <div>
                <h3 className="text-title-lg font-semibold text-on-surface">Enviando Notificaciones</h3>
                <p className="text-label-md text-on-surface-variant">Recibos generados. Notificando a arrendatarios...</p>
              </div>
            </div>
            <div className="space-y-2">
              {notifyProgress.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all ${
                    item.status === 'done' ? 'bg-emerald-400/5 border-emerald-400/20'
                    : item.status === 'loading' ? 'bg-warning/5 border-warning/20'
                    : 'bg-surface-container border-outline-variant'
                  }`}
                >
                  <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                    item.status === 'done' ? 'bg-emerald-400 text-background'
                    : item.status === 'loading' ? 'bg-warning text-background'
                    : 'bg-surface-container-high text-on-surface-variant'
                  }`}>
                    {item.status === 'done' ? <CheckCircle2 size={13} /> : item.status === 'loading' ? <Loader2 size={13} className="animate-spin" /> : <span className="text-label-sm font-bold">{idx + 1}</span>}
                  </div>
                  <p className={`text-body-sm font-medium ${
                    item.status === 'done' ? 'text-emerald-400'
                    : item.status === 'loading' ? 'text-warning'
                    : 'text-on-surface-variant'
                  }`}>{item.text}</p>
                </div>
              ))}
              {notifyStep === 3 && (
                <div className="mt-3 p-4 bg-emerald-400/5 rounded-xl border border-emerald-400/20 text-center animate-fadeIn">
                  <CheckCircle2 size={24} className="text-emerald-400 mx-auto mb-2" />
                  <p className="text-body-md font-semibold text-emerald-400">¡Todas las notificaciones enviadas!</p>
                  <p className="text-label-md text-on-surface-variant mt-1">Los arrendatarios recibirán sus recibos por correo y WhatsApp.</p>
                </div>
              )}
            </div>
            {notifyStep === 3 && (
              <div className="mt-4 text-center">
                <button onClick={() => setShowNotifyModal(false)} className="btn">Cerrar</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================== MODALES ===================== */}
      {showCreateModal && (
        <CreateTenantModalNew
          editingTenant={editingTenantData}
          existingProperties={properties}
          onClose={() => { setShowCreateModal(false); setEditingTenantData(null); }}
          onTenantCreated={handleTenantCreated}
        />
      )}

      {showCreatePropertyModal && (
        <CreatePropertyModal
          onClose={() => setShowCreatePropertyModal(false)}
          onPropertyCreated={handlePropertyCreated}
        />
      )}

      {/* ===================== TOASTS ===================== */}
      <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-2 px-3.5 py-2.5 rounded-lg shadow-xl border text-body-sm font-medium animate-fadeIn backdrop-blur-md ${
              t.type === 'success' ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/30'
              : t.type === 'error' ? 'bg-error/10 text-error border-error/30'
              : 'bg-warning/10 text-warning border-warning/30'
            }`}
          >
            {t.type === 'success' ? <CheckCircle2 size={15} className="shrink-0" />
              : t.type === 'error' ? <X size={15} className="shrink-0" />
              : <Bell size={15} className="shrink-0" />}
            {t.message}
          </div>
        ))}
      </div>
    </>
  );
}

export default AdminDashboard;