// src/components/ui/FloatingActions.jsx
import React from 'react';

export default function FloatingActions({ onSend }) {
  return (
    <div className="fixed bottom-8 right-8 z-40 flex flex-col items-end gap-3">
      <div className="flex items-center gap-3">
        <div className="flex gap-2 mr-2">
          <button title="Enviar por Correo" className="w-12 h-12 glass-card rounded-lg flex items-center justify-center" aria-label="Enviar por correo">
            <span className="material-symbols-outlined">mail</span>
          </button>
          <button title="Enviar por WhatsApp" className="w-12 h-12 glass-card rounded-lg flex items-center justify-center" aria-label="Enviar por WhatsApp">
            <span className="material-symbols-outlined">chat</span>
          </button>
        </div>
        <button onClick={onSend} className="bg-electric-blue text-white px-8 py-4 rounded-lg shadow-md flex items-center gap-3">
          <span className="material-symbols-outlined">send</span>
          <span>Guardar y Enviar Informe</span>
        </button>
      </div>
    </div>
  );
}
