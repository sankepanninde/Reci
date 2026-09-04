import React from 'react';
import GlassCard from '../common/GlassCard';
import {
  formatCOP,
  getPropertyConsumption,
  getPropertyTrashCost,
} from '../../utils/dashboardUtils';

export default function SubmeterCard({ meter, kwhPrice, trashPerUnit, apartmentTrashBill, onReadingChange }) {
  const consumption = getPropertyConsumption(meter);
  const energyCost = consumption * kwhPrice;
  const trashCost = getPropertyTrashCost(meter, trashPerUnit, apartmentTrashBill);
  const total = energyCost + trashCost;

  const handlePrevChange = (e) => {
    e.stopPropagation();
    const value = e.target.value;
    onReadingChange && onReadingChange(meter.id, 'prev', value);
  };

  const handleCurrChange = (e) => {
    e.stopPropagation();
    const value = e.target.value;
    onReadingChange && onReadingChange(meter.id, 'curr', value);
  };

  return (
    <GlassCard className="rounded-2xl p-5">
      <div className="flex justify-between items-start mb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-surface-container border border-outline-variant/30 flex items-center justify-center text-on-surface-variant shadow-sm">
            <span className="material-symbols-outlined text-2xl">bolt</span>
          </div>
          <div>
            <h4 className="text-xl font-bold text-on-surface tracking-tight">{meter.id}</h4>
            <p className="text-base text-outline mt-1">{meter.tenant}</p>
          </div>
        </div>
        <span className="material-symbols-outlined text-outline cursor-pointer text-2xl">more_vert</span>
      </div>

      <div className="space-y-4 mb-6 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/20 shadow-sm">
        <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3">
          <span className="text-base font-medium text-outline">Lectura Anterior</span>
          <input
            type="number"
            value={meter.prev ?? 0}
            onChange={handlePrevChange}
            onClick={(e) => e.stopPropagation()}
            onFocus={(e) => e.stopPropagation()}
            className="w-24 text-right text-lg font-bold text-on-surface-variant bg-transparent border-none p-0 focus:ring-0 focus:outline-none"
          />
        </div>
        <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3">
          <span className="text-base font-medium text-outline">Lectura Actual</span>
          <input
            type="number"
            value={meter.curr ?? 0}
            onChange={handleCurrChange}
            onClick={(e) => e.stopPropagation()}
            onFocus={(e) => e.stopPropagation()}
            className="w-24 text-right text-lg font-bold text-on-surface bg-transparent border-none p-0 focus:ring-0 focus:outline-none"
          />
        </div>
        <div className="flex justify-between items-baseline pt-2">
          <span className="text-base font-semibold text-on-surface-variant">Consumo</span>
          <span className="text-2xl font-extrabold text-primary tracking-tight">{consumption} kWh</span>
        </div>
        <div className="flex justify-between items-baseline pt-3 border-t border-outline-variant/20 mt-1">
          <span className="text-base text-outline">Importe Energía</span>
          <span className="text-lg font-bold text-on-surface-variant">{formatCOP(energyCost)}</span>
        </div>
        {trashCost > 0 && (
          <div className="flex justify-between items-baseline pt-3 border-t border-outline-variant/20">
            <span className="text-base text-outline">Cobro de Aseo</span>
            <span className="text-lg font-bold text-on-surface-variant">{formatCOP(trashCost)}</span>
          </div>
        )}
        <div className="flex justify-between items-baseline pt-4 border-t border-outline-variant/30 mt-1">
          <span className="text-lg font-bold text-on-surface">Total a Pagar</span>
          <span className="text-3xl font-extrabold text-on-surface tracking-tight">{formatCOP(total)}</span>
        </div>
      </div>

      <div>
        <div className="flex justify-between text-base font-semibold mb-2">
          <span className="text-outline">Límite mensual</span>
          <span className="text-on-surface-variant">—</span>
        </div>
        <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden shadow-inner">
          <div className="h-full bg-primary rounded-full" style={{ width: '0%' }} />
        </div>
      </div>
    </GlassCard>
  );
}