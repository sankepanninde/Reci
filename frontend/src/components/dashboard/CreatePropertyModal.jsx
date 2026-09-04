import React, { useState } from 'react';
import { X, Save, Zap } from 'lucide-react';

export default function CreatePropertyModal({ onClose, onPropertyCreated }) {
  const [name, setName] = useState('');
  const [meters, setMeters] = useState('1 Normal');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('El nombre de la unidad es obligatorio.');
      return;
    }
    onPropertyCreated({ name, meters });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-background border border-glass-stroke rounded-xl p-8 max-w-md w-full floating-shadow relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-vibrant-cyan/5 to-transparent pointer-events-none"></div>
        <div className="flex justify-between items-start mb-6 relative z-10">
          <div>
            <h2 className="text-2xl font-bold text-on-surface">Registrar Nueva Unidad</h2>
            <p className="text-sm text-on-surface-variant mt-1">Ingresa los datos de la propiedad</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-glass-fill rounded-lg transition-colors">
            <X size={18} className="text-on-surface-variant" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 text-sm rounded-lg border border-rose-200">
              {error}
            </div>
          )}

          {/* Nombre de la unidad */}
          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-2">
              Nombre / Designación *
            </label>
            <div className="relative vibrant-input-group">
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder=" "
                className="w-full bg-midnight-slate border border-glass-stroke rounded-lg px-4 py-3 text-on-surface focus:outline-none focus:border-vibrant-cyan focus:ring-1 focus:ring-vibrant-cyan transition-all"
                required
              />
              <label className="absolute left-4 top-3 text-on-surface-variant transition-all duration-300 pointer-events-none">
                Nombre de la unidad
              </label>
            </div>
          </div>

          {/* Tipo de contador */}
          <div>
            <label className="block text-sm font-medium text-on-surface-variant mb-3 flex items-center gap-2">
              <Zap size={16} className="text-vibrant-cyan" /> Tipo de contador
            </label>
            <div className="space-y-3">
              <label className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                meters === '1 Normal'
                  ? 'border-vibrant-cyan/50 bg-vibrant-cyan/10 shadow-[0_0_15px_rgba(0,240,255,0.15)]'
                  : 'border-glass-stroke hover:bg-glass-fill hover:border-vibrant-cyan/50'
              }`}>
                <input
                  type="radio"
                  name="meters"
                  value="1 Normal"
                  checked={meters === '1 Normal'}
                  onChange={() => setMeters('1 Normal')}
                  className="form-radio h-5 w-5 text-vibrant-cyan bg-midnight-slate border-outline rounded focus:ring-vibrant-cyan"
                />
                <div className="flex-1">
                  <p className="font-medium text-on-surface">1 Normal</p>
                  <p className="text-sm text-on-surface-variant">Suministro monofásico estándar.</p>
                </div>
              </label>

              <label className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                meters === '2 Normales, 1 Trifásico'
                  ? 'border-vibrant-cyan/50 bg-vibrant-cyan/10 shadow-[0_0_15px_rgba(0,240,255,0.15)]'
                  : 'border-glass-stroke hover:bg-glass-fill hover:border-vibrant-cyan/50'
              }`}>
                <input
                  type="radio"
                  name="meters"
                  value="2 Normales, 1 Trifásico"
                  checked={meters === '2 Normales, 1 Trifásico'}
                  onChange={() => setMeters('2 Normales, 1 Trifásico')}
                  className="form-radio h-5 w-5 text-vibrant-cyan bg-midnight-slate border-outline rounded focus:ring-vibrant-cyan"
                />
                <div className="flex-1">
                  <p className="font-medium text-vibrant-cyan flex items-center gap-1">
                    2 Normales, 1 Trifásico
                    <span className="material-symbols-outlined text-[16px]">offline_bolt</span>
                  </p>
                  <p className="text-sm text-on-surface-variant">Suministro trifásico de alta potencia.</p>
                </div>
              </label>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex flex-col gap-3 pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-secondary text-background font-bold rounded-lg electric-glow transition-all duration-300 flex justify-center items-center gap-2 hover:shadow-[0_0_25px_rgba(0,240,255,0.5)]"
            >
              <Save size={16} />
              Registrar Unidad
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 bg-transparent border border-glass-stroke text-on-surface rounded-lg hover:bg-glass-fill hover:text-vibrant-cyan hover:border-vibrant-cyan/50 transition-all"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}