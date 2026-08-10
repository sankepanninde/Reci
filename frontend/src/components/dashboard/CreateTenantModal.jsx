import React, { useState } from 'react';
import { UserPlus, Key, RefreshCw, Send, CheckCircle2, AlertCircle, X, Hash, User, Briefcase, Mail, CreditCard, Gauge, Hash as HashIcon } from 'lucide-react';

export function CreateTenantModal({ onClose, onTenantCreated, editingTenant = null }) {
  const [formData, setFormData] = useState({
    id: editingTenant?.id || '',
    firstName: editingTenant?.firstName || '',
    lastName: editingTenant?.lastName || '',
    businessName: editingTenant?.businessName || '',
    document: editingTenant?.document || '',
    email: editingTenant?.email || '',
    tempPassword: editingTenant?.password || '',
    meterType: editingTenant?.meterType || 'Normal',
    meterCount: editingTenant?.meterCount || '1',
    baseAmount: editingTenant?.baseAmount ? Number(editingTenant.baseAmount).toLocaleString('es-CO') : '',
    sendEmailNotification: true,
  });

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const isEditing = !!editingTenant;

  const generateTempPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let pwd = '';
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, tempPassword: pwd }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleAmountChange = (e) => {
    const raw = e.target.value;
    const digits = raw.replace(/\D/g, '');
    const num = digits === '' ? 0 : Number(digits);
    setFormData(prev => ({ ...prev, baseAmount: digits === '' ? '' : num.toLocaleString('es-CO') }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.id || !formData.firstName || !formData.document) {
      setStatusMessage({ type: 'error', text: 'ID, Nombre y Documento son obligatorios.' });
      return;
    }
    if (!formData.tempPassword) {
      setStatusMessage({ type: 'error', text: 'La contraseña provisional es obligatoria.' });
      return;
    }
    setLoading(true);
    setStatusMessage(null);

    try {
      await new Promise(r => setTimeout(r, 600));

      // Construir el nombre completo y tipo de medidor
      const fullName = `${formData.firstName} ${formData.lastName || ''}`.trim();
      const meterConfig = formData.meterCount === '1' 
        ? '1 Normal' 
        : `${formData.meterCount} Normales, 1 Trifásico`;

      if (onTenantCreated) {
        onTenantCreated({
          id: formData.id,
          unit: formData.id,
          tenant: fullName,
          firstName: formData.firstName,
          lastName: formData.lastName,
          businessName: formData.businessName,
          document: formData.document,
          email: formData.email,
          tempPassword: formData.tempPassword,
          mustChangePassword: true,
          meters: meterConfig,
          meterType: formData.meterType,
          meterCount: formData.meterCount,
          baseAmount: formData.baseAmount.replace(/\D/g, '') || '0',
          status: 'Pendiente',
        });
      }

      setStatusMessage({
        type: 'success',
        text: isEditing 
          ? 'Arrendatario actualizado correctamente.'
          : 'Arrendatario creado. Credenciales listas para enviar.',
      });

      setTimeout(() => { if (onClose) onClose(); }, 1500);
    } catch {
      setStatusMessage({ type: 'error', text: 'Error al guardar arrendatario.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative border border-slate-100 my-8">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors">
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-slate-100 text-slate-900 rounded-xl border border-slate-200">
            <UserPlus size={18} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{isEditing ? 'Editar Arrendatario' : 'Nuevo Arrendatario'}</h2>
            <p className="text-[11px] text-slate-500">Completa todos los datos del inquilino.</p>
          </div>
        </div>

        {statusMessage && (
          <div className={`p-3 rounded-xl text-xs font-bold mb-5 flex items-center gap-2 border ${
            statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'
          }`}>
            {statusMessage.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
            {statusMessage.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ID de Unidad */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
              <HashIcon size={12} /> ID de la Unidad / Local
            </label>
            <input 
              type="text" 
              name="id" 
              required 
              value={formData.id} 
              onChange={handleChange} 
              placeholder="Ej: Local 5, Apto 101" 
              disabled={isEditing}
              className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-slate-900 transition-colors disabled:bg-slate-50" 
            />
          </div>

          {/* Nombre y Apellido */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                <User size={12} /> Nombre
              </label>
              <input 
                type="text" 
                name="firstName" 
                required 
                value={formData.firstName} 
                onChange={handleChange} 
                placeholder="Juan" 
                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-slate-900 transition-colors" 
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Apellido
              </label>
              <input 
                type="text" 
                name="lastName" 
                value={formData.lastName} 
                onChange={handleChange} 
                placeholder="Pérez" 
                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-slate-900 transition-colors" 
              />
            </div>
          </div>

          {/* Nombre del Comercio */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
              <Briefcase size={12} /> Nombre del Comercio
            </label>
            <input 
              type="text" 
              name="businessName" 
              value={formData.businessName} 
              onChange={handleChange} 
              placeholder="Ej: Panadería Doña Rosa (opcional)" 
              className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-slate-900 transition-colors" 
            />
          </div>

          {/* Documento y Correo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                <Hash size={12} /> Documento / Cédula
              </label>
              <input 
                type="text" 
                name="document" 
                required 
                value={formData.document} 
                onChange={handleChange} 
                placeholder="1018293840" 
                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-slate-900 transition-colors" 
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                <Mail size={12} /> Correo
              </label>
              <input 
                type="email" 
                name="email" 
                value={formData.email} 
                onChange={handleChange} 
                placeholder="correo@mail.com" 
                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-slate-900 transition-colors" 
              />
            </div>
          </div>

          {/* Contraseña Provisional */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Key size={12} /> Contraseña Provisional
              </label>
              <button type="button" onClick={generateTempPassword} className="text-[10px] text-slate-900 font-bold hover:underline flex items-center gap-1">
                <RefreshCw size={10} /> Generar
              </button>
            </div>
            <div className="relative">
              <input 
                type="text" 
                name="tempPassword" 
                required 
                value={formData.tempPassword} 
                onChange={handleChange} 
                placeholder="Genera o escribe una clave" 
                className="w-full border border-slate-200 rounded-xl p-3 text-sm font-mono focus:outline-none focus:border-slate-900 transition-colors pr-10" 
              />
              <Key size={16} className="absolute right-3 top-3.5 text-slate-300" />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">El arrendatario deberá cambiarla en su primer ingreso.</p>
          </div>

          {/* Tipo de Contador y Número de Contadores */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                <Gauge size={12} /> Tipo de Contador
              </label>
              <select 
                name="meterType" 
                value={formData.meterType} 
                onChange={handleChange} 
                className="w-full border border-slate-200 rounded-xl p-3 text-sm bg-white focus:outline-none focus:border-slate-900 transition-colors"
              >
                <option value="Normal">Normal</option>
                <option value="Trifásico">Trifásico</option>
                <option value="Mixto">Mixto</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                <HashIcon size={12} /> N° Contadores
              </label>
              <select 
                name="meterCount" 
                value={formData.meterCount} 
                onChange={handleChange} 
                className="w-full border border-slate-200 rounded-xl p-3 text-sm bg-white focus:outline-none focus:border-slate-900 transition-colors"
              >
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
              </select>
            </div>
          </div>

          {/* Canon Base */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
              <CreditCard size={12} /> Canon Base
            </label>
            <input 
              type="text" 
              value={formData.baseAmount} 
              onChange={handleAmountChange} 
              placeholder="1.200.000" 
              className="w-full border border-slate-200 rounded-xl p-3 text-sm font-mono font-bold focus:outline-none focus:border-slate-900 transition-colors" 
            />
          </div>

          {/* Notificación por correo */}
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-600">
            <input 
              type="checkbox" 
              name="sendEmailNotification" 
              checked={formData.sendEmailNotification} 
              onChange={handleChange} 
              className="rounded border-slate-300 text-slate-900 focus:ring-slate-900" 
            />
            Notificar al arrendatario por correo con sus credenciales.
          </label>

          {/* Botones */}
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              className="px-6 py-2.5 text-xs font-bold bg-slate-950 hover:bg-slate-800 text-white rounded-xl transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 active:scale-[0.98]"
            >
              <Send size={12} />
              {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear y Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}