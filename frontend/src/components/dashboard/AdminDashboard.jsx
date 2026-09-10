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
      tenant: '',          // limpia el nombre
      email: '',
      phone: '',
      document: '',
      password: '',
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
        // Buscar la propiedad por nombre de unidad y actualizarla
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
    // Guardar lecturas
    for (const p of properties) {
      await api.put(`/properties/${p.id}`, {
        prev: p.prev,
        curr: p.curr,
        m1Prev: p.m1Prev,
        m1Curr: p.m1Curr,
        m2Prev: p.m2Prev,
        m2Curr: p.m2Curr,
        m3Prev: p.m3Prev,
        m3Curr: p.m3Curr,
      });
    }

    // Crear recibos
    const newBills = properties.map(p => {
      const consumption = getPropertyConsumption(p);
      const energyTotal = consumption * kwhRate;
      const trashCost = getPropertyTrashCost(p, trashPerUnit, apartmentTrashBill);
      return {
        propertyId: p.id,
        periodStart: readingStartDate,
        periodEnd: readingEndDate,
        dueDate: globalDueDate,
        consumption,
        kwhRate,
        energyTotal,
        trashCost,
        total: energyTotal + trashCost,
        status: p.status || 'Pendiente',
      };
    });

    const emailTemplate = localStorage.getItem('bap_email_template') || '';
    const whatsappTemplate = localStorage.getItem('bap_whatsapp_template') || '';

    await api.post('/bills/generate', {
      bills: newBills,
      emailTemplate,
      whatsappTemplate,
    });

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
      {/* OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-fadeIn">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-on-surface">Visión General</h2>
              <p className="text-lg text-on-surface-variant mt-2">Métricas de rendimiento y estado del portafolio.</p>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-glass-fill border border-glass-stroke rounded-lg text-on-surface text-sm hover:border-vibrant-cyan hover:text-vibrant-cyan transition-all">Exportar PDF</button>
              <button className="px-4 py-2 bg-glass-fill border border-glass-stroke rounded-lg text-on-surface text-sm hover:border-vibrant-cyan hover:text-vibrant-cyan transition-all flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">calendar_today</span>
                Este Mes
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-glass-fill backdrop-blur-[20px] border border-glass-stroke rounded-lg p-6 relative overflow-hidden group hover:border-vibrant-cyan/50 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-secondary-container/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-vibrant-cyan/10 transition-colors"></div>
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-midnight-slate border border-glass-stroke rounded-lg">
                  <span className="material-symbols-outlined text-vibrant-cyan">payments</span>
                </div>
                <span className="text-xs text-secondary px-2 py-1 bg-secondary-container/20 rounded-full flex items-center gap-1">
                  <span className="material-symbols-outlined text-[10px]">trending_up</span> +12%
                </span>
              </div>
              <h3 className="text-sm text-on-surface-variant mb-1">Total Recaudado</h3>
              <p className="text-3xl font-bold text-on-surface">{formatCOP(collectedAmount)}</p>
            </div>

            <div className="bg-glass-fill backdrop-blur-[20px] border border-glass-stroke rounded-lg p-6 relative overflow-hidden group hover:border-vibrant-cyan/50 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-secondary-container/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-vibrant-cyan/10 transition-colors"></div>
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-midnight-slate border border-glass-stroke rounded-lg">
                  <span className="material-symbols-outlined text-vibrant-cyan">groups</span>
                </div>
              </div>
              <h3 className="text-sm text-on-surface-variant mb-1">Inquilinos Activos</h3>
              <p className="text-3xl font-bold text-on-surface">{properties.length}</p>
            </div>

            <div className="bg-glass-fill backdrop-blur-[20px] border border-glass-stroke rounded-lg p-6 relative overflow-hidden group hover:border-vibrant-cyan/50 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-secondary-container/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-vibrant-cyan/10 transition-colors"></div>
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-midnight-slate border border-glass-stroke rounded-lg">
                  <span className="material-symbols-outlined text-vibrant-cyan">real_estate_agent</span>
                </div>
                <span className="text-xs text-error px-2 py-1 bg-error-container/20 rounded-full flex items-center gap-1">
                  <span className="material-symbols-outlined text-[10px]">trending_down</span> -2
                </span>
              </div>
              <h3 className="text-sm text-on-surface-variant mb-1">Propiedades Disp.</h3>
              <p className="text-3xl font-bold text-on-surface">{properties.filter(p => p.status === 'Pendiente').length}</p>
            </div>

            <div className="bg-glass-fill backdrop-blur-[20px] border border-glass-stroke rounded-lg p-6 relative overflow-hidden group hover:border-error/50 transition-all duration-300 shadow-[0_4px_20px_rgba(147,0,10,0.1)]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-error-container/20 rounded-full blur-2xl -mr-10 -mt-10"></div>
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-midnight-slate border border-error/30 rounded-lg">
                  <span className="material-symbols-outlined text-error">warning</span>
                </div>
                <div className="w-2 h-2 bg-error rounded-full animate-pulse shadow-[0_0_10px_rgba(255,180,171,0.8)]"></div>
              </div>
              <h3 className="text-sm text-on-surface-variant mb-1">Alertas de Pago</h3>
              <p className="text-3xl font-bold text-error">{properties.filter(p => p.status === 'Atrasado').length} <span className="text-sm text-error/70">Atrasados</span></p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
            <div className="lg:col-span-2 bg-glass-fill backdrop-blur-[20px] border border-glass-stroke rounded-lg p-6 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-semibold text-on-surface">Tendencia de Consumos Energéticos</h3>
                  <p className="text-sm text-on-surface-variant">Uso agregado (kWh) en todo el portafolio</p>
                </div>
                <button className="p-2 bg-midnight-slate border border-glass-stroke rounded-lg hover:border-vibrant-cyan transition-colors">
                  <span className="material-symbols-outlined text-on-surface-variant">more_horiz</span>
                </button>
              </div>
              <div className="flex-1 min-h-[300px] relative w-full flex items-end">
                <div className="absolute inset-0 flex flex-col justify-between">
                  <div className="w-full h-px border-t border-dashed border-glass-stroke"></div>
                  <div className="w-full h-px border-t border-dashed border-glass-stroke"></div>
                  <div className="w-full h-px border-t border-dashed border-glass-stroke"></div>
                  <div className="w-full h-px border-t border-dashed border-glass-stroke"></div>
                  <div className="w-full h-px border-t border-solid border-glass-stroke"></div>
                </div>
                <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                  <defs>
                    <linearGradient id="chartGradient" x1="0%" x2="0%" y1="0%" y2="100%">
                      <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.3"></stop>
                      <stop offset="100%" stopColor="#00F0FF" stopOpacity="0"></stop>
                    </linearGradient>
                  </defs>
                  <polygon fill="url(#chartGradient)" points="0,100 0,60 20,40 40,70 60,30 80,45 100,20 100,100"></polygon>
                  <polyline fill="none" points="0,60 20,40 40,70 60,30 80,45 100,20" stroke="#00F0FF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" style={{ filter: 'drop-shadow(0px 0px 8px rgba(0,240,255,0.5))' }}></polyline>
                  <circle cx="20" cy="40" fill="#141314" r="1.5" stroke="#00F0FF" strokeWidth="1"></circle>
                  <circle cx="40" cy="70" fill="#141314" r="1.5" stroke="#00F0FF" strokeWidth="1"></circle>
                  <circle cx="60" cy="30" fill="#141314" r="1.5" stroke="#00F0FF" strokeWidth="1"></circle>
                  <circle cx="80" cy="45" fill="#141314" r="1.5" stroke="#00F0FF" strokeWidth="1"></circle>
                  <circle cx="100" cy="20" fill="#00F0FF" r="1.5" stroke="#FFFFFF" strokeWidth="0.5" style={{ filter: 'drop-shadow(0px 0px 4px rgba(0,240,255,1))' }}></circle>
                </svg>
                <div className="absolute -bottom-6 w-full flex justify-between px-2 text-xs text-on-surface-variant">
                  <span>Ene</span><span>Feb</span><span>Mar</span><span>Abr</span><span>May</span><span>Jun</span>
                </div>
              </div>
            </div>

            <div className="bg-glass-fill backdrop-blur-[20px] border border-glass-stroke rounded-lg p-6 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-semibold text-on-surface">Próximos Vencimientos</h3>
                <a className="text-xs text-vibrant-cyan hover:underline" href="#">Ver Todos</a>
              </div>
              <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                {properties.filter(p => p.dueDate).slice(0, 4).map(prop => (
                  <div key={prop.id} className="bg-midnight-slate border border-glass-stroke rounded-lg p-4 flex gap-4 items-center group hover:border-vibrant-cyan/30 transition-colors">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      prop.status === 'Atrasado' ? 'bg-error-container/20 text-error' : 'bg-secondary-container/20 text-secondary'
                    }`}>
                      <span className="material-symbols-outlined">{prop.status === 'Atrasado' ? 'assignment_late' : 'receipt_long'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-on-surface truncate">{prop.unit}</h4>
                      <p className="text-xs text-on-surface-variant truncate">Vence {prop.dueDate} ({prop.tenant})</p>
                    </div>
                    <button className="text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CALCULATOR (SERVICES) */}
      {activeTab === 'calculator' && (
        <ServicesTab
          properties={properties}
          setProperties={setProperties}
          bills={bills}
          setBills={setBills}
          kwhRate={kwhRate}
          setKwhRate={setKwhRate}
          kwhInputText={kwhInputText}
          setKwhInputText={setKwhInputText}
          totalTrashBill={totalTrashBill}
          setTotalTrashBill={setTotalTrashBill}
          trashInputText={trashInputText}
          setTrashInputText={setTrashInputText}
          apartmentTrashBill={apartmentTrashBill}
          setApartmentTrashBill={setApartmentTrashBill}
          apartmentTrashInputText={apartmentTrashInputText}
          setApartmentTrashInputText={setApartmentTrashInputText}
          readingStartDate={readingStartDate}
          setReadingStartDate={setReadingStartDate}
          readingEndDate={readingEndDate}
          setReadingEndDate={setReadingEndDate}
          globalDueDate={globalDueDate}
          setGlobalDueDate={setGlobalDueDate}
          hasUnsavedChanges={hasUnsavedChanges}
          setHasUnsavedChanges={setHasUnsavedChanges}
          trashUnitsCount={trashUnitsCount}
          trashPerUnit={trashPerUnit}
          totalGeneralServices={totalGeneralServices}
          handleSendNotifications={handleSendNotifications}
          addToast={addToast}
        />
      )}

      {/* ENVIOS */}
      {activeTab === 'envios' && <EnviosTab />}

      {/* UNITS */}
      {activeTab === 'units' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-on-surface">Unidades</h2>
              <p className="text-lg text-on-surface-variant mt-2">Gestiona los locales y propiedades disponibles.</p>
            </div>
            <button
              onClick={() => setShowCreatePropertyModal(true)}
              className="inline-flex items-center gap-2 bg-vibrant-cyan text-background font-bold px-5 py-3 rounded-xl text-sm transition-all shadow-sm hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] active:scale-[0.98]"
            >
              <PlusCircle size={16} /> Nueva Unidad
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {properties.map(prop => (
              <div key={prop.id} className="glass-panel p-6 rounded-xl hover:border-vibrant-cyan/30 transition-colors relative group">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xl font-bold text-on-surface">{prop.unit}</h4>
                    <p className="text-sm text-on-surface-variant mt-1">{prop.meters}</p>
                  </div>
                  <span className="material-symbols-outlined text-vibrant-cyan">home</span>
                </div>
                <div className="mt-4 pt-4 border-t border-glass-stroke">
                  <p className="text-sm text-on-surface-variant">
                    {prop.tenant ? `Arrendatario: ${prop.tenant}` : 'Sin arrendatario asignado'}
                  </p>
                </div>
                {/* Botón eliminar */}
                <button
                  onClick={() => handleDeleteProperty(prop.id)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-error/10 text-error hover:bg-error/20"
                  title="Eliminar unidad"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TENANTS */}
      {activeTab === 'tenants' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-on-surface">Gestión de Arrendatarios</h2>
              <p className="text-lg text-on-surface-variant mt-2">Administra inquilinos, credenciales y unidades.</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 bg-vibrant-cyan text-background font-bold px-5 py-3 rounded-xl text-sm transition-all shadow-sm hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] active:scale-[0.98]"
            >
              <PlusCircle size={16} /> Nuevo Arrendatario
            </button>
          </div>

          <div className="glass-panel rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-glass-stroke">
              <h3 className="text-xl font-bold text-on-surface">Arrendatarios ({properties.length})</h3>
              <p className="text-sm text-on-surface-variant mt-1">Haz clic en editar para reasignar un local o modificar datos.</p>
            </div>
            <div className="divide-y divide-glass-stroke/50">
              {properties.map((p) => (
                <div key={p.id} className="p-5 flex items-start justify-between transition-colors hover:bg-glass-fill">
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Home size={16} className="text-vibrant-cyan" />
                      <h4 className="text-lg font-bold text-on-surface">{p.unit}</h4>
                      <span className="bg-glass-fill text-on-surface-variant text-xs font-semibold px-2 py-1 rounded-full border border-glass-stroke">
                        {p.meters}
                      </span>
                    </div>
                    <p className="text-base text-on-surface font-medium">
                      {p.tenant || 'Sin arrendatario'}
                    </p>
                    <div className="text-sm text-on-surface-variant flex flex-wrap gap-3">
                      <span>📧 {p.email || '—'}</span>
                      {p.phone && <span>📱 {p.phone}</span>}
                      {p.document && <span>🆔 {p.document}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <button
                      onClick={() => handleEditClick(p)}
                      className="p-2 text-on-surface-variant hover:text-vibrant-cyan hover:bg-glass-fill rounded-lg transition-all"
                      title="Editar"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button onClick={() => handleUnassignTenant(p.id)} className="p-2 text-error hover:bg-error/10 rounded-lg transition-all" title="Desasignar">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MAINTENANCE */}
      {activeTab === 'maintenance' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div><h2 className="text-2xl font-bold text-slate-900">Mantenimiento</h2><p className="text-slate-500 text-sm mt-1">Reportes enviados por los arrendatarios.</p></div>
            <div className="flex items-center gap-2">
              <div className="relative"><Search size={14} className="absolute left-3 top-2.5 text-slate-400" /><input type="text" placeholder="Buscar unidad o descripción..." value={maintSearch} onChange={e => setMaintSearch(e.target.value)} className="pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-900 w-56" /></div>
              <select value={maintFilter} onChange={e => setMaintFilter(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-900 bg-white">
                <option value="all">Todos</option><option value="open">Abiertos</option><option value="in-progress">En progreso</option><option value="resolved">Resueltos</option>
              </select>
            </div>
          </div>
          {filteredTickets.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4"><Wrench size={28} className="text-slate-400" /></div>
              <p className="text-sm text-slate-500 font-medium">No hay reportes de mantenimiento.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTickets.map(ticket => (
                <div key={ticket.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${TICKET_STATUS[ticket.status]?.bg || 'bg-slate-100 text-slate-700'} ${TICKET_STATUS[ticket.status]?.text || ''} ${TICKET_STATUS[ticket.status]?.border || ''}`}>{TICKET_STATUS[ticket.status]?.label || ticket.status}</span>
                        <span className="text-xs text-slate-500 font-medium">{ticket.property?.name || 'Sin unidad'}</span>
                        <span className="text-xs text-slate-400">{new Date(ticket.createdAt).toLocaleDateString('es-CO')}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${PRIORITY_STYLES[ticket.priority]?.bg || 'bg-slate-100'} ${PRIORITY_STYLES[ticket.priority]?.text || 'text-slate-700'}`}>{PRIORITY_STYLES[ticket.priority]?.label || ticket.priority}</span>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed">{ticket.description}</p>
                      {ticket.adminNotes && (
                        <div className="mt-3 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                          <p className="text-xs font-semibold text-indigo-700 mb-1">Tu respuesta:</p>
                          <p className="text-sm text-indigo-900">{ticket.adminNotes}</p>
                        </div>
                      )}
                      {respondingTicket === ticket.id && (
                        <div className="mt-3 space-y-2">
                          <textarea value={adminNoteText} onChange={e => setAdminNoteText(e.target.value)} rows={3} placeholder="Escribe una respuesta para el arrendatario..." className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-900 resize-none" />
                          <div className="flex gap-2">
                            <button onClick={() => handleRespondTicket(ticket.id)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700">Enviar respuesta</button>
                            <button onClick={() => { setRespondingTicket(null); setAdminNoteText(''); }} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50">Cancelar</button>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      {ticket.status !== 'resolved' && <button onClick={() => setRespondingTicket(ticket.id)} className="px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">Responder</button>}
                      {ticket.status !== 'resolved' && <button onClick={() => handleResolveTicket(ticket.id)} className="px-3 py-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors">Marcar resuelto</button>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PROOFS */}
      {activeTab === 'proofs' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div><h2 className="text-2xl font-bold text-slate-900">Comprobantes de Pago</h2><p className="text-slate-500 text-sm mt-1">Verifica pagos reportados por los arrendatarios.</p></div>
            <select value={proofFilter} onChange={e => setProofFilter(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-900 bg-white">
              <option value="all">Todos</option><option value="Pendiente">Pendientes de verificación</option><option value="Pagado">Ya verificados</option>
            </select>
          </div>
          {billsWithProofs.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle2 size={28} className="text-slate-400" /></div>
              <p className="text-sm text-slate-500 font-medium">No hay comprobantes de pago.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {billsWithProofs.map(bill => (
                <div key={bill.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h4 className="font-bold text-sm text-slate-900">{bill.property?.name || 'Unidad'}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${bill.status === 'Pagado' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{bill.status}</span>
                        <span className="text-xs text-slate-400">{bill.periodStart} → {bill.periodEnd}</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div><span className="text-slate-400 block">Método</span><span className="font-medium text-slate-700 capitalize">{bill.paymentProof?.method === 'transfer' ? 'Transferencia' : bill.paymentProof?.method === 'cash' ? 'Efectivo' : 'Otro'}</span></div>
                        <div><span className="text-slate-400 block">Fecha pago</span><span className="font-medium text-slate-700">{bill.paymentProof?.date}</span></div>
                        <div><span className="text-slate-400 block">Referencia</span><span className="font-medium text-slate-700">{bill.paymentProof?.reference || '—'}</span></div>
                        <div><span className="text-slate-400 block">Monto reportado</span><span className="font-medium text-slate-700">{formatCOP(bill.paymentProof?.amount)}</span></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right"><span className="text-[10px] text-slate-400 block">Total recibo</span><span className="font-mono font-bold text-slate-900">{formatCOP(bill.total)}</span></div>
                      {bill.status !== 'Pagado' && (
                        <div className="flex flex-col gap-2">
                          <button onClick={() => handleVerifyPayment(bill.id)} className="px-3 py-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors">Verificar pago</button>
                          <button onClick={() => handleRejectPayment(bill.id)} className="px-3 py-1.5 text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors">Rechazar</button>
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

      {/* HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-8 animate-fadeIn">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div><h2 className="text-2xl font-bold text-slate-900">Historial de Recibos</h2><p className="text-slate-500 text-sm mt-1">Recibos generados y guardados en el sistema.</p></div>
            <button onClick={exportBillsCSV} disabled={!bills.length} className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 font-bold px-4 py-2.5 rounded-xl text-xs transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"><Download size={14} /> Exportar CSV</button>
          </div>
          {bills.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <FileText size={48} className="text-slate-300 mx-auto mb-4" />
              <p className="text-sm text-slate-500 font-medium">Aún no has generado recibos.</p>
              <p className="text-xs text-slate-400 mt-1">Ve a la pestaña "Servicios" y guarda los cálculos.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider font-bold border-b border-slate-100">
                      <th className="px-5 py-3">Recibo</th><th className="px-5 py-3">Unidad</th><th className="px-5 py-3">Período</th><th className="px-5 py-3">Consumo</th><th className="px-5 py-3">Energía</th><th className="px-5 py-3">Aseo</th><th className="px-5 py-3">Total</th><th className="px-5 py-3">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bills.map((b, i) => (
                      <tr key={b.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-slate-100/50 transition-colors`}>
                        <td className="px-5 py-3.5 font-mono text-[11px] text-slate-500">{b.id.split('-')[1]}</td>
                        <td className="px-5 py-3.5 font-bold text-slate-900">{b.property?.name || ''}</td>
                        <td className="px-5 py-3.5 text-[11px] text-slate-500">{b.periodStart} → {b.periodEnd}</td>
                        <td className="px-5 py-3.5 font-mono text-xs">{b.consumption} kWh</td>
                        <td className="px-5 py-3.5 font-mono text-xs">{formatCOP(b.energyTotal)}</td>
                        <td className="px-5 py-3.5 font-mono text-xs">{formatCOP(b.trashCost)}</td>
                        <td className="px-5 py-3.5 font-mono font-bold text-slate-900">{formatCOP(b.total)}</td>
                        <td className="px-5 py-3.5"><span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold border ${b.status === 'Pagado' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : b.status === 'Atrasado' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{b.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de Notificaciones */}
      {showNotifyModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-slate-100">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-slate-100 text-slate-900 rounded-xl border border-slate-200"><Bell size={18} /></div>
              <div><h3 className="text-lg font-bold text-slate-900">Enviando Notificaciones</h3><p className="text-[11px] text-slate-500">Recibos generados. Notificando a arrendatarios...</p></div>
            </div>
            <div className="space-y-3">
              {notifyProgress.map((item, idx) => (
                <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${item.status === 'done' ? 'bg-emerald-50 border-emerald-200' : item.status === 'loading' ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
                  <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${item.status === 'done' ? 'bg-emerald-500 text-white' : item.status === 'loading' ? 'bg-amber-500 text-white' : 'bg-slate-300 text-white'}`}>
                    {item.status === 'done' ? <CheckCircle2 size={14} /> : item.status === 'loading' ? <Loader2 size={14} className="animate-spin" /> : <span className="text-xs font-bold">{idx + 1}</span>}
                  </div>
                  <div className="flex-1"><p className={`text-xs font-bold ${item.status === 'done' ? 'text-emerald-700' : item.status === 'loading' ? 'text-amber-700' : 'text-slate-500'}`}>{item.text}</p></div>
                </div>
              ))}
              {notifyStep === 3 && (
                <div className="mt-4 p-4 bg-emerald-50 rounded-xl border-2 border-emerald-200 text-center animate-fadeIn">
                  <CheckCircle2 size={28} className="text-emerald-600 mx-auto mb-2" />
                  <p className="text-sm font-bold text-emerald-800">¡Todas las notificaciones enviadas!</p>
                  <p className="text-[11px] text-emerald-600 mt-1">Los arrendatarios recibirán sus recibos por correo y WhatsApp.</p>
                </div>
              )}
            </div>
            {notifyStep === 3 && (
              <div className="mt-4 text-center">
                <button onClick={() => setShowNotifyModal(false)} className="bg-slate-950 hover:bg-slate-800 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-all">Cerrar</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Crear/Editar Arrendatario */}
      {showCreateModal && (
        <CreateTenantModalNew
          editingTenant={editingTenantData}
          existingProperties={properties}
          onClose={() => { setShowCreateModal(false); setEditingTenantData(null); }}
          onTenantCreated={handleTenantCreated}
        />
      )}

      {/* Modal Crear Unidad */}
      {showCreatePropertyModal && (
        <CreatePropertyModal
          onClose={() => setShowCreatePropertyModal(false)}
          onPropertyCreated={handlePropertyCreated}
        />
      )}

      {/* Toasts */}
      <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={`pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium animate-fadeIn transition-all ${t.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : t.type === 'error' ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-amber-50 text-amber-800 border-amber-200'}`}>
            {t.type === 'success' ? <CheckCircle2 size={16} className="shrink-0" /> : t.type === 'error' ? <X size={16} className="shrink-0" /> : <Bell size={16} className="shrink-0" />}
            {t.message}
          </div>
        ))}
      </div>
    </>
  );
}

export default AdminDashboard;