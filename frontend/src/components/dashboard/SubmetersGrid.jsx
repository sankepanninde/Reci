import React from 'react';
import GlassCard from '../common/GlassCard';
import {
  formatCOP,
  getPropertyConsumption,
  getPropertyTrashCost,
} from '../../utils/dashboardUtils';

export default function SubmeterCard({ meter, kwhPrice, trashPerUnit, apartmentTrashBill }) {
  const consumption = getPropertyConsumption(meter);
  const energyCost = consumption * kwhPrice;
  const trashCost = getPropertyTrashCost(meter, trashPerUnit, apartmentTrashBill);
  const total = energyCost + trashCost;

  return (
    <GlassCard className="rounded-xl p-5">
      <div className="flex justify-between items-start mb-5">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg bg-surface-container border flex items-center justify-center text-on-surface-variant shadow-sm">
            <span className="material-symbols-outlined">bolt</span>
          </div>
          <div>
            <h4 className="font-semibold text-on-surface">{meter.id}</h4>
            <p className="text-[11px] text-outline uppercase tracking-widest mt-0.5">{meter.tenant}</p>
          </div>
        </div>
        <span className="material-symbols-outlined text-outline cursor-pointer">more_vert</span>
      </div>

      <div className="space-y-3 mb-6 flex-grow bg-surface-container-lowest p-4 rounded-lg border border-outline-variant/20 shadow-sm">
        <div className="flex justify-between items-baseline border-b border-outline-variant/20 pb-3">
          <span className="text-xs text-outline uppercase tracking-wider">Lectura Anterior</span>
          <span className="text-sm font-medium text-on-surface-variant">{meter.prev || 0} kWh</span>
        </div>
        <div className="flex justify-between items-baseline border-b border-outline-variant/20 pb-3">
          <span className="text-xs text-outline uppercase tracking-wider">Lectura Actual</span>
          <span className="text-sm font-medium text-on-surface">{meter.curr || 0} kWh</span>
        </div>
        <div className="flex justify-between items-baseline pt-2">
          <span className="text-xs text-on-surface-variant font-semibold uppercase tracking-wider">Consumo</span>
          <span className="font-bold text-xl text-primary">{consumption} kWh</span>
        </div>
        <div className="flex justify-between items-baseline pt-3 border-t border-outline-variant/20 mt-1">
          <span className="text-xs text-outline">Importe Energía</span>
          <span className="text-sm font-medium text-on-surface-variant">{formatCOP(energyCost)}</span>
        </div>
        {trashCost > 0 && (
          <div className="flex justify-between items-baseline pt-3 border-t border-outline-variant/20">
            <span className="text-xs text-outline">Cobro de Aseo</span>
            <span className="text-sm font-medium text-on-surface-variant">{formatCOP(trashCost)}</span>
          </div>
        )}
        <div className="flex justify-between items-baseline pt-4 border-t border-outline-variant/30 mt-1">
          <span className="text-sm font-bold text-on-surface uppercase tracking-wider">Total a Pagar</span>
          <span className="font-bold text-2xl text-on-surface tracking-tight">{formatCOP(total)}</span>
        </div>
      </div>

      <div>
        <div className="flex justify-between text-[11px] uppercase tracking-widest font-bold mb-2">
          <span className="text-outline">Límite mensual</span>
          <span className="text-on-surface-variant">—</span>
        </div>
        <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden shadow-inner">
          <div className="h-full bg-primary rounded-full" style={{ width: '0%' }} />
        </div>
      </div>
    </GlassCard>
  );
}