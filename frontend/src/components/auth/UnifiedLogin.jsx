import React, { useState } from 'react';
import api from '../../utils/api';

export default function UnifiedLogin({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Detecta si el correo es administrativo
  const isAdmin = email.trim().toLowerCase().endsWith('@bap.com');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('bap_token', res.data.token);
      onLoginSuccess(res.data.user);
    } catch (err) {
      setError(err?.response?.data?.message || 'Error en autenticación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-5 md:p-16 bg-primary-container relative overflow-hidden font-body-md text-body-md">
      {/* Abstract Background Pattern */}
      <div className="absolute inset-0 bg-pattern opacity-50 pointer-events-none z-0"></div>

      <main className="w-full max-w-md relative z-10 flex flex-col items-center">
        {/* Brand */}
        <div className="mb-12 text-center animate-fade-scale">
          <h1 className="font-display-lg text-5xl text-vibrant-cyan tracking-tight mb-2">Bap</h1>
          <p className="font-label-md text-xs text-on-surface-variant uppercase tracking-widest">Inmobiliaria</p>
        </div>

        {/* Login Card */}
        <div
          className={`glass-panel w-full rounded-xl p-8 md:p-12 flex flex-col gap-8 relative overflow-hidden animate-fade-scale transition-all duration-500 ${
            isAdmin ? 'border-vibrant-cyan/30 shadow-[0px_0px_30px_rgba(0,240,255,0.15)]' : ''
          }`}
          style={isAdmin ? { borderColor: 'rgba(0,240,255,0.3)' } : {}}
        >
          {/* Línea decorativa */}
          <div
            className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-vibrant-cyan to-transparent transition-opacity duration-500 ${
              isAdmin ? 'opacity-100' : 'opacity-50'
            }`}
          ></div>

          <div className="text-center animate-stagger-1">
            <h2
              className={`font-headline-md text-2xl mb-2 transition-colors duration-500 ${
                isAdmin ? 'text-vibrant-cyan' : 'text-on-surface'
              }`}
            >
              {isAdmin ? 'Panel Administrativo' : 'Portal Arrendatario'}
            </h2>
            <p className="font-body-sm text-sm text-on-surface-variant">
              {isAdmin
                ? 'Acceso seguro al sistema de gestión'
                : 'Acceso exclusivo para residentes y arrendatarios'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full">
            {/* Email */}
            <div className="relative flex flex-col gap-1 group animate-stagger-1">
              <label
                htmlFor="email"
                className="font-label-sm text-xs text-on-surface-variant transition-colors group-focus-within:text-vibrant-cyan ml-1"
              >
                Correo Electrónico
              </label>
              <div className="relative flex items-center vibrant-input transition-all bg-midnight-slate rounded border border-glass-stroke overflow-hidden">
                <span className="material-symbols-outlined text-outline absolute left-4 pointer-events-none group-focus-within:text-vibrant-cyan transition-colors">
                  mail
                </span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@ejemplo.com"
                  required
                  className="w-full bg-transparent border-none text-on-surface font-body-md text-base pl-12 pr-4 py-3 focus:ring-0 placeholder:text-outline-variant focus:outline-none"
                />
              </div>
            </div>

            {/* Password */}
            <div className="relative flex flex-col gap-1 group animate-stagger-2">
              <label
                htmlFor="password"
                className="font-label-sm text-xs text-on-surface-variant transition-colors group-focus-within:text-vibrant-cyan ml-1"
              >
                Contraseña
              </label>
              <div className="relative flex items-center vibrant-input transition-all bg-midnight-slate rounded border border-glass-stroke overflow-hidden">
                <span className="material-symbols-outlined text-outline absolute left-4 pointer-events-none group-focus-within:text-vibrant-cyan transition-colors">
                  lock
                </span>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-transparent border-none text-on-surface font-body-md text-base pl-12 pr-4 py-3 focus:ring-0 placeholder:text-outline-variant focus:outline-none"
                />
              </div>
            </div>

            {error && (
              <p className="text-error text-sm text-center -mt-2">{error}</p>
            )}

            {/* Acción y recuperación */}
            <div className="flex flex-col gap-4 mt-2 animate-stagger-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-vibrant-cyan text-primary-container font-label-md font-semibold py-4 rounded glow-btn animate-pulse-glow flex justify-center items-center gap-2 transition-all duration-500 disabled:opacity-60"
              >
                <span>{loading ? 'Cargando...' : isAdmin ? 'Ingresar al Sistema' : 'Ingresar al Portal'}</span>
                <span className="material-symbols-outlined text-[18px]">
                  {isAdmin ? 'admin_panel_settings' : 'arrow_forward'}
                </span>
              </button>
              <a
                href="#"
                className="text-center font-body-sm text-sm text-on-surface-variant hover:text-vibrant-cyan transition-colors mt-2"
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div
          className="mt-12 text-center animate-fade-scale"
          style={{ animationDelay: '0.6s', opacity: 0 }}
        >
          <p className="font-label-sm text-xs text-on-surface-variant">
            © 2024 Bap Inmobiliaria. PropTech de Alto Nivel.
          </p>
        </div>
      </main>

      {/* Imagen de fondo sutil */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20 flex justify-center items-center overflow-hidden mix-blend-screen">
        <div
          className="bg-cover bg-center w-[150%] h-[150%] rotate-[15deg] animate-bg-pulse"
          style={{
            backgroundImage:
              "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB_u08UpvPnWuEiEueYGiJMMaePEcydSRP1a8QSONV5eRvT6sskWXCwmRVXmrlsqlXPZEVQAazAE0TE8P06wljiXGJ2PUV0RpLoIyyWHGhdjpovmbAq-b7z4WLopwUa6BwhNQ8QSa3ngEXzdcv26wxN9BRAeVeX8A-F9rh3TYep7-5L6XGCMfcb5UNlOrBG0IO_WRiI1obQHwXC7_O_VTLUT9ILiiU9m9zSxyrKubsg3UWMmTT_6Uk')",
          }}
        ></div>
      </div>
    </div>
  );
}