import React, { useState, useEffect } from 'react';
import { X, Save, Building2, User, Mail, Phone, FileText } from 'lucide-react';

export default function CreateTenantModalNew({ editingTenant, existingProperties, onClose, onTenantCreated }) {
  const [form, setForm] = useState({
    fullName: '',
    idNit: '',
    email: '',
    phone: '',
    propertyId: '',
    password: 'Temp123!',
  });
  const [habeasData, setHabeasData] = useState(false);
  const [error, setError] = useState('');
  const [availableUnits, setAvailableUnits] = useState([]);

  useEffect(() => {
    if (editingTenant) {
      setForm({
        fullName: editingTenant.tenant || '',
        idNit: editingTenant.document || '',
        email: editingTenant.email || '',
        phone: editingTenant.phone || '',
        propertyId: editingTenant.id || '',
        password: editingTenant.password || 'Temp123!',
      });
      setHabeasData(true);
    } else {
      const free = existingProperties.filter(p => !p.tenant || p.tenant.trim() === '');
      setAvailableUnits(free);
      setForm(prev => ({ ...prev, propertyId: free.length > 0 ? free[0].id : '' }));
    }
  }, [editingTenant, existingProperties]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!form.fullName.trim()) return setError('El nombre es obligatorio.');
    if (!form.email.trim()) return setError('El correo es obligatorio.');
    if (!form.propertyId) return setError('Selecciona una propiedad.');

    const selectedProp = existingProperties.find(p => p.id === form.propertyId);
    if (!selectedProp) return setError('La unidad seleccionada no existe.');

    const data = {
      unit: selectedProp.unit,
      tenant: form.fullName,
      document: form.idNit,
      email: form.email,
      phone: form.phone,
      meters: selectedProp.meters,
      baseAmount: selectedProp.baseAmount,
      password: form.password,      // 👈 usar el campo
      tempPassword: form.password,
    };

    onTenantCreated(data);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-background border border-glass-stroke rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-[0px_20px_40px_rgba(0,0,0,0.4)] relative">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-on-surface">
              {editingTenant ? 'Editar Arrendatario' : 'Nuevo Arrendatario'}
            </h2>
            <p className="text-on-surface-variant mt-1">Registra un nuevo residente o empresa y asígnalo a una propiedad.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-glass-fill rounded-lg transition-colors">
            <X size={20} className="text-on-surface-variant" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 text-sm rounded-lg border border-rose-200">
              {error}
            </div>
          )}

          {/* Identity */}
          <div className="space-y-4">
            <h4 className="text-xs uppercase tracking-widest text-vibrant-cyan border-b border-glass-stroke pb-2">Identity Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative group">
                <label className="absolute left-4 top-2 text-xs text-on-primary-container transition-all group-focus-within:-translate-y-4 group-focus-within:bg-midnight-slate group-focus-within:px-1 group-focus-within:text-vibrant-cyan">
                  Nombre Completo / Empresa
                </label>
                <input type="text" name="fullName" value={form.fullName} onChange={handleChange} placeholder="Ingresar nombre" className="w-full bg-midnight-slate border border-glass-stroke rounded-lg px-4 pt-6 pb-2 text-on-surface focus:outline-none focus:border-vibrant-cyan focus:ring-1 focus:ring-vibrant-cyan/50 transition-all placeholder-transparent" required />
              </div>
              <div className="relative group">
                <label className="absolute left-4 top-2 text-xs text-on-primary-container transition-all group-focus-within:-translate-y-4 group-focus-within:bg-midnight-slate group-focus-within:px-1 group-focus-within:text-vibrant-cyan">
                  ID / NIT
                </label>
                <input type="text" name="idNit" value={form.idNit} onChange={handleChange} placeholder="Ingresar ID" className="w-full bg-midnight-slate border border-glass-stroke rounded-lg px-4 pt-6 pb-2 text-on-surface focus:outline-none focus:border-vibrant-cyan focus:ring-1 focus:ring-vibrant-cyan/50 transition-all placeholder-transparent" />
              </div>
            </div>
          </div>

          {/* Contraseña Provisional */}
          <div className="relative group">
            <label className="absolute left-4 top-2 text-xs text-on-primary-container transition-all group-focus-within:-translate-y-4 group-focus-within:bg-midnight-slate group-focus-within:px-1 group-focus-within:text-vibrant-cyan">
              Contraseña Provisional
            </label>
            <input type="text" name="password" value={form.password} onChange={handleChange} placeholder="Ingresar contraseña" className="w-full bg-midnight-slate border border-glass-stroke rounded-lg px-4 pt-6 pb-2 text-on-surface focus:outline-none focus:border-vibrant-cyan focus:ring-1 focus:ring-vibrant-cyan/50 transition-all placeholder-transparent" />
          </div>

          {/* Contact */}
          <div className="space-y-4 mt-4">
            <h4 className="text-xs uppercase tracking-widest text-vibrant-cyan border-b border-glass-stroke pb-2">Contact Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative group">
                <label className="absolute left-4 top-2 text-xs text-on-primary-container transition-all group-focus-within:-translate-y-4 group-focus-within:bg-midnight-slate group-focus-within:px-1 group-focus-within:text-vibrant-cyan">
                  Correo Electrónico
                </label>
                <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="Ingresar email" className="w-full bg-midnight-slate border border-glass-stroke rounded-lg px-4 pt-6 pb-2 text-on-surface focus:outline-none focus:border-vibrant-cyan focus:ring-1 focus:ring-vibrant-cyan/50 transition-all placeholder-transparent" required />
              </div>
              <div className="relative group">
                <label className="absolute left-4 top-2 text-xs text-on-primary-container transition-all group-focus-within:-translate-y-4 group-focus-within:bg-midnight-slate group-focus-within:px-1 group-focus-within:text-vibrant-cyan">
                  Teléfono
                </label>
                <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="Ingresar teléfono" className="w-full bg-midnight-slate border border-glass-stroke rounded-lg px-4 pt-6 pb-2 text-on-surface focus:outline-none focus:border-vibrant-cyan focus:ring-1 focus:ring-vibrant-cyan/50 transition-all placeholder-transparent" />
              </div>
            </div>
          </div>

          {/* Assignment */}
          <div className="space-y-4 mt-4">
            <h4 className="text-xs uppercase tracking-widest text-vibrant-cyan border-b border-glass-stroke pb-2">Property Assignment</h4>
            <div className="relative group">
              <label className="absolute left-4 top-2 text-xs text-on-primary-container z-10 transition-all group-focus-within:-translate-y-4 group-focus-within:bg-midnight-slate group-focus-within:px-1 group-focus-within:text-vibrant-cyan">
                Asignar Propiedad
              </label>
              <select name="propertyId" value={form.propertyId} onChange={handleChange} className="w-full bg-midnight-slate border border-glass-stroke rounded-lg px-4 pt-6 pb-2 text-on-surface focus:outline-none focus:border-vibrant-cyan focus:ring-1 focus:ring-vibrant-cyan/50 transition-all appearance-none" required>
                <option className="bg-surface" value="">Selecciona una propiedad...</option>
                {availableUnits.map(unit => (
                  <option key={unit.id} className="bg-surface" value={unit.id}>{unit.unit}</option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
            </div>
          </div>

          {/* Habeas Data */}
          <div className="mt-6 p-4 rounded-lg bg-glass-fill border border-glass-stroke flex items-start gap-3 hover:border-vibrant-cyan/30 transition-colors">
            <div className="flex h-6 items-center">
              <input id="habeasData" type="checkbox" checked={habeasData} onChange={() => setHabeasData(!habeasData)} className="h-4 w-4 rounded border-glass-stroke bg-midnight-slate text-vibrant-cyan focus:ring-vibrant-cyan" />
            </div>
            <div className="text-sm leading-6">
              <label htmlFor="habeasData" className="font-medium text-on-surface block">Acuerdo de Protección de Datos (Habeas Data)</label>
              <p className="text-sm text-on-surface-variant mt-1">Autorizo a Bap Inmobiliaria a recolectar, almacenar y procesar los datos personales proporcionados en este formulario para fines administrativos, contractuales y de comunicación, conforme a las leyes de privacidad vigentes.</p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex justify-end gap-4">
            <button type="button" onClick={onClose} className="px-6 py-3 rounded-lg border border-glass-stroke bg-glass-fill hover:border-vibrant-cyan text-on-surface font-medium transition-all">Cancelar</button>
            <button type="submit" className="px-6 py-3 rounded-lg bg-secondary-container text-on-secondary-container font-semibold hover:shadow-[0_0_20px_rgba(0,240,255,0.3)] transition-all flex items-center gap-2">
              <Save size={16} />
              {editingTenant ? 'Guardar Cambios' : 'Registrar Arrendatario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}