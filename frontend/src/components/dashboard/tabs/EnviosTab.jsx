import React, { useState, useEffect } from 'react';
import { Smartphone, Mail, Plus, Save, X } from 'lucide-react';
import api from '../../../utils/api';

export default function EnviosTab() {
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [showVariables, setShowVariables] = useState(false);
  const [saveState, setSaveState] = useState('idle'); // idle | loading | saved
  const [testEmail, setTestEmail] = useState('admin@bap.com');
  const [testing, setTesting] = useState(false);
  const [whatsappTemplate, setWhatsappTemplate] = useState(
    localStorage.getItem('bap_whatsapp_template') ||
    'Hola {nombre_arrendatario}, tu recibo de {nombre_local} por {importe_total} está disponible.'
  );
  const [emailTemplate, setEmailTemplate] = useState(
    localStorage.getItem('bap_email_template') ||
    'Hola {nombre_arrendatario},\n\nTu recibo de {nombre_local} por el período {fecha_corte} ya está disponible.\n\nFecha límite de pago: {fecha_limite}\n\nConsumo: {consumo_total} kWh\nTotal a pagar: {importe_total}\n\nPara más detalles, ingresa a: {url_plataforma}\n\nSaludos,\nBap Inmobiliaria'
  );

  useEffect(() => {
    localStorage.setItem('bap_whatsapp_template', whatsappTemplate);
  }, [whatsappTemplate]);

  useEffect(() => {
    localStorage.setItem('bap_email_template', emailTemplate);
  }, [emailTemplate]);

  const insertVariable = (variable) => {
    // Insertar en emailTemplate (puedes ajustar para insertar en el campo activo)
    setEmailTemplate(prev => prev + ` ${variable}`);
    setShowVariables(false);
  };

  const handleSave = () => {
    setSaveState('loading');
    setTimeout(() => {
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2000);
    }, 1500);
  };

  const handleTestEmail = async () => {
  setTesting(true);
  try {
    await api.post('/bills/test-email', {
      to: testEmail,
      subject: 'Nuevo recibo de luz disponible para pago',
      template: emailTemplate,
    });
    alert('Correo de prueba enviado');
  } catch (err) {
    alert('Error al enviar correo de prueba');
  } finally {
    setTesting(false);
  }
};
  const recentLogs = [
    { recipient: 'Maria Rodriguez (Apt 302)', channel: 'WhatsApp', status: 'Delivered', time: 'Today, 09:15 AM', icon: 'forum', color: 'text-[#25D366]' },
    { recipient: 'Juan Soto (House 12)', channel: 'Email', status: 'Delivered', time: 'Yesterday, 14:30 PM', icon: 'mail', color: 'text-electric-blue' },
    { recipient: 'Ana Gómez (Apt 105)', channel: 'WhatsApp', status: 'Failed', time: 'Yesterday, 10:00 AM', icon: 'forum', color: 'text-error' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-on-surface">Notification Management</h2>
        <p className="text-lg text-on-tertiary-container mt-2">Configure and preview automated messages.</p>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {/* Delivery Channels */}
          <div className="glass-panel rounded-xl p-6 shadow-[0px_20px_40px_rgba(0,5,16,0.4)]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-on-surface flex items-center gap-2">
                <Smartphone size={20} className="text-vibrant-cyan" />
                Delivery Channels
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* WhatsApp Toggle */}
              <div className="bg-midnight-slate border border-glass-stroke rounded-lg p-4 flex items-center justify-between group hover:border-vibrant-cyan/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#25D366]/10 flex items-center justify-center text-[#25D366]">
                    <span className="material-symbols-outlined">forum</span>
                  </div>
                  <div>
                    <p className="font-medium text-on-surface">WhatsApp</p>
                    <p className="text-sm text-on-tertiary-container">Instant delivery</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={whatsappEnabled}
                    onChange={() => setWhatsappEnabled(!whatsappEnabled)}
                    className="sr-only peer"
                  />
                  <div className={`w-11 h-6 bg-surface-container-highest rounded-full peer peer-checked:bg-vibrant-cyan after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all ${whatsappEnabled ? 'after:translate-x-full' : ''}`} />
                </label>
              </div>

              {/* Email Toggle */}
              <div className="bg-midnight-slate border border-glass-stroke rounded-lg p-4 flex items-center justify-between group hover:border-vibrant-cyan/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-electric-blue/10 flex items-center justify-center text-electric-blue">
                    <span className="material-symbols-outlined">mail</span>
                  </div>
                  <div>
                    <p className="font-medium text-on-surface">Email</p>
                    <p className="text-sm text-on-tertiary-container">Formal record</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailEnabled}
                    onChange={() => setEmailEnabled(!emailEnabled)}
                    className="sr-only peer"
                  />
                  <div className={`w-11 h-6 bg-surface-container-highest rounded-full peer peer-checked:bg-vibrant-cyan after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all ${emailEnabled ? 'after:translate-x-full' : ''}`} />
                </label>
              </div>
            </div>
          </div>

          {/* Message Template Editor */}
          <div className="glass-panel rounded-xl p-6 shadow-[0px_20px_40px_rgba(0,5,16,0.4)] flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4 relative">
              <h3 className="text-2xl font-semibold text-on-surface flex items-center gap-2">
                <Save size={20} className="text-vibrant-cyan" />
                Message Template Editor
              </h3>
              <div className="relative">
                <button
                  className="px-3 py-1.5 rounded bg-surface-container-highest hover:bg-surface-bright text-on-surface text-sm transition-colors border border-glass-stroke"
                  onClick={() => setShowVariables(!showVariables)}
                >
                  Insert Variable
                </button>
                {showVariables && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-surface-container-high border border-glass-stroke rounded-lg shadow-xl z-20 p-2 space-y-1">
                    {[
                      '{nombre_arrendatario}',
                      '{nombre_local}',
                      '{fecha_corte}',
                      '{fecha_limite}',
                      '{consumo_total}',
                      '{importe_total}',
                      '{url_plataforma}'
                    ].map(variable => (
                      <button
                        key={variable}
                        className="w-full text-left px-3 py-2 text-sm text-on-surface hover:bg-surface-variant rounded transition-colors"
                        onClick={() => insertVariable(variable)}
                      >
                        {variable}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {/* Plantilla WhatsApp */}
              <div>
                <label className="text-sm font-semibold text-on-surface-variant mb-2 block">Plantilla WhatsApp</label>
                <textarea
                  value={whatsappTemplate}
                  onChange={(e) => setWhatsappTemplate(e.target.value)}
                  className="w-full h-28 bg-midnight-slate border border-glass-stroke rounded-lg p-3 text-on-surface focus:outline-none focus:border-vibrant-cyan"
                />
              </div>
              {/* Plantilla Email */}
              <div>
                <label className="text-sm font-semibold text-on-surface-variant mb-2 block">Plantilla Email</label>
                <textarea
                  value={emailTemplate}
                  onChange={(e) => setEmailTemplate(e.target.value)}
                  className="w-full h-36 bg-midnight-slate border border-glass-stroke rounded-lg p-3 text-on-surface focus:outline-none focus:border-vibrant-cyan"
                />
                <p className="text-xs text-on-surface-variant mt-2">
                  Variables disponibles: {['{nombre_arrendatario}', '{nombre_local}', '{fecha_corte}', '{fecha_limite}', '{consumo_total}', '{importe_total}', '{url_plataforma}'].join(', ')}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <div className="flex gap-3">
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="correo@prueba.com"
                  className="flex-1 bg-midnight-slate border border-glass-stroke rounded-lg px-3 py-2 text-on-surface text-sm focus:outline-none focus:border-vibrant-cyan"
                />
                <button
                  onClick={handleTestEmail}
                  disabled={testing}
                  className="px-4 py-2 rounded-lg bg-vibrant-cyan text-background font-semibold hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all disabled:opacity-50"
                >
                  {testing ? 'Enviando...' : 'Probar plantilla'}
                </button>
              </div>
              <div className="flex justify-end gap-3">
                <button className="px-6 py-2 rounded-lg bg-surface-container border border-glass-stroke text-on-surface text-sm hover:bg-surface-bright transition-colors">
                  Discard Changes
                </button>
                <button
                  onClick={handleSave}
                  className="relative px-6 py-2 rounded-lg bg-secondary text-midnight-slate font-medium text-sm font-semibold hover:shadow-[0_0_20px_rgba(46,91,255,0.3)] transition-all overflow-hidden flex items-center justify-center min-w-[140px]"
                >
                  {saveState === 'loading' ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-midnight-slate border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </span>
                  ) : saveState === 'saved' ? (
                    'Saved!'
                  ) : (
                    'Save Template'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Preview */}
        <div className="lg:col-span-4">
          <div className="glass-panel rounded-xl p-6 shadow-[0px_20px_40px_rgba(0,5,16,0.4)] h-full flex flex-col">
            <div className="flex items-center gap-2 mb-6">
              <Smartphone size={18} className="text-vibrant-cyan" />
              <h3 className="text-2xl font-semibold text-on-surface">Live Preview</h3>
            </div>
            <div className="flex-1 flex items-center justify-center py-4">
              <div className="w-[280px] h-[550px] bg-background border-[8px] border-surface-container-highest rounded-[2.5rem] relative shadow-2xl overflow-hidden flex flex-col">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-surface-container-highest rounded-b-xl z-20" />
                <div className="bg-[#075E54] pt-8 pb-3 px-4 flex items-center gap-3 z-10 shadow-md">
                  <span className="material-symbols-outlined text-white text-xl">arrow_back</span>
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-sm">business</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-medium text-sm leading-tight">Bap Inmobiliaria</h4>
                    <p className="text-white/70 text-[10px] leading-tight">Business Account</p>
                  </div>
                </div>
                <div className="flex-1 bg-[#E5DDD5] relative p-4 flex flex-col justify-end overflow-hidden">
                  <div className="bg-white rounded-lg rounded-tl-none p-3 shadow-sm max-w-[90%] relative z-10 mb-2">
                    <p className="text-[13px] text-[#111B21] leading-relaxed">
                      {whatsappTemplate.split('\n').map((line, i) => (
                        <span key={i}>
                          {line}
                          <br />
                        </span>
                      ))}
                    </p>
                    <div className="text-right mt-1">
                      <span className="text-[10px] text-gray-400">10:42 AM</span>
                    </div>
                  </div>
                </div>
                <div className="bg-[#F0F0F0] p-2 flex items-center gap-2">
                  <div className="bg-white rounded-full flex-1 h-9 px-3 flex items-center">
                    <span className="text-gray-400 text-sm">Message</span>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-[#00897B] flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-sm">mic</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm text-on-tertiary-container">
                Previewing with sample data: <span className="text-vibrant-cyan">Carlos Pérez</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Delivery Logs */}
      <div className="glass-panel rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-semibold text-on-surface">Recent Delivery Logs</h3>
          <button className="text-vibrant-cyan hover:text-white transition-colors text-sm flex items-center gap-1">
            <Plus size={14} /> Simulate Log Entry
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-glass-stroke text-on-tertiary-container text-sm">
                <th className="pb-3 px-4 font-semibold">Recipient</th>
                <th className="pb-3 px-4 font-semibold">Channel</th>
                <th className="pb-3 px-4 font-semibold">Status</th>
                <th className="pb-3 px-4 font-semibold">Sent At</th>
              </tr>
            </thead>
            <tbody className="text-on-surface text-sm">
              {recentLogs.map((log, idx) => (
                <tr key={idx} className="border-b border-glass-stroke/50 hover:bg-glass-fill transition-colors">
                  <td className="py-3 px-4">{log.recipient}</td>
                  <td className="py-3 px-4 flex items-center gap-2">
                    <span className={`material-symbols-outlined text-[16px] ${log.color}`}>{log.icon}</span>
                    {log.channel}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                      log.status === 'Delivered' ? 'bg-electric-blue/20 text-vibrant-cyan' : 'bg-error/20 text-error'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-on-tertiary-container">{log.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}