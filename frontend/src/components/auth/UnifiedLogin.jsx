import React, { useState, useEffect } from 'react';
import { Building2, ArrowRight, AlertCircle, ShieldCheck, X, CheckCircle2, Eye, EyeOff, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ADMIN_EMAIL = 'admin@bap.com';

export const UnifiedLogin = ({ onLoginSuccess }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Estados para cambio de contraseña obligatorio
  const [showChangePassModal, setShowChangePassModal] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [changeError, setChangeError] = useState('');
  const [changeSuccess, setChangeSuccess] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem('bap_remembered_id');
    if (saved) {
      setIdentifier(saved);
      setRememberMe(true);
    }
  }, []);

  const isAdminInput = identifier.trim().toLowerCase() === ADMIN_EMAIL;

  const getTenants = () => {
    try {
      return JSON.parse(localStorage.getItem('bap_properties') || '[]');
    } catch { return []; }
  };

  const saveTenants = (tenants) => {
    localStorage.setItem('bap_properties', JSON.stringify(tenants));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setError('Completa todos los campos.');
      return;
    }
    setError('');

    if (rememberMe) {
      localStorage.setItem('bap_remembered_id', identifier);
    } else {
      localStorage.removeItem('bap_remembered_id');
    }

    const cleanId = identifier.trim().toLowerCase();

    if (cleanId === ADMIN_EMAIL) {
      if (password === 'admin123') {
        onLoginSuccess({ name: 'Administrador Bap', role: 'admin', email: ADMIN_EMAIL });
        navigate('/dashboard');
      } else {
        setError('Contraseña de administrador incorrecta.');
      }
      return;
    }

    const tenants = getTenants();
    const tenant = tenants.find(t =>
      (t.document && t.document.toLowerCase() === cleanId) ||
      (t.email && t.email.toLowerCase() === cleanId)
    );

    if (!tenant) {
      setError('Arrendatario no encontrado. Verifica tu documento o correo.');
      return;
    }

    if (tenant.password !== password) {
      setError('Contraseña incorrecta.');
      return;
    }

    // Si debe cambiar contraseña, mostrar modal primero
    if (tenant.mustChangePassword === true) {
      setPendingUser({ tenant, tenants });
      setShowChangePassModal(true);
      return;
    }

    // Login normal
    const userData = {
      id: tenant.id,
      name: tenant.tenant || tenant.name,
      document: tenant.document,
      email: tenant.email,
      role: 'tenant',
      unit: tenant.unit || tenant.id
    };
    onLoginSuccess(userData);
    navigate('/dashboard');
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    setChangeError('');

    if (!newPassword || newPassword.length < 6) {
      setChangeError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setChangeError('Las contraseñas no coinciden.');
      return;
    }
    if (newPassword === pendingUser.tenant.password) {
      setChangeError('La nueva contraseña debe ser diferente a la provisional.');
      return;
    }

    // Actualizar tenant
    const updatedTenants = pendingUser.tenants.map(t => {
      if (t.id === pendingUser.tenant.id) {
        return { ...t, password: newPassword, mustChangePassword: false };
      }
      return t;
    });
    saveTenants(updatedTenants);

    setChangeSuccess(true);
    setTimeout(() => {
      setShowChangePassModal(false);
      setChangeSuccess(false);
      setNewPassword('');
      setConfirmPassword('');
      setPendingUser(null);

      // Ahora sí hacer login
      const userData = {
        id: pendingUser.tenant.id,
        name: pendingUser.tenant.tenant || pendingUser.tenant.name,
        document: pendingUser.tenant.document,
        email: pendingUser.tenant.email,
        role: 'tenant',
        unit: pendingUser.tenant.unit || pendingUser.tenant.id
      };
      onLoginSuccess(userData);
      navigate('/dashboard');
    }, 1500);
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    setForgotSuccess(true);
    setTimeout(() => {
      setShowForgotModal(false);
      setForgotSuccess(false);
      setForgotEmail('');
    }, 2500);
  };

  return (
    <div className="min-h-screen flex w-full bg-white antialiased relative selection:bg-slate-900 selection:text-white">
      {/* Panel Izquierdo */}
      <div className="hidden lg:flex w-1/2 bg-slate-950 flex-col justify-between p-12 text-white relative overflow-hidden">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-slate-800/30 rounded-full blur-2xl" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
            <Building2 size={24} className="text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">Factura Recibos Públicos</span>
        </div>

        <div className="relative z-10 max-w-md space-y-4">
          <h1 className="text-4xl font-bold leading-tight">
            Gestión transparente de consumos energéticos.
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            Administra lecturas, calcula cobros y controla pagos desde un solo lugar.
          </p>
        </div>

        <div className="relative z-10 text-sm text-slate-600 font-medium">
          © Bap Inmobiliaria
        </div>
      </div>

      {/* Panel Derecho */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 text-slate-900 font-semibold text-xs uppercase tracking-wider mb-3 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200">
              {isAdminInput ? <ShieldCheck size={14} /> : <Building2 size={14} />}
              {isAdminInput ? 'Portal Administrativo' : 'Portal de Arrendatarios'}
            </div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Iniciar Sesión</h2>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              {isAdminInput
                ? 'Ingresa con tu correo corporativo autorizado.'
                : 'Ingresa tu número de documento o correo registrado.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-start gap-2.5 p-3.5 bg-rose-50 text-rose-700 text-xs font-semibold rounded-xl border border-rose-100 animate-fadeIn">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <div className="space-y-1.5 group">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider group-focus-within:text-slate-900 transition-colors">
                Correo o Número de Documento
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full border-b-2 border-slate-200 py-2.5 bg-transparent text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-slate-900 transition-colors font-medium text-lg"
                placeholder="Ej: admin@bap.com o 1018293840"
                autoComplete="username"
              />
            </div>

            <div className="space-y-1.5 group">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider group-focus-within:text-slate-900 transition-colors">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border-b-2 border-slate-200 py-2.5 bg-transparent text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-slate-900 transition-colors font-medium text-lg pr-10"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-0 top-2.5 text-slate-400 hover:text-slate-700 transition-colors"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 font-medium select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                Recordarme
              </label>
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-slate-900 font-bold hover:underline focus:outline-none"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-slate-950 hover:bg-slate-800 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-slate-900/10 mt-6 active:scale-[0.98]"
            >
              Ingresar al Sistema <ArrowRight size={18} />
            </button>

            <p className="text-center text-[11px] text-slate-400 mt-4">
              Admin: <span className="font-mono text-slate-600">admin@bap.com / admin123</span>
            </p>
          </form>
        </div>
      </div>

      {/* Modal Recuperación */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-slate-100">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-bold text-slate-900">Recuperación de Contraseña</h3>
            <p className="text-sm text-slate-500 mt-1 mb-5">
              Ingresa tu correo o documento para recibir instrucciones.
            </p>

            {forgotSuccess ? (
              <div className="flex items-center gap-2 p-3.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200">
                <CheckCircle2 size={16} /> Instrucciones enviadas correctamente.
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <input
                  type="text"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="Ej: admin@bap.com o 1018293840"
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-slate-900 transition-colors"
                />
                <button
                  type="submit"
                  className="w-full bg-slate-950 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-sm transition-all"
                >
                  Enviar Instrucciones
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal Cambio de Contraseña Obligatorio */}
      {showChangePassModal && pendingUser && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-slate-100">
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-200">
                <Lock size={18} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Cambio de Contraseña Obligatorio</h3>
                <p className="text-[11px] text-slate-500">
                  Hola <strong>{pendingUser.tenant.tenant || pendingUser.tenant.name}</strong>, debes crear una contraseña personal antes de continuar.
                </p>
              </div>
            </div>

            {changeSuccess ? (
              <div className="mt-4 flex items-center gap-2 p-3.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200 animate-fadeIn">
                <CheckCircle2 size={16} /> Contraseña actualizada. Redirigiendo...
              </div>
            ) : (
              <form onSubmit={handleChangePassword} className="mt-5 space-y-4">
                {changeError && (
                  <div className="flex items-start gap-2 p-3 bg-rose-50 text-rose-700 text-xs font-semibold rounded-xl border border-rose-100 animate-fadeIn">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    {changeError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nueva Contraseña</label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-slate-900 transition-colors pr-10"
                      placeholder="Mínimo 6 caracteres"
                      autoFocus
                    />
                    <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="absolute right-3 top-3 text-slate-400 hover:text-slate-700">
                      {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Confirmar Contraseña</label>
                  <div className="relative">
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-slate-900 transition-colors pr-10"
                      placeholder="Repite la contraseña"
                    />
                    <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)} className="absolute right-3 top-3 text-slate-400 hover:text-slate-700">
                      {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowChangePassModal(false); setPendingUser(null); setNewPassword(''); setConfirmPassword(''); setChangeError(''); }}
                    className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl text-xs transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="w-2/3 bg-slate-950 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-xs transition-all shadow-sm flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    <Lock size={14} /> Guardar y Continuar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};