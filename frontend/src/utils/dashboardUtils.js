/* ─── Constantes ─── */
export const DEFAULT_PROPERTIES = [
  { id: 'Local 1', unit: 'Local 1', tenant: 'Comercio Alpha', email: 'local1@mail.com', document: '101010', password: 'Temp123!', meters: '1 Normal', status: 'Pendiente', baseAmount: 1500000, dueDate: '2026-08-30', prev: 1000, curr: 1120 },
  { id: 'Local 2', unit: 'Local 2', tenant: 'Comercio Beta', email: 'local2@mail.com', document: '202020', password: 'Temp123!', meters: '2 Normales, 1 Trifásico', status: 'Pendiente', baseAmount: 2800000, dueDate: '2026-08-30', m1Prev: 500, m1Curr: 590, m2Prev: 300, m2Curr: 410, m3Prev: 1000, m3Curr: 1250 },
  { id: 'Local 3', unit: 'Local 3', tenant: 'Comercio Gamma', email: 'local3@mail.com', document: '303030', password: 'Temp123!', meters: '1 Normal', status: 'Pagado', baseAmount: 1200000, dueDate: '2026-08-30', prev: 800, curr: 910 },
{ id: 'Garaje', unit: 'Garaje', tenant: 'Uso Interno / Sin Arrendatario', email: '', document: '', password: '', meters: '1 Normal', status: 'Pagado', baseAmount: 0, dueDate: '2026-08-30', prev: 100, curr: 150 },  { id: 'Apartamento', unit: 'Apartamento', tenant: 'Juan Pérez', email: 'apartamento@mail.com', document: '505050', password: 'Temp123!', meters: '1 Normal', status: 'Pagado', baseAmount: 1200000, dueDate: '2026-08-30', prev: 2200, curr: 2350 },
  { id: 'Salón', unit: 'Salón', tenant: 'Uso Común', email: 'salon@mail.com', document: '606060', password: 'Temp123!', meters: '1 Normal', status: 'Pagado', baseAmount: 500000, dueDate: '2026-08-30', prev: 400, curr: 450 },
];

export const MULTI_METER = '2 Normales, 1 Trifásico';
export const SINGLE_METER = '1 Normal';

export const STATUS_STYLES = {
  Pagado: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', icon: null },
  Pendiente: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500', icon: null },
  Atrasado: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500', icon: null },
};

export const TICKET_STATUS = {
  open: { label: 'Abierto', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'in-progress': { label: 'En progreso', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  resolved: { label: 'Resuelto', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
};

export const PRIORITY_STYLES = {
  high: { label: 'Alta', bg: 'bg-rose-100', text: 'text-rose-700' },
  medium: { label: 'Media', bg: 'bg-amber-100', text: 'text-amber-700' },
  low: { label: 'Baja', bg: 'bg-emerald-100', text: 'text-emerald-700' },
};

/* ─── Helpers ─── */
export const ensureMultiMeterFields = (prop) => {
  if (prop.meters === MULTI_METER) {
    return { ...prop, m1Prev: prop.m1Prev ?? 0, m1Curr: prop.m1Curr ?? 0, m2Prev: prop.m2Prev ?? 0, m2Curr: prop.m2Curr ?? 0, m3Prev: prop.m3Prev ?? 0, m3Curr: prop.m3Curr ?? 0 };
  }
  return { ...prop, prev: prop.prev ?? 0, curr: prop.curr ?? 0 };
};

export const formatCOP = (val) => {
  if (!val && val !== 0) return '$0';
  const n = typeof val === 'string' ? Number(val.replace(/\D/g, '')) : val;
  return '$' + n.toLocaleString('es-CO');
};

export const getPropertyConsumption = (prop) => {
  if (prop.meters === MULTI_METER) {
    const c1 = Math.max(0, (Number(prop.m1Curr) || 0) - (Number(prop.m1Prev) || 0));
    const c2 = Math.max(0, (Number(prop.m2Curr) || 0) - (Number(prop.m2Prev) || 0));
    const c3 = Math.max(0, (Number(prop.m3Curr) || 0) - (Number(prop.m3Prev) || 0));
    return c1 + c2 + c3;
  }
  return Math.max(0, (Number(prop.curr) || 0) - (Number(prop.prev) || 0));
};

export const getPropertyTrashCost = (prop, trashPerUnit, apartmentTrashBill) => {
  if (prop.unit === 'Apartamento') return apartmentTrashBill;
  if (prop.unit === 'Garaje') return 0;
  return trashPerUnit;
};

export const getPropertyTotal = (prop, kwhRate, trashPerUnit, apartmentTrashBill) => {
  return (getPropertyConsumption(prop) * kwhRate) + getPropertyTrashCost(prop, trashPerUnit, apartmentTrashBill);
};