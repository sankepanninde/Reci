import React, { useState } from 'react';
import GlassCard from '../common/GlassCard';

// Tokens disponibles para insertar en los mensajes
const TOKENS = [
  '{Nombre_Arrendatario}',
  '{Consumo_Total}',
  '{Importe_Total}',
  '{Fecha_Corte}',
];

export default function MessageEditor() {
  // Mensaje por defecto para WhatsApp (usa Nombre_Arrendatario)
  const [whatsapp, setWhatsapp] = useState(
    'Hola {Nombre_Arrendatario}, el consumo registrado para el periodo {Fecha_Corte} es de {Consumo_Total} kWh. El importe total a pagar es {Importe_Total}.'
  );
  // Mensaje por defecto para correo
  const [emailBody, setEmailBody] = useState(
    'Estimado/a {Nombre_Arrendatario},\n\nLe informamos que el reporte de consumo eléctrico para {Fecha_Corte} ya está disponible.\n\nConsumo: {Consumo_Total} kWh\nTotal a Pagar: {Importe_Total}\n\nSaludos,\nLumina Energy'
  );

  // Datos de ejemplo para la vista previa
  const sample = {
    Nombre_Arrendatario: 'Comercio Alpha',
    Consumo_Total: '250',
    Importe_Total: '$72.500',
    Fecha_Corte: 'Octubre 2026',
  };

  // Reemplaza los tokens en la plantilla con los valores de ejemplo
  function renderTemplate(template) {
    return template.replace(/\{[A-Za-z_]+\}/g, (m) => sample[m.replace(/[{}]/g, '')] ?? m);
  }

  return (
    <GlassCard className="rounded-xl p-8 md:p-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Editor */}
        <div>
          <label className="block text-lg font-semibold mb-3">Mensaje de WhatsApp</label>
          <textarea
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            className="w-full p-5 rounded-lg min-h-[170px] bg-surface border border-outline-variant/50 focus:ring-1 focus:ring-primary text-lg text-on-surface placeholder:text-outline"
          />
          <label className="block text-lg font-semibold mt-6 mb-3">Cuerpo del Correo</label>
          <textarea
            value={emailBody}
            onChange={(e) => setEmailBody(e.target.value)}
            className="w-full p-5 rounded-lg min-h-[210px] bg-surface border border-outline-variant/50 focus:ring-1 focus:ring-primary text-lg text-on-surface placeholder:text-outline"
          />
          <div className="flex flex-wrap gap-2 pt-3">
            {TOKENS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => navigator.clipboard?.writeText(t)}
                className="px-4 py-2 bg-surface-container text-primary text-base font-mono rounded-md border border-outline-variant/30 cursor-pointer hover:border-primary/50 hover:bg-surface-container-high transition-colors"
                title="Copiar token"
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Vista previa */}
        <div className="bg-surface rounded-xl p-6 border border-outline-variant/30">
          <h3 className="text-base font-bold text-outline uppercase mb-4">Vista Previa</h3>
          <div className="space-y-5">
            <div className="bg-surface-container-lowest p-5 rounded-lg border border-outline-variant/30 relative overflow-hidden shadow-sm">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#25D366]"></div>
              <p className="text-lg text-[#25D366] mb-2 font-bold uppercase">WhatsApp</p>
              <p className="text-lg text-on-surface-variant leading-relaxed">{renderTemplate(whatsapp)}</p>
            </div>
            <div className="bg-surface-container-lowest p-5 rounded-lg border border-outline-variant/30 relative overflow-hidden shadow-sm">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
              <p className="text-lg text-primary mb-2 font-bold uppercase">Correo</p>
              <p className="text-lg text-on-surface-variant whitespace-pre-line">{renderTemplate(emailBody)}</p>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}