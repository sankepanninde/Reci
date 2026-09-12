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
      {/* ============ OVERVIEW — DISEÑO VOLT v2 ============ */}
      {activeTab === 'overview' && (
        <div className="animate-fadeIn space-y-5">

          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-[32px] leading-10 font-semibold text-volt-primary tracking-tight">
                Consumo & Distribución Eléctrica
              </h1>
              <p className="text-[14px] leading-[22px] text-volt-ink-mute mt-1">
                Liquidación por submedición y cuadre energético del ciclo mensual.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-volt-white border border-volt-rule-soft text-volt-ink text-[12px] font-semibold hover:bg-volt-surface-low transition-colors shadow-volt-subtle">
                <span className="material-symbols-outlined text-[17px] text-volt-outline">compare_arrows</span>
                <span>Comparar Ciclo Ant.</span>
              </button>
              <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-volt-white border border-volt-rule-soft text-volt-ink text-[12px] font-semibold hover:bg-volt-surface-low transition-colors shadow-volt-subtle">
                <span className="material-symbols-outlined text-[17px] text-volt-outline">file_download</span>
                <span>Exportar Resumen</span>
              </button>
            </div>
          </div>

          {/* ============ CUADRE MAESTRO ============ */}
          <div className="bg-[#F2F8F4] border border-[#BFDFCA] rounded-2xl p-6 shadow-volt-subtle relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 opacity-[0.04] text-volt-green pointer-events-none">
              <span className="material-symbols-outlined text-[160px]">verified</span>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#CBE5D4] relative">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-volt-green flex items-center justify-center text-volt-white shadow-volt-subtle shrink-0">
                  <span className="material-symbols-outlined text-[24px]">balance</span>
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-[20px] leading-7 font-semibold text-volt-primary">Cuadre Maestro de Facturación</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-volt-green-soft text-volt-green-ink border border-volt-green/20 inline-flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">check_circle</span>
                      100% Cuadrado (Diferencia $0.00 COP)
                    </span>
                  </div>
                  <p className="text-[14px] text-volt-ink-mute mt-0.5">
                    Factura General Enel: <strong className="text-volt-primary tabular-nums">$1,485,200 COP</strong> por <strong className="text-volt-primary tabular-nums">1,980 kWh</strong> a una tarifa base de <span className="font-semibold text-volt-primary tabular-nums">$750.10 / kWh</span>.
                  </p>
                </div>
              </div>

              {/* Fórmula de conciliación */}
              <div className="bg-volt-white border border-[#BFDFCA] rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-volt-subtle shrink-0">
                <div className="text-right">
                  <span className="text-[11px] font-semibold text-volt-outline uppercase tracking-wider block">Fórmula de Conciliación</span>
                  <div className="flex items-center gap-1.5 tabular-nums text-[13px] font-medium">
                    <span className="text-volt-ink-mute">Submedidores (6):</span>
                    <span className="font-semibold text-volt-primary">$1,360,200</span>
                    <span className="text-volt-outline font-bold">+</span>
                    <span className="text-volt-ink-mute">Salón & Garaje:</span>
                    <span className="font-semibold text-volt-primary">$125,000</span>
                  </div>
                </div>
                <div className="h-8 w-px bg-volt-rule-soft"></div>
                <div className="bg-volt-green/10 px-3 py-1.5 rounded-lg border border-volt-green/20">
                  <span className="text-[10px] text-volt-green font-bold uppercase tracking-wider block">Total Asignado</span>
                  <span className="text-[17px] font-bold text-volt-green tabular-nums">$1,485,200 COP</span>
                </div>
              </div>
            </div>

            {/* Barra de asignación */}
            <div className="pt-5 space-y-3 relative">
              <div className="flex items-center justify-between text-[12px]">
                <span className="font-semibold text-volt-primary flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px] text-volt-green">pie_chart</span>
                  Asignación Energética del Inmueble (1,980 kWh)
                </span>
                <span className="text-volt-ink-mute">6 unidades medidoras y zonas de servicio</span>
              </div>
              <div className="w-full h-4 rounded-full bg-volt-surface-mid overflow-hidden flex">
                <div className="bg-[#1F4D2B] h-full" style={{ width: '35.8%' }} title="Supermercado: 35.8% (710 kWh)"></div>
                <div className="bg-[#296B3C] h-full" style={{ width: '26.2%' }} title="Panadería: 26.2% (520 kWh)"></div>
                <div className="bg-[#487853] h-full" style={{ width: '14.1%' }} title="Apto 201: 14.1% (280 kWh)"></div>
                <div className="bg-[#6B9374] h-full" style={{ width: '9.6%' }} title="Boutique: 9.6% (190 kWh)"></div>
                <div className="bg-[#8EAF96] h-full" style={{ width: '7.1%' }} title="Salón Comunal: 7.1% (140 kWh)"></div>
                <div className="bg-[#B6CAB9] h-full" style={{ width: '7.2%' }} title="Garaje / Portón: 7.2% (140 kWh)"></div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-[12px] pt-1">
                {[
                  { color: '#1F4D2B', name: 'Supermercado', pct: '35.8%' },
                  { color: '#296B3C', name: 'Panadería', pct: '26.2%' },
                  { color: '#487853', name: 'Apto 201', pct: '14.1%' },
                  { color: '#6B9374', name: 'Boutique', pct: '9.6%' },
                  { color: '#8EAF96', name: 'Salón Comunal', pct: '7.1%' },
                  { color: '#B6CAB9', name: 'Garaje / Portón', pct: '7.2%' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded bg-volt-white/60 border border-black/5">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color }}></span>
                    <span className="text-volt-ink truncate">{item.name}</span>
                    <span className="font-bold ml-auto tabular-nums text-volt-primary">{item.pct}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ============ 4 KPIs ============ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* KPI 1: Factura Matriz (neutral) */}
            <div className="bg-volt-white border border-volt-rule-soft rounded-xl p-5 shadow-volt-subtle flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-volt-outline">Factura Matriz Enel</span>
                <div className="p-2 rounded-lg bg-volt-surface-low text-volt-primary">
                  <span className="material-symbols-outlined text-[18px]">receipt</span>
                </div>
              </div>
              <div className="my-2">
                <span className="text-[28px] leading-[34px] font-bold text-volt-primary tabular-nums tracking-tight block">$1,485,200</span>
                <span className="text-[12px] font-medium text-volt-ink-mute">COP Total a pagar al operador</span>
              </div>
              <div className="pt-2 border-t border-volt-rule-soft flex items-center justify-between text-[12px] text-volt-ink-mute">
                <span>Recibo N° 49102</span>
                <span className="px-2 py-0.5 rounded-full bg-volt-surface-high text-volt-primary font-medium">Octubre</span>
              </div>
            </div>

            {/* KPI 2: Consumo Medido (azul) */}
            <div className="bg-volt-white border-t-4 border-t-[#2B59C3] border-x border-b border-volt-rule-soft rounded-xl p-5 shadow-volt-subtle flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#2B59C3]">Consumo Medido</span>
                <div className="p-2 rounded-lg bg-blue-50 text-[#2B59C3]">
                  <span className="material-symbols-outlined text-[18px]">electric_meter</span>
                </div>
              </div>
              <div className="my-2">
                <span className="text-[28px] leading-[34px] font-bold text-volt-primary tabular-nums tracking-tight block">1,980 kWh</span>
                <span className="text-[12px] font-medium text-volt-ink-mute">Energía activa total registrada</span>
              </div>
              <div className="pt-2 border-t border-volt-rule-soft flex items-center justify-between text-[12px]">
                <span className="text-volt-ink-mute">6 de 6 medidores leídos</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-[#1B3F93] font-semibold text-[11px]">100% lectura</span>
              </div>
            </div>

            {/* KPI 3: Recaudado (verde claro) */}
            <div className="bg-[#F4F9F5] border border-[#BDE0C7] rounded-xl p-5 shadow-volt-subtle flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-volt-green">Recaudado Efectivo</span>
                <div className="p-2 rounded-lg bg-volt-green/15 text-volt-green">
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                </div>
              </div>
              <div className="my-2">
                <span className="text-[28px] leading-[34px] font-bold text-volt-green tabular-nums tracking-tight block">$950,500</span>
                <span className="text-[12px] font-medium text-volt-ink-mute">COP depositado en tesorería</span>
              </div>
              <div className="pt-2 border-t border-[#CCE6D3] flex items-center justify-between text-[12px]">
                <span className="text-volt-ink-mute">4 unidades al día</span>
                <span className="px-2 py-0.5 rounded-full bg-volt-green-soft text-volt-green-ink font-bold text-[11px]">64% pagado</span>
              </div>
            </div>

            {/* KPI 4: Pendiente (ámbar) */}
            <div className="bg-[#FDF9F2] border border-[#E9CE99] rounded-xl p-5 shadow-volt-subtle flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#995616]">Pendiente por Recaudar</span>
                <div className="p-2 rounded-lg bg-amber-100 text-[#995616]">
                  <span className="material-symbols-outlined text-[18px]">pending_actions</span>
                </div>
              </div>
              <div className="my-2">
                <span className="text-[28px] leading-[34px] font-bold text-[#995616] tabular-nums tracking-tight block">$534,700</span>
                <span className="text-[12px] font-medium text-volt-ink-mute">COP saldo por liquidar</span>
              </div>
              <div className="pt-2 border-t border-[#F1DCB3] flex items-center justify-between text-[12px]">
                <span className="text-volt-ink-mute">2 unidades pendientes</span>
                <span className="px-2 py-0.5 rounded-full bg-volt-amber-soft text-volt-amber-deep font-bold text-[11px]">36% saldo</span>
              </div>
            </div>
          </div>

          {/* ============ TABLA LIQUIDACIÓN ============ */}
          <div className="bg-volt-white border border-volt-rule-soft rounded-2xl shadow-volt-subtle overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-volt-rule-soft flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-[20px] leading-7 font-semibold text-volt-primary">Liquidación Detallada por Inquilino</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-volt-surface-low text-volt-primary border border-volt-rule-soft">Ciclo Activo · Octubre 2024</span>
                </div>
                <p className="text-[14px] text-volt-ink-mute mt-1">
                  Tarifa base aplicada: <strong className="text-volt-primary tabular-nums">$750.10 / kWh</strong> + cargo fijo operativo por unidad.
                </p>
              </div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <button className="px-3.5 py-2 bg-volt-surface-low hover:bg-volt-surface-mid text-volt-ink text-[12px] font-semibold rounded-lg border border-volt-rule-soft flex items-center gap-1.5 transition-colors">
                  <span className="material-symbols-outlined text-[16px] text-volt-outline">compare_arrows</span>
                  Comparar Ciclo Ant.
                </button>
                <button className="px-3.5 py-2 bg-volt-surface-low hover:bg-volt-surface-mid text-volt-ink text-[12px] font-semibold rounded-lg border border-volt-rule-soft flex items-center gap-1.5 transition-colors">
                  <span className="material-symbols-outlined text-[16px] text-volt-outline">download</span>
                  Exportar Resumen
                </button>
              </div>
            </div>

            {/* Filter bar */}
            <div className="px-6 py-3 bg-volt-surface-low/60 border-b border-volt-rule-soft flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button className="px-3 py-1 rounded-full text-[12px] font-semibold bg-volt-primary text-volt-white">Todos (6)</button>
                <button className="px-3 py-1 rounded-full text-[12px] font-semibold bg-volt-white text-volt-ink border border-volt-rule-soft hover:bg-volt-surface-mid flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-volt-green"></span> Pagados (4)
                </button>
                <button className="px-3 py-1 rounded-full text-[12px] font-semibold bg-volt-white text-volt-ink border border-volt-rule-soft hover:bg-volt-surface-mid flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#995616]"></span> Pendientes (2)
                </button>
              </div>
              <div className="relative w-full sm:w-64">
                <span className="material-symbols-outlined absolute left-2.5 top-1.5 text-volt-outline text-[16px]">search</span>
                <input
                  className="w-full pl-8 pr-3 py-1 bg-volt-white border border-volt-rule-soft rounded-lg text-[12px] focus:outline-none focus:border-volt-primary"
                  placeholder="Filtrar por inquilino o medidor..."
                  type="text"
                />
              </div>
            </div>

            {/* Tabla */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse table-fixed">
                <colgroup>
                  <col style={{ width: '18%' }} />
                  <col style={{ width: '18%' }} />
                  <col style={{ width: '24%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '16%' }} />
                  <col style={{ width: '12%' }} />
                </colgroup>
                <thead>
                  <tr className="border-b border-volt-rule-soft bg-volt-surface-low/60 text-[11px] font-semibold text-volt-ink-mute uppercase tracking-wider">
                    <th className="py-3.5 px-4">Unidad</th>
                    <th className="py-3.5 px-4">Arrendatario</th>
                    <th className="py-3.5 px-4">Medidor / Seriales</th>
                    <th className="py-3.5 px-4 text-right">Coef. Áreas Comunes</th>
                    <th className="py-3.5 px-4">Tarifa</th>
                    <th className="py-3.5 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-volt-rule-soft/60">

                  {/* Local 1 */}
                  <tr className="hover:bg-volt-surface-low/40 transition-colors">
                    <td className="py-4 px-4 align-top">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-volt-surface-high border border-volt-rule-soft flex items-center justify-center text-volt-primary shrink-0">
                          <span className="material-symbols-outlined text-[18px]">storefront</span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-[14px] font-bold text-volt-primary">Local 1</p>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-volt-green/10 text-volt-green border border-volt-green/20">ACTIVO</span>
                          </div>
                          <p className="text-[11px] text-volt-ink-mute truncate">Panadería La Espiga</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 align-top">
                      <p className="text-[13px] font-medium text-volt-primary truncate">Carlos M. Restrepo</p>
                      <a href="https://wa.me/573118492011" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#25D366]/15 text-[#1F4D2B] border border-[#25D366]/30 hover:bg-[#25D366]/25 transition-colors">
                        <span className="material-symbols-outlined text-[11px]">chat</span> 311 849 2011
                      </a>
                    </td>
                    <td className="py-4 px-4 align-top">
                      <p className="text-[12px] font-medium text-volt-primary">Medidor Normal Digital</p>
                      <p className="text-[11px] text-volt-outline font-mono">#MED-94021</p>
                    </td>
                    <td className="py-4 px-4 text-right align-top">
                      <span className="font-bold text-volt-primary text-[14px] tabular-nums">28.50%</span>
                      <p className="text-[10px] text-volt-ink-mute">85.5 m²</p>
                    </td>
                    <td className="py-4 px-4 align-top">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-semibold bg-volt-surface-high text-volt-primary border border-volt-rule-soft">
                        Comercial · $900
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center align-top">
                      <div className="flex items-center justify-center gap-0.5">
                        <button className="p-1.5 hover:text-volt-primary hover:bg-volt-surface-mid rounded transition-colors" title="Editar">
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                        <button className="p-1.5 hover:text-volt-primary hover:bg-volt-surface-mid rounded transition-colors" title="Historial">
                          <span className="material-symbols-outlined text-[16px]">show_chart</span>
                        </button>
                        <button className="p-1.5 hover:text-volt-primary hover:bg-volt-surface-mid rounded transition-colors" title="Más">
                          <span className="material-symbols-outlined text-[16px]">more_vert</span>
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Local 2 — Trifásico */}
                  <tr className="bg-volt-surface-low/30 border-l-4 border-l-[#cd7e2e] hover:bg-volt-surface-low/40 transition-colors">
                    <td className="py-4 px-4 align-top">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-volt-amber-soft border border-volt-rule-soft flex items-center justify-center text-volt-amber-deep shrink-0">
                          <span className="material-symbols-outlined text-[18px]">shopping_cart</span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-[14px] font-bold text-volt-primary">Local 2</p>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#995616]/15 text-[#995616] border border-[#995616]/30">TRIFÁSICO</span>
                          </div>
                          <p className="text-[11px] text-volt-ink-mute truncate">Minimarket San Juan</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 align-top">
                      <p className="text-[13px] font-medium text-volt-primary truncate">Dra. Marta L. Gómez</p>
                      <a href="https://wa.me/573152048831" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#25D366]/15 text-[#1F4D2B] border border-[#25D366]/30 hover:bg-[#25D366]/25 transition-colors">
                        <span className="material-symbols-outlined text-[11px]">chat</span> 315 204 8831
                      </a>
                    </td>
                    <td className="py-4 px-4 align-top">
                      <div className="p-2 bg-volt-bg rounded-lg border border-volt-rule-soft space-y-1">
                        <div className="flex items-center justify-between gap-2 text-[11px]">
                          <span className="text-volt-ink-mute font-medium truncate">Normal:</span>
                          <span className="font-mono font-semibold text-volt-primary shrink-0">#MED-8812-A</span>
                        </div>
                        <div className="flex items-center justify-between gap-2 text-[11px]">
                          <span className="text-volt-ink-mute font-medium truncate">Trifásico:</span>
                          <span className="font-mono font-bold text-[#995616] shrink-0">#MED-8812-B</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right align-top">
                      <span className="font-bold text-volt-primary text-[14px] tabular-nums">34.00%</span>
                      <p className="text-[10px] text-volt-ink-mute">102.0 m²</p>
                    </td>
                    <td className="py-4 px-4 align-top">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-semibold bg-volt-surface-high text-volt-primary border border-volt-rule-soft">
                        Gran Consumo · $900
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center align-top">
                      <div className="flex items-center justify-center gap-0.5">
                        <button className="p-1.5 hover:text-volt-primary hover:bg-volt-surface-mid rounded transition-colors" title="Editar">
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                        <button className="p-1.5 hover:text-[#995616] hover:bg-volt-surface-mid rounded transition-colors" title="Ver medidores">
                          <span className="material-symbols-outlined text-[16px] text-[#995616]">account_tree</span>
                        </button>
                        <button className="p-1.5 hover:text-volt-primary hover:bg-volt-surface-mid rounded transition-colors" title="Más">
                          <span className="material-symbols-outlined text-[16px]">more_vert</span>
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Local 3 */}
                  <tr className="hover:bg-volt-surface-low/40 transition-colors">
                    <td className="py-4 px-4 align-top">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-volt-surface-high border border-volt-rule-soft flex items-center justify-center text-volt-primary shrink-0">
                          <span className="material-symbols-outlined text-[18px]">checkroom</span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-[14px] font-bold text-volt-primary">Local 3</p>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-volt-green/10 text-volt-green border border-volt-green/20">ACTIVO</span>
                          </div>
                          <p className="text-[11px] text-volt-ink-mute truncate">Boutique Mariana</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 align-top">
                      <p className="text-[13px] font-medium text-volt-primary truncate">Mariana Restrepo</p>
                      <a href="https://wa.me/573104451190" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#25D366]/15 text-[#1F4D2B] border border-[#25D366]/30 hover:bg-[#25D366]/25 transition-colors">
                        <span className="material-symbols-outlined text-[11px]">chat</span> 310 445 1190
                      </a>
                    </td>
                    <td className="py-4 px-4 align-top">
                      <p className="text-[12px] font-medium text-volt-primary">Medidor Normal Digital</p>
                      <p className="text-[11px] text-volt-outline font-mono">#MED-3301</p>
                    </td>
                    <td className="py-4 px-4 text-right align-top">
                      <span className="font-bold text-volt-primary text-[14px] tabular-nums">15.20%</span>
                      <p className="text-[10px] text-volt-ink-mute">45.6 m²</p>
                    </td>
                    <td className="py-4 px-4 align-top">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-semibold bg-volt-surface-high text-volt-primary border border-volt-rule-soft">
                        Comercial · $900
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center align-top">
                      <div className="flex items-center justify-center gap-0.5">
                        <button className="p-1.5 hover:text-volt-primary hover:bg-volt-surface-mid rounded transition-colors" title="Editar">
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                        <button className="p-1.5 hover:text-volt-primary hover:bg-volt-surface-mid rounded transition-colors" title="Historial">
                          <span className="material-symbols-outlined text-[16px]">show_chart</span>
                        </button>
                        <button className="p-1.5 hover:text-volt-primary hover:bg-volt-surface-mid rounded transition-colors" title="Más">
                          <span className="material-symbols-outlined text-[16px]">more_vert</span>
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Apto 201 */}
                  <tr className="hover:bg-volt-surface-low/40 transition-colors">
                    <td className="py-4 px-4 align-top">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-volt-surface-high border border-volt-rule-soft flex items-center justify-center text-volt-primary shrink-0">
                          <span className="material-symbols-outlined text-[18px]">home</span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-[14px] font-bold text-volt-primary">Apto 201</p>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-volt-green/10 text-volt-green border border-volt-green/20">ACTIVO</span>
                          </div>
                          <p className="text-[11px] text-volt-ink-mute truncate">Residencial</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 align-top">
                      <p className="text-[13px] font-medium text-volt-primary truncate">Andrés F. Parra</p>
                      <a href="https://wa.me/573006719022" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#25D366]/15 text-[#1F4D2B] border border-[#25D366]/30 hover:bg-[#25D366]/25 transition-colors">
                        <span className="material-symbols-outlined text-[11px]">chat</span> 300 671 9022
                      </a>
                    </td>
                    <td className="py-4 px-4 align-top">
                      <p className="text-[12px] font-medium text-volt-primary">Medidor Normal Residencial</p>
                      <p className="text-[11px] text-volt-outline font-mono">#MED-5521</p>
                    </td>
                    <td className="py-4 px-4 text-right align-top">
                      <span className="font-bold text-volt-primary text-[14px] tabular-nums">14.80%</span>
                      <p className="text-[10px] text-volt-ink-mute">44.4 m²</p>
                    </td>
                    <td className="py-4 px-4 align-top">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-semibold bg-[#995616]/10 text-[#995616] border border-[#995616]/30">
                        Residencial · $780
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center align-top">
                      <div className="flex items-center justify-center gap-0.5">
                        <button className="p-1.5 hover:text-volt-primary hover:bg-volt-surface-mid rounded transition-colors" title="Editar">
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                        <button className="p-1.5 hover:text-volt-primary hover:bg-volt-surface-mid rounded transition-colors" title="Historial">
                          <span className="material-symbols-outlined text-[16px]">show_chart</span>
                        </button>
                        <button className="p-1.5 hover:text-volt-primary hover:bg-volt-surface-mid rounded transition-colors" title="Más">
                          <span className="material-symbols-outlined text-[16px]">more_vert</span>
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Garaje */}
                  <tr className="hover:bg-volt-surface-low/40 transition-colors">
                    <td className="py-4 px-4 align-top">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-volt-surface-highest border border-volt-rule-soft flex items-center justify-center text-volt-primary shrink-0">
                          <span className="material-symbols-outlined text-[18px]">garage</span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-[14px] font-bold text-volt-primary">Garaje</p>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-volt-green/10 text-volt-green border border-volt-green/20">ACTIVO</span>
                          </div>
                          <p className="text-[11px] text-volt-ink-mute truncate">Portón vehicular</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 align-top">
                      <p className="text-[13px] font-medium text-volt-primary truncate">Administración</p>
                      <p className="text-[10px] text-volt-ink-mute">Copropiedad</p>
                    </td>
                    <td className="py-4 px-4 align-top">
                      <p className="text-[12px] font-medium text-volt-primary">Medidor Normal Acceso</p>
                      <p className="text-[11px] text-volt-outline font-mono">#MED-GAR-01</p>
                    </td>
                    <td className="py-4 px-4 text-right align-top">
                      <span className="font-bold text-volt-primary text-[14px] tabular-nums">3.75%</span>
                      <p className="text-[10px] text-volt-ink-mute">11.25 m²</p>
                    </td>
                    <td className="py-4 px-4 align-top">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-semibold bg-volt-surface-high text-volt-primary border border-volt-rule-soft">
                        Expensas
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center align-top">
                      <div className="flex items-center justify-center gap-0.5">
                        <button className="p-1.5 hover:text-volt-primary hover:bg-volt-surface-mid rounded transition-colors" title="Editar">
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                        <button className="p-1.5 hover:text-volt-primary hover:bg-volt-surface-mid rounded transition-colors" title="Historial">
                          <span className="material-symbols-outlined text-[16px]">show_chart</span>
                        </button>
                        <button className="p-1.5 hover:text-volt-primary hover:bg-volt-surface-mid rounded transition-colors" title="Más">
                          <span className="material-symbols-outlined text-[16px]">more_vert</span>
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Salón Comunal */}
                  <tr className="hover:bg-volt-surface-low/40 transition-colors">
                    <td className="py-4 px-4 align-top">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-volt-surface-highest border border-volt-rule-soft flex items-center justify-center text-volt-primary shrink-0">
                          <span className="material-symbols-outlined text-[18px]">meeting_room</span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-[14px] font-bold text-volt-primary">Salón</p>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-volt-green/10 text-volt-green border border-volt-green/20">ACTIVO</span>
                          </div>
                          <p className="text-[11px] text-volt-ink-mute truncate">Salón Comunal</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 align-top">
                      <p className="text-[13px] font-medium text-volt-primary truncate">Administración</p>
                      <p className="text-[10px] text-volt-ink-mute">Copropiedad</p>
                    </td>
                    <td className="py-4 px-4 align-top">
                      <p className="text-[12px] font-medium text-volt-primary">Medidor Normal Eventos</p>
                      <p className="text-[11px] text-volt-outline font-mono">#MED-SAL-01</p>
                    </td>
                    <td className="py-4 px-4 text-right align-top">
                      <span className="font-bold text-volt-primary text-[14px] tabular-nums">3.75%</span>
                      <p className="text-[10px] text-volt-ink-mute">11.25 m²</p>
                    </td>
                    <td className="py-4 px-4 align-top">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-semibold bg-volt-surface-high text-volt-primary border border-volt-rule-soft">
                        Expensas
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center align-top">
                      <div className="flex items-center justify-center gap-0.5">
                        <button className="p-1.5 hover:text-volt-primary hover:bg-volt-surface-mid rounded transition-colors" title="Editar">
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                        <button className="p-1.5 hover:text-volt-primary hover:bg-volt-surface-mid rounded transition-colors" title="Historial">
                          <span className="material-symbols-outlined text-[16px]">show_chart</span>
                        </button>
                        <button className="p-1.5 hover:text-volt-primary hover:bg-volt-surface-mid rounded transition-colors" title="Más">
                          <span className="material-symbols-outlined text-[16px]">more_vert</span>
                        </button>
                      </div>
                    </td>
                  </tr>

                </tbody>
              </table>
            </div>

            {/* Totales */}
            <div className="p-5 bg-volt-surface-low border-t-2 border-volt-primary/20 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 items-center">
                <div>
                  <span className="text-[10px] uppercase font-bold text-volt-outline tracking-wider block">Energía Total Medida</span>
                  <span className="font-bold text-[16px] text-volt-primary tabular-nums">1,980 kWh</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-volt-outline tracking-wider block">Total Liquidado</span>
                  <span className="font-bold text-[16px] text-volt-primary tabular-nums">$1,485,200 COP</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-volt-green tracking-wider block">Recaudado (Efectivo)</span>
                  <span className="font-bold text-[16px] text-volt-green tabular-nums">$950,500 COP</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#995616] tracking-wider block">Saldo Pendiente</span>
                  <span className="font-bold text-[16px] text-[#995616] tabular-nums">$534,700 COP</span>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <button className="px-4 py-2 rounded-lg bg-volt-white hover:bg-volt-surface-low text-volt-primary border border-volt-rule-soft font-semibold text-[13px] flex items-center gap-1.5 transition-colors">
                  <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                  Descargar Planilla PDF
                </button>
                <button className="px-4 py-2 rounded-lg bg-volt-green hover:bg-volt-green-ink text-volt-white font-semibold text-[13px] flex items-center gap-1.5 transition-colors">
                  <span className="material-symbols-outlined text-[16px]">outgoing_mail</span>
                  Notificar Pendientes por WhatsApp
                </button>
              </div>
            </div>
          </div>

          {/* ============ COBROS PENDIENTES ============ */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-[20px] leading-7 font-semibold text-volt-primary tracking-tight">Cobros & Saldos Pendientes</h2>
                <p className="text-[14px] text-volt-ink-mute mt-0.5">Seguimiento individual de recaudación para el ciclo actual (Octubre 2024)</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-volt-outline">Total por recaudar:</span>
                <span className="text-[16px] font-bold text-[#995616] tabular-nums">$534,700 COP</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: 'Local 2 · Minimarket San Juan', kwh: '710 kWh consumidos (3 medidores)', date: '02 Nov', amount: '$567,571' },
                { name: 'Apartamento 201', kwh: '280 kWh consumidos', date: '02 Nov', amount: '$225,028' },
              ].map((item, i) => (
                <div key={i} className="bg-volt-white border border-volt-rule-soft rounded-2xl p-6 flex flex-col justify-between gap-4 shadow-volt-subtle hover:border-[#E9CE99] transition-colors">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-volt-primary text-[15px]">{item.name}</span>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-[#995616] font-semibold border border-amber-300">Pendiente</span>
                        </div>
                        <p className="text-[12px] text-volt-ink-mute mt-0.5">{item.kwh} · Facturado el {item.date}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[20px] font-bold text-volt-primary tabular-nums">{item.amount}</div>
                        <div className="text-[11px] text-volt-outline font-medium">COP</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[12px] text-[#995616] bg-[#FDF9F2] border border-[#F1DCB3] px-3 py-1.5 rounded-lg w-fit">
                      <span className="material-symbols-outlined text-[14px]">schedule</span>
                      <span className="font-medium">Vence en 8 días (15 de Noviembre)</span>
                    </div>
                  </div>
                  <div className="pt-3 flex items-center gap-3 border-t border-volt-rule-soft">
                    <button className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-volt-primary text-volt-white text-[12px] font-semibold hover:bg-volt-primary-soft transition-colors">
                      <span className="material-symbols-outlined text-[16px]">payments</span>
                      Registrar Pago
                    </button>
                    <button className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#25D366]/40 bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#0F6830] text-[12px] font-semibold transition-colors">
                      <span className="material-symbols-outlined text-[16px]">chat</span>
                      Recordatorio WhatsApp
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ============ ACCIONES & PRORRATEO ============ */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Acciones de Emisión */}
            <div className="lg:col-span-7 bg-volt-white border border-volt-rule-soft rounded-2xl p-6 space-y-4 shadow-volt-subtle">
              <div>
                <h3 className="text-[15px] font-bold text-volt-primary">Acciones de Emisión & Reportes</h3>
                <p className="text-[12px] text-volt-ink-mute mt-0.5">Genera y comparte cuentas de cobro directamente con los inquilinos</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <button className="p-3.5 rounded-xl border border-volt-rule-soft bg-volt-surface-low hover:bg-volt-surface-mid transition-colors text-left flex flex-col justify-between gap-3">
                  <div className="w-8 h-8 rounded-lg bg-volt-surface-mid border border-volt-rule-soft flex items-center justify-center text-volt-primary">
                    <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                  </div>
                  <div>
                    <div className="text-[12px] font-bold text-volt-primary leading-snug">Descargar Resumen PDF</div>
                    <div className="text-[11px] text-volt-ink-mute mt-0.5">Reporte contable general del período</div>
                  </div>
                </button>
                <button className="p-3.5 rounded-xl border border-[#25D366]/40 bg-[#F2F8F4] hover:bg-[#E5F3E8] transition-colors text-left flex flex-col justify-between gap-3">
                  <div className="w-8 h-8 rounded-lg bg-volt-green/15 flex items-center justify-center text-volt-green">
                    <span className="material-symbols-outlined text-[18px]">send</span>
                  </div>
                  <div>
                    <div className="text-[12px] font-bold text-volt-primary leading-snug">Enviar por WhatsApp</div>
                    <div className="text-[11px] text-volt-ink-mute mt-0.5">Notificar saldos pendientes de cobro</div>
                  </div>
                </button>
                <button className="p-3.5 rounded-xl border border-volt-rule-soft bg-volt-surface-low hover:bg-volt-surface-mid transition-colors text-left flex flex-col justify-between gap-3">
                  <div className="w-8 h-8 rounded-lg bg-volt-surface-mid border border-volt-rule-soft flex items-center justify-center text-volt-primary">
                    <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                  </div>
                  <div>
                    <div className="text-[12px] font-bold text-volt-primary leading-snug">Lectura con Cámara</div>
                    <div className="text-[11px] text-volt-ink-mute mt-0.5">Captura rápida mensual de medidores</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Criterio de Prorrateo */}
            <div className="lg:col-span-5 bg-volt-surface-low border border-volt-rule-soft rounded-2xl p-6 flex flex-col justify-between gap-3 shadow-volt-subtle">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-volt-green text-[16px]">balance</span>
                  <span className="font-bold text-volt-primary text-[14px]">Criterio de Prorrateo & Reglas</span>
                </div>
                <p className="text-[12px] text-volt-ink-mute leading-relaxed">
                  El Salón Comunal ($62,515 COP) y el Garaje/Portón ($62,515 COP) se concilian directamente como expensas comunes del inmueble ($125,030 COP). El valor del kWh ($750.10 COP) y cargos fijos se aplican de forma proporcional y transparente según la lectura individual de cada medidor.
                </p>
              </div>
              <div className="pt-2 border-t border-volt-rule-soft flex items-center justify-between text-[11px] text-volt-outline flex-wrap gap-2">
                <span>Normativa RETIE · Resolución CREG</span>
                <a className="text-volt-green font-semibold hover:underline flex items-center gap-1 cursor-pointer">
                  <span>Configurar tarifas</span>
                  <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                </a>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="pt-2 pb-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-volt-ink-mute border-t border-volt-rule-soft gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-volt-green"></span>
              <span>Servidor de Medición Remota Conectado · Sincronizado hace 14 minutos</span>
            </div>
            <div className="flex items-center gap-4">
              <span>VoltAdmin v3.8.4 Enterprise</span>
              <span>Soporte Inmueble Los Cedros PH</span>
            </div>
          </footer>
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
      {/* ============ UNIDADES — DISEÑO VOLT ============ */}
      {activeTab === 'units' && (
        <div className="animate-fadeIn space-y-5">

          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-3 border-b border-volt-rule-soft">
            <div>
              <h1 className="text-[32px] leading-10 font-semibold text-volt-primary tracking-tight">
                Configuración de Unidades y Medidores
              </h1>
              <p className="text-[14px] leading-[22px] text-volt-ink-mute mt-1 max-w-3xl">
                Administra los locales, tipos de medidores eléctricos, datos de contacto para avisos de WhatsApp y las reglas tarifarias de liquidación.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button className="px-3 py-2 rounded-lg border border-volt-rule-soft text-volt-primary hover:bg-volt-surface-low transition-colors text-[13px] font-medium flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">rule</span>
                Auditar calibración
              </button>
              <button
                onClick={() => setShowCreatePropertyModal(true)}
                className="px-3 py-2 rounded-lg bg-volt-primary text-volt-white hover:bg-volt-primary-soft transition-colors text-[13px] font-medium flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                Nueva Unidad
              </button>
            </div>
          </div>

          {/* 4 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-volt-white border border-volt-rule-soft rounded-xl p-5 shadow-volt-subtle">
              <div className="flex items-center justify-between text-volt-ink-mute mb-2">
                <span className="text-[13px] font-medium">Unidades Arrendadas</span>
                <span className="material-symbols-outlined text-[20px] text-volt-primary">storefront</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[28px] leading-[34px] font-bold text-volt-primary tabular-nums">6</span>
                <span className="text-[13px] text-volt-ink-mute">locales y aptos</span>
              </div>
              <div className="mt-2 flex items-center gap-1 text-[11px] text-volt-green font-semibold bg-volt-green/10 px-2 py-1 rounded-lg border border-volt-green/20 w-fit">
                <span className="material-symbols-outlined text-[13px]">check_circle</span>
                <span>100% ocupación activa</span>
              </div>
            </div>

            <div className="bg-volt-white border border-volt-rule-soft rounded-xl p-5 shadow-volt-subtle">
              <div className="flex items-center justify-between text-volt-ink-mute mb-2">
                <span className="text-[13px] font-medium">Medidores Físicos</span>
                <span className="material-symbols-outlined text-[20px] text-[#cd7e2e]">electric_meter</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[28px] leading-[34px] font-bold text-volt-primary tabular-nums">8</span>
                <span className="text-[13px] text-volt-ink-mute">medidores en total</span>
              </div>
              <div className="mt-2 text-[11px] text-[#995616] font-medium bg-[#995616]/10 px-2 py-1 rounded-lg border border-[#995616]/20 w-fit flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">account_tree</span>
                <span>Local 2 con sistema trifásico</span>
              </div>
            </div>

            <div className="bg-volt-white border border-volt-rule-soft rounded-xl p-5 shadow-volt-subtle">
              <div className="flex items-center justify-between text-volt-ink-mute mb-2">
                <span className="text-[13px] font-medium">Capacidad Eléctrica</span>
                <span className="material-symbols-outlined text-[20px] text-volt-primary">offline_bolt</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[28px] leading-[34px] font-bold text-volt-primary tabular-nums">60.0</span>
                <span className="text-[13px] text-volt-ink-mute">kVA Global</span>
              </div>
              <p className="mt-2 text-[11px] text-volt-ink-mute bg-volt-surface-low px-2 py-1 rounded-lg border border-volt-rule-soft w-fit flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px] text-volt-outline">bolt</span>
                <span>Transformador propio del PH</span>
              </p>
            </div>

            <div className="bg-volt-white border border-volt-rule-soft rounded-xl p-5 shadow-volt-subtle">
              <div className="flex items-center justify-between text-volt-ink-mute mb-2">
                <span className="text-[13px] font-medium">Calibración</span>
                <span className="material-symbols-outlined text-[20px] text-volt-green">published_with_changes</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[28px] leading-[34px] font-bold text-volt-green tabular-nums">100%</span>
                <span className="text-[13px] text-volt-ink-mute">calibrados</span>
              </div>
              <div className="mt-2 flex items-center gap-1 text-[11px] text-volt-green font-semibold bg-volt-green/10 px-2 py-1 rounded-lg border border-volt-green/20 w-fit">
                <span className="material-symbols-outlined text-[13px]">verified</span>
                <span>Vigencia RETIE Dic 2025</span>
              </div>
            </div>
          </div>

          {/* Tabla Principal */}
          <div className="bg-volt-white border border-volt-rule-soft rounded-xl shadow-volt-subtle overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-volt-rule-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-[17px] font-semibold text-volt-primary">Listado de Unidades y Medidores</h2>
                <p className="text-[13px] text-volt-ink-mute">6 registros configurados con coeficiente y canal de contacto directo</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2 text-[18px] text-volt-outline">search</span>
                  <input
                    className="pl-9 pr-3 py-1.5 bg-volt-bg border border-volt-rule-soft rounded-lg text-[14px] text-volt-primary placeholder:text-volt-outline focus:outline-none focus:border-volt-primary transition-colors w-64"
                    placeholder="Filtrar por unidad o arrendatario..."
                    type="text"
                  />
                </div>
                <button className="p-2 border border-volt-rule-soft rounded-lg hover:bg-volt-surface-low text-volt-ink-mute transition-colors" title="Exportar">
                  <span className="material-symbols-outlined text-[18px]">download</span>
                </button>
              </div>
            </div>

            {/* Tabla */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-volt-rule-soft bg-volt-surface-low/60 text-[11px] font-semibold text-volt-ink-mute uppercase tracking-wider">
                    <th className="py-3.5 px-5">Unidad / Razón Social</th>
                    <th className="py-3.5 px-5">Arrendatario &amp; WhatsApp</th>
                    <th className="py-3.5 px-5">Medidor / Seriales</th>
                    <th className="py-3.5 px-5 text-right">Coeficiente Áreas Comunes</th>
                    <th className="py-3.5 px-5">Tarifa Aplicada</th>
                    <th className="py-3.5 px-5 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-volt-rule-soft/60">

                  {/* Local 1 */}
                  <tr className="hover:bg-volt-surface-low/40 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-volt-surface-high border border-volt-rule-soft flex items-center justify-center text-volt-primary shrink-0">
                          <span className="material-symbols-outlined text-[18px]">storefront</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-[15px] font-bold text-volt-primary">Local 1</p>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-volt-green/10 text-volt-green border border-volt-green/20">ACTIVO</span>
                          </div>
                          <p className="text-[12px] text-volt-ink-mute">Panadería La Espiga Dorada SAS</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <p className="font-medium text-volt-primary text-[13px]">Carlos Mario Restrepo</p>
                      <a href="https://wa.me/573118492011" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#25D366]/15 text-[#1F4D2B] border border-[#25D366]/30 hover:bg-[#25D366]/25 transition-colors">
                        <span className="material-symbols-outlined text-[12px]">chat</span> +57 311 849 2011
                      </a>
                    </td>
                    <td className="py-4 px-5">
                      <p className="text-[13px] font-medium text-volt-primary">Medidor Normal Digital</p>
                      <p className="text-[11px] text-volt-primary font-bold">#MED-94021</p>
                      <p className="text-[11px] text-volt-ink-mute tabular-nums">Factor 1.0 · Acreditado RETIE</p>
                    </td>
                    <td className="py-4 px-5 text-right tabular-nums">
                      <span className="font-bold text-volt-primary text-[15px]">28.50%</span>
                      <p className="text-[11px] text-volt-ink-mute">85.5 m² privativo</p>
                    </td>
                    <td className="py-4 px-5">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-volt-surface-high text-volt-primary border border-volt-rule-soft">
                        Comercial · $900
                      </span>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <div className="flex items-center justify-center gap-1 text-volt-ink-mute">
                        <button className="p-1.5 hover:text-volt-primary hover:bg-volt-surface-mid rounded transition-colors" title="Editar">
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button className="p-1.5 hover:text-volt-primary hover:bg-volt-surface-mid rounded transition-colors" title="Historial">
                          <span className="material-symbols-outlined text-[18px]">show_chart</span>
                        </button>
                        <button className="p-1.5 hover:text-volt-primary hover:bg-volt-surface-mid rounded transition-colors" title="Más">
                          <span className="material-symbols-outlined text-[18px]">more_vert</span>
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Local 2 — Trifásico (destacado) */}
                  <tr className="bg-volt-surface-low/30 border-l-4 border-l-[#cd7e2e] hover:bg-volt-surface-low/40 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-volt-amber-soft border border-volt-rule-soft flex items-center justify-center text-volt-amber-deep shrink-0">
                          <span className="material-symbols-outlined text-[18px]">shopping_cart</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-[15px] font-bold text-volt-primary">Local 2</p>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#995616]/15 text-[#995616] border border-[#995616]/30">SISTEMA TRIFÁSICO</span>
                          </div>
                          <p className="text-[12px] text-volt-ink-mute">Supermercado / Minimarket San Juan</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <p className="font-medium text-volt-primary text-[13px]">Dra. Marta Lucía Gómez</p>
                      <a href="https://wa.me/573152048831" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#25D366]/15 text-[#1F4D2B] border border-[#25D366]/30 hover:bg-[#25D366]/25 transition-colors">
                        <span className="material-symbols-outlined text-[12px]">chat</span> +57 315 204 8831
                      </a>
                    </td>
                    <td className="py-4 px-5">
                      <div className="p-2 bg-volt-bg rounded-lg border border-volt-rule-soft space-y-1.5 min-w-[240px]">
                        <div className="text-[12px] flex items-center justify-between border-b border-volt-rule-soft pb-1">
                          <span className="text-volt-ink-mute font-medium">1. Medidor Normal:</span>
                          <span className="font-mono font-semibold text-volt-primary">#MED-8812-A</span>
                        </div>
                        <div className="text-[12px] flex items-center justify-between">
                          <span className="text-volt-ink-mute font-medium">2. Medidor Trifásico 220V:</span>
                          <span className="font-bold text-[#995616]">#MED-8812-B</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5 text-right tabular-nums">
                      <span className="font-bold text-volt-primary text-[15px]">34.00%</span>
                      <p className="text-[11px] text-volt-ink-mute">102.0 m² privativo</p>
                    </td>
                    <td className="py-4 px-5">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-volt-surface-high text-volt-primary border border-volt-rule-soft">
                        Gran Consumo · $900
                      </span>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <div className="flex items-center justify-center gap-1 text-volt-ink-mute">
                        <button className="p-1.5 hover:text-volt-primary hover:bg-volt-surface-mid rounded transition-colors" title="Editar">
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button className="p-1.5 hover:text-[#995616] hover:bg-volt-surface-mid rounded transition-colors" title="Ver medidores">
                          <span className="material-symbols-outlined text-[18px] text-[#995616]">account_tree</span>
                        </button>
                        <button className="p-1.5 hover:text-volt-primary hover:bg-volt-surface-mid rounded transition-colors" title="Más">
                          <span className="material-symbols-outlined text-[18px]">more_vert</span>
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Local 3 */}
                  <tr className="hover:bg-volt-surface-low/40 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-volt-surface-high border border-volt-rule-soft flex items-center justify-center text-volt-primary shrink-0">
                          <span className="material-symbols-outlined text-[18px]">checkroom</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-[15px] font-bold text-volt-primary">Local 3</p>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-volt-green/10 text-volt-green border border-volt-green/20">ACTIVO</span>
                          </div>
                          <p className="text-[12px] text-volt-ink-mute">Boutique Mariana Restrepo / Modas</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <p className="font-medium text-volt-primary text-[13px]">Mariana Restrepo</p>
                      <a href="https://wa.me/573104451190" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#25D366]/15 text-[#1F4D2B] border border-[#25D366]/30 hover:bg-[#25D366]/25 transition-colors">
                        <span className="material-symbols-outlined text-[12px]">chat</span> +57 310 445 1190
                      </a>
                    </td>
                    <td className="py-4 px-5">
                      <p className="text-[13px] font-medium text-volt-primary">Medidor Normal Digital</p>
                      <p className="text-[11px] text-volt-primary font-bold">#MED-3301</p>
                      <p className="text-[11px] text-volt-ink-mute tabular-nums">Factor 1.0 · Acreditado RETIE</p>
                    </td>
                    <td className="py-4 px-5 text-right tabular-nums">
                      <span className="font-bold text-volt-primary text-[15px]">15.20%</span>
                      <p className="text-[11px] text-volt-ink-mute">45.6 m² privativo</p>
                    </td>
                    <td className="py-4 px-5">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-volt-surface-high text-volt-primary border border-volt-rule-soft">
                        Comercial · $900
                      </span>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <div className="flex items-center justify-center gap-1 text-volt-ink-mute">
                        <button className="p-1.5 hover:text-volt-primary hover:bg-volt-surface-mid rounded transition-colors" title="Editar">
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button className="p-1.5 hover:text-volt-primary hover:bg-volt-surface-mid rounded transition-colors" title="Historial">
                          <span className="material-symbols-outlined text-[18px]">show_chart</span>
                        </button>
                        <button className="p-1.5 hover:text-volt-primary hover:bg-volt-surface-mid rounded transition-colors" title="Más">
                          <span className="material-symbols-outlined text-[18px]">more_vert</span>
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Apartamento 201 */}
                  <tr className="hover:bg-volt-surface-low/40 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-volt-surface-high border border-volt-rule-soft flex items-center justify-center text-volt-primary shrink-0">
                          <span className="material-symbols-outlined text-[18px]">home</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-[15px] font-bold text-volt-primary">Apartamento 201</p>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-volt-green/10 text-volt-green border border-volt-green/20">ACTIVO</span>
                          </div>
                          <p className="text-[12px] text-volt-ink-mute">Vivienda Residencial</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <p className="font-medium text-volt-primary text-[13px]">Andrés Felipe Parra</p>
                      <a href="https://wa.me/573006719022" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#25D366]/15 text-[#1F4D2B] border border-[#25D366]/30 hover:bg-[#25D366]/25 transition-colors">
                        <span className="material-symbols-outlined text-[12px]">chat</span> +57 300 671 9022
                      </a>
                    </td>
                    <td className="py-4 px-5">
                      <p className="text-[13px] font-medium text-volt-primary">Medidor Normal Residencial</p>
                      <p className="text-[11px] text-volt-primary font-bold">#MED-5521</p>
                      <p className="text-[11px] text-volt-ink-mute tabular-nums">Factor 1.0 · Calibrado</p>
                    </td>
                    <td className="py-4 px-5 text-right tabular-nums">
                      <span className="font-bold text-volt-primary text-[15px]">14.80%</span>
                      <p className="text-[11px] text-volt-ink-mute">44.4 m² privativo</p>
                    </td>
                    <td className="py-4 px-5">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#995616]/10 text-[#995616] border border-[#995616]/30">
                        Residencial · $780
                      </span>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <div className="flex items-center justify-center gap-1 text-volt-ink-mute">
                        <button className="p-1.5 hover:text-volt-primary hover:bg-volt-surface-mid rounded transition-colors" title="Editar">
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button className="p-1.5 hover:text-volt-primary hover:bg-volt-surface-mid rounded transition-colors" title="Historial">
                          <span className="material-symbols-outlined text-[18px]">show_chart</span>
                        </button>
                        <button className="p-1.5 hover:text-volt-primary hover:bg-volt-surface-mid rounded transition-colors" title="Más">
                          <span className="material-symbols-outlined text-[18px]">more_vert</span>
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Garaje */}
                  <tr className="hover:bg-volt-surface-low/40 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-volt-surface-highest border border-volt-rule-soft flex items-center justify-center text-volt-primary shrink-0">
                          <span className="material-symbols-outlined text-[18px]">garage</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-[15px] font-bold text-volt-primary">Garaje / Portón</p>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-volt-green/10 text-volt-green border border-volt-green/20">ACTIVO</span>
                          </div>
                          <p className="text-[12px] text-volt-ink-mute">Acceso vehicular y puerta automática</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <p className="font-medium text-volt-primary text-[13px]">Administración Edificio Los Cedros</p>
                      <span className="text-[11px] text-volt-ink-mute">Sin arrendatario particular (Copropiedad)</span>
                    </td>
                    <td className="py-4 px-5">
                      <p className="text-[13px] font-medium text-volt-primary">Medidor Normal Acceso Vehicular</p>
                      <p className="text-[11px] text-volt-primary font-bold">#MED-GAR-01</p>
                      <p className="text-[11px] text-volt-ink-mute tabular-nums">Motor elevador 220V</p>
                    </td>
                    <td className="py-4 px-5 text-right tabular-nums">
                      <span className="font-bold text-volt-primary text-[15px]">3.75%</span>
                      <p className="text-[11px] text-volt-ink-mute">11.25 m² común</p>
                    </td>
                    <td className="py-4 px-5">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-volt-surface-high text-volt-primary border border-volt-rule-soft">
                        Comercial · $900
                      </span>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <div className="flex items-center justify-center gap-1 text-volt-ink-mute">
                        <button className="p-1.5 hover:text-volt-primary hover:bg-volt-surface-mid rounded transition-colors" title="Editar">
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button className="p-1.5 hover:text-volt-primary hover:bg-volt-surface-mid rounded transition-colors" title="Historial">
                          <span className="material-symbols-outlined text-[18px]">show_chart</span>
                        </button>
                        <button className="p-1.5 hover:text-volt-primary hover:bg-volt-surface-mid rounded transition-colors" title="Más">
                          <span className="material-symbols-outlined text-[18px]">more_vert</span>
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Salón Comunal */}
                  <tr className="hover:bg-volt-surface-low/40 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-volt-surface-highest border border-volt-rule-soft flex items-center justify-center text-volt-primary shrink-0">
                          <span className="material-symbols-outlined text-[18px]">meeting_room</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-[15px] font-bold text-volt-primary">Salón Comunal</p>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-volt-green/10 text-volt-green border border-volt-green/20">ACTIVO</span>
                          </div>
                          <p className="text-[12px] text-volt-ink-mute">Eventos, reuniones y climatización</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <p className="font-medium text-volt-primary text-[13px]">Administración Edificio Los Cedros</p>
                      <span className="text-[11px] text-volt-ink-mute">Sin arrendatario particular (Copropiedad)</span>
                    </td>
                    <td className="py-4 px-5">
                      <p className="text-[13px] font-medium text-volt-primary">Medidor Normal Eventos</p>
                      <p className="text-[11px] text-volt-primary font-bold">#MED-SAL-01</p>
                      <p className="text-[11px] text-volt-ink-mute tabular-nums">Iluminación + Climatización</p>
                    </td>
                    <td className="py-4 px-5 text-right tabular-nums">
                      <span className="font-bold text-volt-primary text-[15px]">3.75%</span>
                      <p className="text-[11px] text-volt-ink-mute">11.25 m² común</p>
                    </td>
                    <td className="py-4 px-5">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-volt-surface-high text-volt-primary border border-volt-rule-soft">
                        Prorrateo Expensas Comunes
                      </span>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <div className="flex items-center justify-center gap-1 text-volt-ink-mute">
                        <button className="p-1.5 hover:text-volt-primary hover:bg-volt-surface-mid rounded transition-colors" title="Editar">
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button className="p-1.5 hover:text-volt-primary hover:bg-volt-surface-mid rounded transition-colors" title="Historial">
                          <span className="material-symbols-outlined text-[18px]">show_chart</span>
                        </button>
                        <button className="p-1.5 hover:text-volt-primary hover:bg-volt-surface-mid rounded transition-colors" title="Más">
                          <span className="material-symbols-outlined text-[18px]">more_vert</span>
                        </button>
                      </div>
                    </td>
                  </tr>

                </tbody>
              </table>
            </div>

            {/* Footer de tabla */}
            <div className="px-5 py-3 bg-volt-surface-low/50 border-t border-volt-rule-soft flex flex-col sm:flex-row items-center justify-between text-volt-ink-mute text-[13px] gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-medium text-volt-primary">Mostrando 6 de 6 registros configurados</span>
                <span className="h-4 w-px bg-volt-rule"></span>
                <span>Total Coeficiente: <strong className="text-volt-primary font-semibold">100.00%</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1 rounded border border-volt-rule-soft text-volt-outline text-[12px] font-medium bg-volt-surface-low cursor-not-allowed" disabled>
                  Anterior
                </button>
                <button className="px-3 py-1 rounded border border-volt-rule-soft text-volt-outline text-[12px] font-medium bg-volt-surface-low cursor-not-allowed" disabled>
                  Siguiente
                </button>
              </div>
            </div>
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