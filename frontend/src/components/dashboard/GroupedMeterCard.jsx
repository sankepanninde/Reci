import React from 'react';
import GlassCard from '../common/GlassCard';
import {
  formatCOP,
  getPropertyConsumption,
  getPropertyTrashCost,
} from '../../utils/dashboardUtils';

export default function GroupedMeterCard({ meter, kwhPrice, trashPerUnit, apartmentTrashBill, onReadingChange }) {
  const consumption = getPropertyConsumption(meter);
  const energyCost = consumption * kwhPrice;
  const trashCost = getPropertyTrashCost(meter, trashPerUnit, apartmentTrashBill);
  const total = energyCost + trashCost;

  const subMeters = [
    { name: 'Contador 1', prevField: 'm1Prev', currField: 'm1Curr', prev: meter.m1Prev, curr: meter.m1Curr },
    { name: 'Contador 2', prevField: 'm2Prev', currField: 'm2Curr', prev: meter.m2Prev, curr: meter.m2Curr },
    { name: 'Trifásico', prevField: 'm3Prev', currField: 'm3Curr', prev: meter.m3Prev, curr: meter.m3Curr },
  ];

  return (
    <GlassCard className="rounded-2xl p-5 flex flex-col">
      <div className="flex justify-between items-start mb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-surface-container border border-outline-variant/30 flex items-center justify-center text-on-surface-variant shadow-sm">
            <span className="material-symbols-outlined text-2xl">electric_bolt</span>
          </div>
          <div>
            <h4 className="text-xl font-bold text-on-surface tracking-tight">{meter.id}</h4>
            <p className="text-base text-outline mt-1">Suma de 3 contadores</p>
          </div>
        </div>
        <span className="material-symbols-outlined text-outline cursor-pointer text-2xl">more_vert</span>
      </div>

      <div className="flex-grow mb-4">
        {subMeters.map((sm, idx) => (
          <div key={idx} className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/20 mb-3 shadow-sm">
            <h5 className="text-lg font-bold text-on-surface mb-3">{sm.name}</h5>
            <div className="flex justify-between items-center border-b border-outline-variant/20 pb-2 mb-2">
              <span className="text-base font-medium text-outline">Lectura Anterior</span>
              <input
                type="number"
                value={sm.prev ?? 0}
                onChange={(e) => {
                  e.stopPropagation();
                  onReadingChange && onReadingChange(meter.id, sm.prevField, e.target.value);
                }}
                onClick={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
                className="w-24 text-right text-lg font-bold text-on-surface-variant bg-transparent border-none p-0 focus:ring-0 focus:outline-none"
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-base font-medium text-outline">Lectura Actual</span>
              <input
                type="number"
                value={sm.curr ?? 0}
                onChange={(e) => {
                  e.stopPropagation();
                  onReadingChange && onReadingChange(meter.id, sm.currField, e.target.value);
                }}
                onClick={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
                className="w-24 text-right text-lg font-bold text-on-surface bg-transparent border-none p-0 focus:ring-0 focus:outline-none"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/20 shadow-sm">
        <div className="flex justify-between items-baseline">
          <span className="text-base font-semibold text-on-surface-variant">Consumo Total</span>
          <span className="text-2xl font-extrabold text-primary tracking-tight">{consumption} kWh</span>
        </div>
        <div className="flex justify-between items-baseline pt-3 border-t border-outline-variant/20">
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

      <div className="mt-5">
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