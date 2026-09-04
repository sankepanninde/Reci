import {
  LayoutDashboard, Calculator, CreditCard, Users, Wrench, CheckCircle2, FileText,
  Receipt, User as UserIcon, Send, Building2
} from 'lucide-react';

export const adminTabs = [
  { key: 'overview', label: 'Resumen', icon: LayoutDashboard },
  { key: 'calculator', label: 'Servicios', icon: Calculator },
  { key: 'envios', label: 'Envíos', icon: Send },
  { key: 'units', label: 'Unidades', icon: Building2 },
  { key: 'payments', label: 'Pagos', icon: CreditCard },
  { key: 'tenants', label: 'Arrendatarios', icon: Users },
  { key: 'maintenance', label: 'Mantenimiento', icon: Wrench },
  { key: 'proofs', label: 'Comprobantes', icon: CheckCircle2 },
  { key: 'history', label: 'Historial', icon: FileText },
];

export const tenantTabs = [
  { key: 'overview', label: 'Resumen', icon: LayoutDashboard },
  { key: 'bills', label: 'Mis Recibos', icon: Receipt },
  { key: 'maintenance', label: 'Mantenimiento', icon: Wrench },
  { key: 'profile', label: 'Mi Perfil', icon: UserIcon },
];