import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Calculator, Users, LogOut, PlusCircle, Trash2, Edit3,
  CheckCircle2, Zap, Trash, X, Calendar, CreditCard, Home, ChevronRight,
  FileText, Download, Mail, MessageCircle, Send, Loader2, Bell
} from 'lucide-react';
import { CreateTenantModal } from './CreateTenantModal';

const DEFAULT_PROPERTIES = [
  { id: 'Local 1', unit: 'Local 1', tenant: 'Comercio Alpha', email: 'local1@mail.com', document: '101010', password: 'Temp123!', meters: '1 Normal', status: 'Pendiente', baseAmount: 1500000, dueDate: '2026-08-30', prev: 1000, curr: 1120 },
  { id: 'Local 2', unit: 'Local 2', tenant: 'Comercio Beta', email: 'local2@mail.com', document: '202020', password: 'Temp123!', meters: '2 Normales, 1 Trifásico', status: 'Pendiente', baseAmount: 2800000, dueDate: '2026-08-30', m1Prev: 500, m1Curr: 590, m2Prev: 300, m2Curr: 410, m3Prev: 1000, m3Curr: 1250 },
  { id: 'Local 3', unit: 'Local 3', tenant: 'Comercio Gamma', email: 'local3@mail.com', document: '303030', password: 'Temp123!', meters: '1 Normal', status: 'Pagado', baseAmount: 1200000, dueDate: '2026-08-30', prev: 800, curr: 910 },
  { id: 'Local 4', unit: 'Local 4', tenant: 'Comercio Delta', email: 'local4@mail.com', document: '404040', password: 'Temp123!', meters: '1 Normal', status: 'Atrasado', baseAmount: 1300000, dueDate: '2026-08-15', prev: 1500, curr: 1630 },
  { id: 'Apartamento', unit: 'Apartamento', tenant: 'Juan Pérez', email: 'apartamento@mail.com', document: '505050', password: 'Temp123!', meters: '1 Normal', status: 'Pagado', baseAmount: 1200000, dueDate: '2026-08-30', prev: 2200, curr: 2350 },
  { id: 'Salón', unit: 'Salón', tenant: 'Uso Común', email: 'salon@mail.com', document: '606060', password: 'Temp123!', meters: '1 Normal', status: 'Pagado', baseAmount: 500000, dueDate: '2026-08-30', prev: 400, curr: 450 },
];

const MULTI_METER = '2 Normales, 1 Trifásico';
const SINGLE_METER = '1 Normal';

const ensureMultiMeterFields = (prop) => {
  if (prop.meters === MULTI_METER) {
    return {
      ...prop,
      m1Prev: prop.m1Prev ?? 0,
      m1Curr: prop.m1Curr ?? 0,
      m2Prev: prop.m2Prev ?? 0,
      m2Curr: prop.m2Curr ?? 0,
      m3Prev: prop.m3Prev ?? 0,
      m3Curr: prop.m3Curr ?? 0,
    };
  }
  return {
    ...prop,
    prev: prop.prev ?? 0,
    curr: prop.curr ?? 0,
  };
};

export const AdminDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [properties, setProperties] = useState(() => {
    const saved = localStorage.getItem('bap_properties');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map(ensureMultiMeterFields);
    }
    return DEFAULT_PROPERTIES.map(ensureMultiMeterFields);
  });
  const [bills, setBills] = useState(() => {
    const saved = localStorage.getItem('bap_bills');
    return saved ? JSON.parse(saved) : [];
  });

  const [kwhRate, setKwhRate] = useState(850);
  const [kwhInputText, setKwhInputText] = useState('850');
  const [totalTrashBill, setTotalTrashBill] = useState(180000);
  const [trashInputText, setTrashInputText] = useState('180.000');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTenantData, setEditingTenantData] = useState(null);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifyStep, setNotifyStep] = useState(0);
  const [notifyProgress, setNotifyProgress] = useState([]);
  const [apartmentTrashBill, setApartmentTrashBill] = useState(45000);
  const [apartmentTrashInputText, setApartmentTrashInputText] = useState('45.000');
  const [readingStartDate, setReadingStartDate] = useState('2026-07-01');
  const [readingEndDate, setReadingEndDate] = useState('2026-07-31');
  const [globalDueDate, setGlobalDueDate] = useState('2026-08-30');
  const [notificationSent, setNotificationSent] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);


  useEffect(() => { localStorage.setItem('bap_properties', JSON.stringify(properties)); }, [properties]);
  useEffect(() => { localStorage.setItem('bap_bills', JSON.stringify(bills)); }, [bills]);

  const trashPerUnit = totalTrashBill / 4;

  const formatCOP = (val) => {
    if (!val && val !== 0) return '$0';
    const n = typeof val === 'string' ? Number(val.replace(/\D/g, '')) : val;
    return '$' + n.toLocaleString('es-CO');
  };

  const parseCleanNumber = (val) => {
    if (!val) return 0;
    const clean = String(val).replace(/\D/g, '');
    return clean === '' ? 0 : Number(clean);
  };

  const handleKwhChange = (e) => {
    const raw = e.target.value;
    const digits = raw.replace(/\D/g, '');
    if (!digits) { setKwhInputText(''); setKwhRate(0); return; }
    if (digits === '1000') { setKwhInputText('1.000'); setKwhRate(1000); return; }
    let display = '', numeric = 0;
    if (digits.length === 1) { display = '0.0' + digits; numeric = Number('0.0' + digits); }
    else if (digits.length === 2) { display = '0.' + digits; numeric = Number('0.' + digits); }
    else if (digits.length === 3) { display = digits[0] + '.' + digits.slice(1); numeric = Number(display); }
    else if (digits.length === 4) { display = digits.slice(0,2) + '.' + digits.slice(2); numeric = Number(display); }
    else { const intPart = digits.slice(0,-2); const decPart = digits.slice(-2); display = Number(intPart).toLocaleString('es-CO') + '.' + decPart; numeric = Number(intPart + '.' + decPart); }
    setKwhInputText(display); setKwhRate(numeric || 0);
  };

  const getPropertyConsumption = (prop) => {
    if (prop.meters === MULTI_METER) {
      const c1 = Math.max(0, (Number(prop.m1Curr)||0) - (Number(prop.m1Prev)||0));
      const c2 = Math.max(0, (Number(prop.m2Curr)||0) - (Number(prop.m2Prev)||0));
      const c3 = Math.max(0, (Number(prop.m3Curr)||0) - (Number(prop.m3Prev)||0));
      return c1 + c2 + c3;
    }
    return Math.max(0, (Number(prop.curr)||0) - (Number(prop.prev)||0));
  };

  const getPropertyTrashCost = (prop) => {
    if (['Local 1','Local 2','Local 4','Salón'].includes(prop.id)) return trashPerUnit;
    if (prop.id === 'Apartamento') return apartmentTrashBill;
    return 0;
  };

  const getPropertyTotal = (prop) => {
    return (getPropertyConsumption(prop) * kwhRate) + getPropertyTrashCost(prop);
  };

  const totalGeneralServices = properties.reduce((a, p) => a + getPropertyTotal(p), 0);
  const pendingAmount = properties
    .filter(p => p.status !== 'Pagado')
    .reduce((a, p) => a + getPropertyTotal(p), 0);

  const handleReadingChange = (id, field, value) => {
    const num = value === '' ? '' : Number(value);
    setProperties(prev => prev.map(p => p.id === id ? { ...p, [field]: num } : p));
  };

  const handleGlobalDueDateChange = (newDate) => {
    setGlobalDueDate(newDate);
    setProperties(prev => prev.map(p => ({ ...p, dueDate: newDate })));
  };

  const handleSendNotifications = async () => {
    // 1. Generar recibos
    const newBills = properties.map(p => {
      const consumption = getPropertyConsumption(p);
      const energyTotal = consumption * kwhRate;
      const trashCost = getPropertyTrashCost(p);
      return {
        id: 'BILL-' + Date.now() + '-' + p.id.replace(/\s/g,''),
        propertyId: p.id,
        unit: p.unit,
        tenant: p.tenant,
        email: p.email,
        phone: p.phone || '',
        periodStart: readingStartDate,
        periodEnd: readingEndDate,
        dueDate: globalDueDate,
        prevReading: p.meters === MULTI_METER ? p.m1Prev : p.prev,
        currReading: p.meters === MULTI_METER ? p.m1Curr : p.curr,
        consumption,
        kwhRate,
        energyTotal,
        trashCost,
        total: energyTotal + trashCost,
        status: p.status,
        createdAt: new Date().toISOString().split('T')[0],
      };
    });

    setBills(prev => [...newBills, ...prev]);
    setNotificationSent(true);
    setTimeout(() => setNotificationSent(false), 4000);

    // 2. Abrir modal de notificaciones
    setShowNotifyModal(true);
    setNotifyStep(0);
    setNotifyProgress([{ step: 0, status: 'loading', text: 'Generando recibos...' }]);

    await new Promise(r => setTimeout(r, 800));

    // Paso 1: Enviar emails
    setNotifyStep(1);
    setNotifyProgress([
      { step: 0, status: 'done', text: 'Recibos generados' },
      { step: 1, status: 'loading', text: 'Enviando correos electrónicos...' }
    ]);

    // AQUÍ: Integración con EmailJS
    // Para usar EmailJS real:
    // 1. npm install @emailjs/browser
    // 2. import emailjs from '@emailjs/browser'
    // 3. Configura tu SERVICE_ID, TEMPLATE_ID y PUBLIC_KEY
    // 
    // Ejemplo:
    // for (const bill of newBills) {
    //   if (bill.email) {
    //     await emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', {
    //       to_email: bill.email,
    //       tenant_name: bill.tenant,
    //       unit: bill.unit,
    //       period: `${bill.periodStart} al ${bill.periodEnd}`,
    //       consumption: bill.consumption,
    //       total: formatCOP(bill.total),
    //       due_date: bill.dueDate,
    //     }, 'YOUR_PUBLIC_KEY');
    //   }
    // }

    // Simulación de envío de emails
    const emailResults = [];
    for (const bill of newBills) {
      if (bill.email) {
        await new Promise(r => setTimeout(r, 300));
        console.log(`[EMAIL] Enviado a ${bill.email}: Recibo ${bill.unit} - ${formatCOP(bill.total)}`);
        emailResults.push({ email: bill.email, sent: true });
      }
    }

    await new Promise(r => setTimeout(r, 500));

    // Paso 2: Enviar WhatsApp
    setNotifyStep(2);
    setNotifyProgress([
      { step: 0, status: 'done', text: `Recibos generados (${newBills.length})` },
      { step: 1, status: 'done', text: `Correos enviados (${emailResults.length})` },
      { step: 2, status: 'loading', text: 'Enviando notificaciones WhatsApp...' }
    ]);

    // AQUÍ: Integración con WhatsApp Business API o Twilio
    // Opción 1: Twilio (requiere cuenta)
    // Opción 2: WhatsApp Business API de Meta
    // Opción 3: wa.me links (solo abre chat, no envía automático)
    //
    // Ejemplo con Twilio:
    // await fetch('https://api.twilio.com/2010-04-01/Accounts/YOUR_SID/Messages.json', {
    //   method: 'POST',
    //   headers: { 'Authorization': 'Basic ' + btoa('YOUR_SID:YOUR_TOKEN') },
    //   body: new URLSearchParams({
    //     From: 'whatsapp:+14155238886',
    //     To: `whatsapp:+57${phone}`,
    //     Body: `Hola ${name}, tu recibo de luz está listo. Total: ${total}`
    //   })
    // });

    // Simulación de envío WhatsApp
    const waResults = [];
    for (const bill of newBills) {
      if (bill.phone) {
        await new Promise(r => setTimeout(r, 200));
        console.log(`[WHATSAPP] Enviado a ${bill.phone}: Recibo ${bill.unit}`);
        waResults.push({ phone: bill.phone, sent: true });
      }
    }

    await new Promise(r => setTimeout(r, 600));

    // Paso 3: Éxito
    setNotifyStep(3);
    setNotifyProgress([
      { step: 0, status: 'done', text: `Recibos generados (${newBills.length})` },
      { step: 1, status: 'done', text: `Correos enviados (${emailResults.length})` },
      { step: 2, status: 'done', text: `WhatsApp enviados (${waResults.length})` },
    ]);

    await new Promise(r => setTimeout(r, 2000));
    setShowNotifyModal(false);
    setNotifyStep(0);
    setNotifyProgress([]);
  };

  const handleStatusChange = (id, newStatus) => {
    setProperties(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
  };

  const handleEditClick = (p) => {
    setEditingTenantData(p);
    setShowCreateModal(true);
  };

  const handleDeleteTenant = (id) => {
    if (!confirm('¿Eliminar este arrendatario?')) return;
    setProperties(prev => prev.filter(p => p.id !== id));
  };

  const handleTenantCreated = (data) => {
    const newProp = {
      id: data.document,
      unit: data.document,
      tenant: data.name,
      email: data.email,
      document: data.document,
      password: data.tempPassword,
      mustChangePassword: true,
      meters: SINGLE_METER,
      status: 'Pendiente',
      baseAmount: '0',
      dueDate: globalDueDate,
      prev: 0, curr: 0
    };
    setProperties(prev => [...prev, newProp]);
    setShowCreateModal(false);
  };

  const exportBillsCSV = () => {
    if (!bills.length) return;
    const headers = ['Unidad','Arrendatario','Periodo','Consumo','Tarifa','Energia','Aseo','Total','Estado','Limite'];
    const rows = bills.map(b => [b.unit,b.tenant,`${b.periodStart} al ${b.periodEnd}`,b.consumption,b.kwhRate,b.energyTotal,b.trashCost,b.total,b.status,b.dueDate].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `recibos_${new Date().toISOString().split('T')[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { key: 'overview', label: 'Resumen', icon: LayoutDashboard },
    { key: 'calculator', label: 'Servicios', icon: Calculator },
    { key: 'payments', label: 'Pagos', icon: CreditCard },
    { key: 'tenants', label: 'Arrendatarios', icon: Users },
    { key: 'history', label: 'Historial', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Nav */}
      <nav className="bg-white border-b border-slate-200 px-6 py-3.5 flex justify-between items-center sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="bg-slate-950 text-white p-2 rounded-lg">
            <Zap size={18} />
          </div>
          <div>
            <h1 className="font-bold text-sm leading-tight">Bap Inmobiliaria</h1>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Panel Administrativo</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              >
                <Icon size={14} /> {t.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-xs text-slate-500 font-medium">{user?.name}</span>
          <button onClick={onLogout} className="flex items-center gap-1.5 text-slate-500 hover:text-rose-600 transition-colors text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-lg hover:bg-slate-100">
            <LogOut size={15} /> Salir
          </button>
        </div>
      </nav>

      {/* Mobile tabs */}
      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-2 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === t.key ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'}`}
              >
                <Icon size={14} /> {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <main className="p-4 md:p-8 max-w-7xl mx-auto w-full flex-1 space-y-6">

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Bienvenido, {user?.name || 'Administrador'}</h2>
                <p className="text-slate-500 text-sm mt-1">Resumen general del estado de tus unidades.</p>
              </div>
              <button onClick={() => setActiveTab('calculator')} className="inline-flex items-center gap-2 text-xs font-bold text-slate-900 bg-white border border-slate-200 px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                Ir a calculadora <ChevronRight size={14} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <Home size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Unidades</span>
                </div>
                <p className="text-3xl font-extrabold text-slate-900">{properties.length}</p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
                <div className="flex items-center gap-2 text-amber-500 mb-1">
                  <TrendingUpIcon />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Pendiente de Cobro</span>
                </div>
                <p className="text-3xl font-extrabold text-amber-600">{formatCOP(pendingAmount)}</p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
                <div className="flex items-center gap-2 text-emerald-500 mb-1">
                  <CheckCircle2 size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Recaudado (Mes)</span>
                </div>
                <p className="text-3xl font-extrabold text-emerald-600">{formatCOP(totalGeneralServices - pendingAmount)}</p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
                <div className="flex items-center gap-2 text-indigo-500 mb-1">
                  <Zap size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Total Servicios</span>
                </div>
                <p className="text-3xl font-extrabold text-indigo-600">{formatCOP(totalGeneralServices)}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-sm">Unidades Registradas</h3>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{properties.length} activas</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider font-bold border-b border-slate-100">
                      <th className="px-5 py-3">Unidad</th>
                      <th className="px-5 py-3">Arrendatario</th>
                      <th className="px-5 py-3">Contadores</th>
                      <th className="px-5 py-3">Estado</th>
                      <th className="px-5 py-3">Límite</th>
                      <th className="px-5 py-3 text-right">Total Calculado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {properties.map((p, i) => {
                      const total = getPropertyTotal(p);
                      return (
                        <tr key={p.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-slate-100/50 transition-colors`}>
                          <td className="px-5 py-3.5 font-bold text-slate-900">{p.id}</td>
                          <td className="px-5 py-3.5 text-slate-700">
                            {p.tenant}
                            <span className="block text-[11px] text-slate-400">{p.email}</span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2.5 py-1 rounded-md border border-slate-200">
                              {p.meters}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                              p.status === 'Pagado' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              p.status === 'Atrasado' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                              'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 font-mono text-[11px] text-slate-500">{p.dueDate || '—'}</td>
                          <td className="px-5 py-3.5 text-right font-mono font-bold text-slate-900">{formatCOP(total)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* CALCULATOR */}
        {activeTab === 'calculator' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Cálculo de servicios</h2>
                <p className="text-slate-500 text-sm mt-1">Modifica lecturas y tarifas. Los totales se actualizan en tiempo real.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Total general</span>
                  <span className="font-mono font-extrabold text-indigo-600 text-lg">{formatCOP(totalGeneralServices)}</span>
                </div>
                <button
                  onClick={handleSendNotifications}
                  className="bg-slate-950 hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-lg text-xs transition-all shadow-sm flex items-center gap-2 active:scale-[0.98]"
                >
                  <Send size={14} /> Guardar y notificar
                </button>
              </div>
            </div>

            {notificationSent && (
              <div className="flex items-center gap-3 p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-sm font-medium animate-fadeIn">
                <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                Recibos guardados. Revisa el panel de notificaciones para ver el estado del envío.
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-[10px] uppercase tracking-wider">
                  <Zap size={14} className="text-indigo-500" /> Tarifa kWh
                </div>
                <input type="text" value={kwhInputText} onChange={handleKwhChange} placeholder="850" className="w-full border-2 border-slate-200 rounded-lg px-3 py-2 font-bold text-slate-900 font-mono focus:outline-none focus:border-slate-900 text-sm" />
                <p className="text-[10px] text-slate-400">Actual: <span className="font-mono font-bold text-slate-600">${kwhRate.toLocaleString('es-CO',{minimumFractionDigits:0,maximumFractionDigits:2})}</span></p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-[10px] uppercase tracking-wider">
                  <Trash size={14} className="text-emerald-500" /> Aseo general
                </div>
                <input type="text" value={trashInputText} onChange={(e)=>{const c=e.target.value.replace(/\D/g,'');const n=c===''?0:Number(c);setTotalTrashBill(n);setTrashInputText(c===''?'':n.toLocaleString('es-CO'));}} placeholder="180.000" className="w-full border-2 border-slate-200 rounded-lg px-3 py-2 font-bold text-slate-900 font-mono focus:outline-none focus:border-slate-900 text-sm" />
                <p className="text-[10px] text-slate-400">Por unidad: <span className="font-mono font-bold text-slate-600">{formatCOP(trashPerUnit)}</span></p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-[10px] uppercase tracking-wider">
                  <Home size={14} className="text-teal-500" /> Aseo Apto
                </div>
                <input type="text" value={apartmentTrashInputText} onChange={(e)=>{const c=e.target.value.replace(/\D/g,'');const n=c===''?0:Number(c);setApartmentTrashBill(n);setApartmentTrashInputText(c===''?'':n.toLocaleString('es-CO'));}} placeholder="45.000" className="w-full border-2 border-slate-200 rounded-lg px-3 py-2 font-bold text-slate-900 font-mono focus:outline-none focus:border-slate-900 text-sm" />
                <p className="text-[10px] text-slate-400">Exclusivo apartamento</p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-[10px] uppercase tracking-wider">
                  <Calendar size={14} /> Período
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Desde</label>
                    <input type="date" value={readingStartDate} onChange={e=>setReadingStartDate(e.target.value)} className="w-full border border-slate-200 bg-slate-50 rounded-lg px-2 py-1.5 text-[11px] font-mono focus:outline-none focus:border-slate-900" />
                  </div>
                  <div>
                    <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Hasta</label>
                    <input type="date" value={readingEndDate} onChange={e=>setReadingEndDate(e.target.value)} className="w-full border border-slate-200 bg-slate-50 rounded-lg px-2 py-1.5 text-[11px] font-mono focus:outline-none focus:border-slate-900" />
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-[10px] uppercase tracking-wider">
                  <Calendar size={14} /> Fecha límite
                </div>
                <div>
                  <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Pago general</label>
                  <input type="date" value={globalDueDate} onChange={e=>handleGlobalDueDateChange(e.target.value)} className="w-full border border-slate-200 bg-slate-50 rounded-lg px-2 py-1.5 text-[11px] font-mono focus:outline-none focus:border-slate-900" />
                </div>
                <p className="text-[10px] text-slate-400">Pago general</p>
              </div>
            </div>

            <div className="space-y-3">
              {properties.map((prop, index) => {
                const isExpanded = expandedRow === prop.id;
                const consumption = getPropertyConsumption(prop);
                const trashCost = getPropertyTrashCost(prop);
                const energyTotal = consumption * kwhRate;
                const total = energyTotal + trashCost;
                const isMulti = prop.meters === MULTI_METER;

                const statusCfg = prop.status === 'Pagado' ? {
                  dot: 'bg-emerald-500', badgeBg: 'bg-emerald-50', badgeText: 'text-emerald-700', badgeBorder: 'border-emerald-200'
                } : prop.status === 'Atrasado' ? {
                  dot: 'bg-rose-500', badgeBg: 'bg-rose-50', badgeText: 'text-rose-700', badgeBorder: 'border-rose-200'
                } : {
                  dot: 'bg-amber-500', badgeBg: 'bg-amber-50', badgeText: 'text-amber-700', badgeBorder: 'border-amber-200'
                };

                return (
                  <div
                    key={prop.id}
                    className={`bg-white rounded-xl border border-slate-200 shadow-sm transition-all duration-200 overflow-hidden ${
                      isExpanded ? 'shadow-md ring-1 ring-slate-200' : 'hover:shadow-md hover:border-slate-300'
                    }`}
                  >
                    {/* Fila principal */}
                    <div
                      onClick={() => setExpandedRow(isExpanded ? null : prop.id)}
                      className="px-5 py-3.5 flex items-center gap-4 cursor-pointer select-none"
                    >
                      <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-extrabold shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-slate-900">{prop.id}</span>
                          <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-md border ${statusCfg.badgeBg} ${statusCfg.badgeText} ${statusCfg.badgeBorder}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                            {prop.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 truncate">{prop.tenant} · {prop.email}</p>
                      </div>
                      <div className="hidden sm:block text-right">
                        <span className="text-[10px] text-slate-400 block">Total a cobrar</span>
                        <span className="font-mono font-bold text-slate-900">{formatCOP(total)}</span>
                      </div>
                      <div className={`text-slate-400 transition-transform duration-200 shrink-0 ${isExpanded ? 'rotate-90' : ''}`}>
                        <ChevronRight size={16} />
                      </div>
                    </div>

                    {/* Panel expandido */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-4">
                        {isMulti ? (
                          <div className="flex flex-col xl:flex-row gap-5">
                            <div className="flex-1 min-w-0">
                              <div className="space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                  {[
                                    { label: 'Contador 1', prev: 'm1Prev', curr: 'm1Curr', boxBg: 'bg-white', borderColor: 'border-slate-200', labelColor: 'text-slate-700' },
                                    { label: 'Contador 2', prev: 'm2Prev', curr: 'm2Curr', boxBg: 'bg-white', borderColor: 'border-slate-200', labelColor: 'text-slate-700' },
                                    { label: 'Trifásico', prev: 'm3Prev', curr: 'm3Curr', boxBg: 'bg-indigo-50/60', borderColor: 'border-indigo-200', labelColor: 'text-indigo-700' },
                                  ].map(m => (
                                    <div key={m.label} className={`p-3 rounded-lg border ${m.borderColor} ${m.boxBg} space-y-2`}>
                                      <span className={`text-[10px] uppercase font-bold block ${m.labelColor}`}>{m.label}</span>
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <label className="text-[9px] uppercase font-bold text-slate-500 block mb-1">Lect. anterior</label>
                                          <input type="number" value={prop[m.prev] ?? 0} onChange={e=>handleReadingChange(prop.id,m.prev,e.target.value)} onClick={e=>e.stopPropagation()} className="w-full border border-slate-200 rounded-md px-2 py-1.5 text-xs font-mono font-bold focus:outline-none focus:border-slate-900 bg-white" />
                                        </div>
                                        <div>
                                          <label className="text-[9px] uppercase font-bold text-slate-500 block mb-1">Lect. actual</label>
                                          <input type="number" value={prop[m.curr] ?? 0} onChange={e=>handleReadingChange(prop.id,m.curr,e.target.value)} onClick={e=>e.stopPropagation()} className="w-full border border-slate-200 rounded-md px-2 py-1.5 text-xs font-mono font-bold focus:outline-none focus:border-slate-900 bg-white" />
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <div className="flex justify-end">
                                  <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-200">
                                    ⚡ Consumo total: {consumption} kWh
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="xl:w-52 shrink-0 bg-white rounded-xl p-4 border border-slate-200 space-y-2 text-right">
                              <div>
                                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Valor energía</span>
                                <span className="font-mono font-bold text-slate-900 text-sm">{formatCOP(energyTotal)}</span>
                              </div>
                              <div>
                                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Valor aseo</span>
                                <span className={`font-mono font-bold text-sm ${trashCost>0?'text-emerald-600':'text-slate-400'}`}>{formatCOP(trashCost)}</span>
                              </div>
                              <div className="pt-2 border-t border-slate-100">
                                <span className="text-[11px] uppercase font-bold text-slate-600 block mb-0.5">Total a cobrar</span>
                                <span className="font-mono font-extrabold text-slate-900 text-xl">{formatCOP(total)}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 px-3 py-2">
                              <div>
                                <label className="text-[9px] uppercase font-bold text-slate-400 block">Anterior</label>
                                <input type="number" value={prop.prev ?? 0} onChange={e=>handleReadingChange(prop.id,'prev',e.target.value)} onClick={e=>e.stopPropagation()} className="w-24 border-0 p-0 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-0 bg-transparent" />
                              </div>
                              <span className="text-slate-300 text-xs">→</span>
                              <div>
                                <label className="text-[9px] uppercase font-bold text-slate-400 block">Actual</label>
                                <input type="number" value={prop.curr ?? 0} onChange={e=>handleReadingChange(prop.id,'curr',e.target.value)} onClick={e=>e.stopPropagation()} className="w-24 border-0 p-0 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-0 bg-transparent" />
                              </div>
                            </div>
                            <div className="bg-slate-100 rounded-lg px-3 py-2 text-center">
                              <span className="text-[9px] uppercase font-bold text-slate-400 block">Consumo</span>
                              <span className="font-mono font-bold text-slate-900 text-sm">{consumption} kWh</span>
                            </div>
                            <div className="flex items-center gap-3 ml-auto">
                              <div className="text-right">
                                <span className="text-[9px] uppercase font-bold text-slate-400 block">Energía</span>
                                <span className="font-mono font-bold text-slate-900 text-sm">{formatCOP(energyTotal)}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-[9px] uppercase font-bold text-slate-400 block">Aseo</span>
                                <span className={`font-mono font-bold text-sm ${trashCost>0?'text-emerald-600':'text-slate-400'}`}>{formatCOP(trashCost)}</span>
                              </div>
                              <div className="text-right pl-3 border-l border-slate-200">
                                <span className="text-[9px] uppercase font-bold text-slate-500 block">Total</span>
                                <span className="font-mono font-extrabold text-slate-900 text-base">{formatCOP(total)}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Control de Pagos</h2>
              <p className="text-slate-500 text-sm mt-1">Gestiona el estado de pago de cada unidad.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {properties.map((prop) => {
                const total = getPropertyTotal(prop);
                return (
                  <div key={prop.id} className={`bg-white rounded-xl border p-5 shadow-sm transition-all hover:shadow-md ${
                    prop.status === 'Pagado' ? 'border-emerald-200' :
                    prop.status === 'Atrasado' ? 'border-rose-200' : 'border-amber-200'
                  }`}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{prop.id}</h4>
                        <p className="text-xs text-slate-500">{prop.tenant}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${
                        prop.status === 'Pagado' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        prop.status === 'Atrasado' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>{prop.status}</span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Total:</span>
                        <span className="font-mono font-bold text-slate-900">{formatCOP(total)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Límite:</span>
                        <span className="font-mono text-slate-600">{prop.dueDate || '—'}</span>
                      </div>
                    </div>

                    <select
                      value={prop.status}
                      onChange={e => handleStatusChange(prop.id, e.target.value)}
                      className={`w-full text-xs font-bold px-3 py-2.5 rounded-lg border cursor-pointer focus:outline-none transition-colors ${
                        prop.status === 'Pagado' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                        prop.status === 'Atrasado' ? 'bg-rose-100 text-rose-800 border-rose-300' :
                        'bg-amber-100 text-amber-800 border-amber-300'
                      }`}
                    >
                      <option value="Pendiente">Pendiente</option>
                      <option value="Pagado">Pagado</option>
                      <option value="Atrasado">Atrasado</option>
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TENANTS */}
        {activeTab === 'tenants' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Gestión de Arrendatarios</h2>
                <p className="text-slate-500 text-sm mt-1">Administra inquilinos, credenciales y unidades.</p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 bg-slate-950 hover:bg-slate-800 text-white font-bold px-5 py-3 rounded-xl text-sm transition-all shadow-sm active:scale-[0.98]"
              >
                <PlusCircle size={16} /> Nuevo Arrendatario
              </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h3 className="font-bold text-sm">Arrendatarios ({properties.length})</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {properties.map((p, index) => (
                  <div key={p.id} className={`p-5 flex items-start justify-between transition-colors ${index%2===0?'bg-white':'bg-slate-50/50'} hover:bg-slate-100/50`}>
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-base text-slate-900">{p.id}</h4>
                        <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200">{p.meters}</span>
                        {p.mustChangePassword && (
                          <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-200">Debe cambiar clave</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-700 font-medium">{p.tenant} {p.lastName || ''}</p>
                      {p.businessName && <p className="text-xs text-slate-500">🏪 {p.businessName}</p>}
                      <p className="text-xs text-slate-400">📧 {p.email} • 🆔 {p.document || '—'}</p>
                      <p className="text-[11px] font-mono text-slate-400">🔑 {p.password || '—'}</p>
                      <p className="text-[11px] text-slate-400">💰 Canon: {formatCOP(p.baseAmount)}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-4">
                      <button onClick={()=>handleEditClick(p)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Editar">
                        <Edit3 size={16} />
                      </button>
                      <button onClick={()=>handleDeleteTenant(p.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Eliminar">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Historial de Recibos</h2>
                <p className="text-slate-500 text-sm mt-1">Recibos generados y guardados en el sistema.</p>
              </div>
              <button onClick={exportBillsCSV} disabled={!bills.length} className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 font-bold px-4 py-2.5 rounded-xl text-xs transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed">
                <Download size={14} /> Exportar CSV
              </button>
            </div>

            {bills.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <FileText size={32} className="text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500 font-medium">Aún no has generado recibos.</p>
                <p className="text-xs text-slate-400 mt-1">Ve a la pestaña "Servicios" y guarda los cálculos.</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider font-bold border-b border-slate-100">
                        <th className="px-5 py-3">Recibo</th>
                        <th className="px-5 py-3">Unidad</th>
                        <th className="px-5 py-3">Período</th>
                        <th className="px-5 py-3">Consumo</th>
                        <th className="px-5 py-3">Energía</th>
                        <th className="px-5 py-3">Aseo</th>
                        <th className="px-5 py-3">Total</th>
                        <th className="px-5 py-3">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {bills.map((b, i) => (
                        <tr key={b.id} className={`${i%2===0?'bg-white':'bg-slate-50/50'} hover:bg-slate-100/50 transition-colors`}>
                          <td className="px-5 py-3.5 font-mono text-[11px] text-slate-500">{b.id.split('-')[1]}</td>
                          <td className="px-5 py-3.5 font-bold text-slate-900">{b.unit}</td>
                          <td className="px-5 py-3.5 text-[11px] text-slate-500">{b.periodStart} → {b.periodEnd}</td>
                          <td className="px-5 py-3.5 font-mono text-xs">{b.consumption} kWh</td>
                          <td className="px-5 py-3.5 font-mono text-xs">{formatCOP(b.energyTotal)}</td>
                          <td className="px-5 py-3.5 font-mono text-xs">{formatCOP(b.trashCost)}</td>
                          <td className="px-5 py-3.5 font-mono font-bold text-slate-900">{formatCOP(b.total)}</td>
                          <td className="px-5 py-3.5">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold border ${
                              b.status==='Pagado'?'bg-emerald-50 text-emerald-700 border-emerald-200':
                              b.status==='Atrasado'?'bg-rose-50 text-rose-700 border-rose-200':
                              'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>{b.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal de Notificaciones */}
      {showNotifyModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-slate-100">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-slate-100 text-slate-900 rounded-xl border border-slate-200">
                <Bell size={18} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Enviando Notificaciones</h3>
                <p className="text-[11px] text-slate-500">Recibos generados. Notificando a arrendatarios...</p>
              </div>
            </div>

            <div className="space-y-3">
              {notifyProgress.map((item, idx) => (
                <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  item.status === 'done' 
                    ? 'bg-emerald-50 border-emerald-200' 
                    : item.status === 'loading'
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                    item.status === 'done' 
                      ? 'bg-emerald-500 text-white' 
                      : item.status === 'loading'
                      ? 'bg-amber-500 text-white'
                      : 'bg-slate-300 text-white'
                  }`}>
                    {item.status === 'done' ? (
                      <CheckCircle2 size={14} />
                    ) : item.status === 'loading' ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <span className="text-xs font-bold">{idx + 1}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`text-xs font-bold ${
                      item.status === 'done' ? 'text-emerald-700' : 
                      item.status === 'loading' ? 'text-amber-700' : 'text-slate-500'
                    }`}>
                      {item.text}
                    </p>
                  </div>
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
                <button
                  onClick={() => setShowNotifyModal(false)}
                  className="bg-slate-950 hover:bg-slate-800 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-all"
                >
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showCreateModal && (
        <CreateTenantModal
          onClose={() => { setShowCreateModal(false); setEditingTenantData(null); }}
          onTenantCreated={handleTenantCreated}
          editingTenant={editingTenantData}
        />
      )}
    </div>
  );
};

function TrendingUpIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
    </svg>
  );
}