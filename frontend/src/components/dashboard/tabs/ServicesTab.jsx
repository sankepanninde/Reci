import React from 'react';
import { formatCOP, getPropertyConsumption, getPropertyTrashCost, MULTI_METER } from '../../../utils/dashboardUtils';

export default function ServicesTab({
  properties,
  setProperties,
  kwhRate,
  setKwhRate,
  kwhInputText,
  setKwhInputText,
  totalTrashBill,
  setTotalTrashBill,
  trashInputText,
  setTrashInputText,
  apartmentTrashBill,
  setApartmentTrashBill,
  apartmentTrashInputText,
  setApartmentTrashInputText,
  readingStartDate,
  setReadingStartDate,
  readingEndDate,
  setReadingEndDate,
  globalDueDate,
  setGlobalDueDate,
  hasUnsavedChanges,
  setHasUnsavedChanges,
  trashUnitsCount,
  trashPerUnit,
  totalGeneralServices,
  handleSendNotifications,
  addToast
}) {
  const handleKwhChange = (e) => {
    const raw = e.target.value;
    const digits = raw.replace(/\D/g, '');
    if (!digits) { setKwhInputText(''); setKwhRate(0); return; }
    if (digits === '1000') { setKwhInputText('1.000'); setKwhRate(1000); return; }
    let display = '', numeric = 0;
    if (digits.length === 1) { display = '0.0' + digits; numeric = Number('0.0' + digits); }
    else if (digits.length === 2) { display = '0.' + digits; numeric = Number('0.' + digits); }
    else if (digits.length === 3) { display = digits[0] + '.' + digits.slice(1); numeric = Number(display); }
    else if (digits.length === 4) { display = digits.slice(0,2) + '.' + digits.slice(2); numeric = Number(display); }
    else { const intPart = digits.slice(0,-2); const decPart = digits.slice(-2); display = Number(intPart).toLocaleString('es-CO') + '.' + decPart; numeric = Number(intPart + '.' + decPart); }
    setKwhInputText(display); setKwhRate(numeric || 0); setHasUnsavedChanges(true);
  };

  const handleTrashChange = (e) => {
    const raw = e.target.value; const digits = raw.replace(/\D/g, ''); const num = digits === '' ? 0 : Number(digits);
    setTotalTrashBill(num); setTrashInputText(digits === '' ? '' : num.toLocaleString('es-CO')); setHasUnsavedChanges(true);
  };

  const handleApartmentTrashChange = (e) => {
    const raw = e.target.value; const digits = raw.replace(/\D/g, ''); const num = digits === '' ? 0 : Number(digits);
    setApartmentTrashBill(num); setApartmentTrashInputText(digits === '' ? '' : num.toLocaleString('es-CO')); setHasUnsavedChanges(true);
  };

  const handleReadingChange = (id, field, value) => {
    const num = value === '' ? '' : Number(value);
    setProperties(prev => prev.map(p => p.id === id ? { ...p, [field]: num } : p));
    setHasUnsavedChanges(true);
  };

  const totalConsumption = properties.reduce((a, p) => a + getPropertyConsumption(p), 0);

  return (
    <div className="space-y-8">
      {/* Header contextual */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="font-display-lg text-4xl md:text-5xl font-bold">Liquidación Mensual</h1>
          <p className="text-lg text-on-surface-variant">Ingrese los consumos para calcular los costos operativos y de aseo por unidad.</p>
        </div>
      </div>

      {/* Parámetros generales */}
      <div className="glass-panel p-6 rounded-xl ambient-shadow border-l-4 border-l-vibrant-cyan">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-on-surface-variant block mb-2">ASEO TOTAL LOCALES Y SALÓN ($)</label>
            <div className="bg-midnight-slate border border-glass-stroke rounded-lg px-4 py-3 vibrant-input transition-all flex items-center gap-3">
              <span className="material-symbols-outlined text-vibrant-cyan">cleaning_services</span>
              <input type="text" value={trashInputText} onChange={handleTrashChange} className="bg-transparent border-none outline-none w-full text-on-surface text-xl font-semibold placeholder:text-on-surface-variant focus:ring-0" placeholder="0.00" />
            </div>
            <p className="text-sm text-on-surface-variant mt-2">Este monto se divide equitativamente entre los 3 Locales y el Salón.</p>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-on-surface-variant block mb-2">ASEO INDEPENDIENTE APARTAMENTO ($)</label>
            <div className="bg-midnight-slate border border-glass-stroke rounded-lg px-4 py-3 vibrant-input transition-all flex items-center gap-3">
              <span className="material-symbols-outlined text-vibrant-cyan">apartment</span>
              <input type="text" value={apartmentTrashInputText} onChange={handleApartmentTrashChange} className="bg-transparent border-none outline-none w-full text-on-surface text-xl font-semibold placeholder:text-on-surface-variant focus:ring-0" placeholder="0.00" />
            </div>
            <p className="text-sm text-on-surface-variant mt-2">Monto fijo asignado exclusivamente a la unidad de Apartamento.</p>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-on-surface-variant block mb-2">Valor del kWh ($)</label>
            <div className="bg-midnight-slate border border-glass-stroke rounded-lg px-4 py-3 vibrant-input transition-all flex items-center gap-3">
              <span className="material-symbols-outlined text-vibrant-cyan">bolt</span>
              <input type="text" value={kwhInputText} onChange={handleKwhChange} className="bg-transparent border-none outline-none w-full text-on-surface text-xl font-semibold placeholder:text-on-surface-variant focus:ring-0" placeholder="0.00" />
            </div>
            <p className="text-sm text-on-surface-variant mt-2">Valor unitario del kWh utilizado para el cálculo de costo de energía.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-6 border-t border-glass-stroke">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-on-surface-variant block mb-2">Lectura Desde</label>
            <div className="bg-midnight-slate border border-glass-stroke rounded-lg px-3 py-1 vibrant-input flex items-center gap-2 h-12">
              <span className="material-symbols-outlined text-vibrant-cyan">calendar_today</span>
              <input type="date" value={readingStartDate} onChange={e => { setReadingStartDate(e.target.value); setHasUnsavedChanges(true); }} className="bg-transparent border-none outline-none w-full text-on-surface font-semibold focus:ring-0" />
            </div>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-on-surface-variant block mb-2">Lectura Hasta</label>
            <div className="bg-midnight-slate border border-glass-stroke rounded-lg px-3 py-1 vibrant-input flex items-center gap-2 h-12">
              <span className="material-symbols-outlined text-vibrant-cyan">calendar_today</span>
              <input type="date" value={readingEndDate} onChange={e => { setReadingEndDate(e.target.value); setHasUnsavedChanges(true); }} className="bg-transparent border-none outline-none w-full text-on-surface font-semibold focus:ring-0" />
            </div>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-on-surface-variant block mb-2">Fecha Límite de Pago</label>
            <div className="border border-glass-stroke rounded-lg px-4 py-3 vibrant-input flex items-center gap-3 h-16 bg-surface-container-high shadow-[0_0_15px_rgba(0,240,255,0.1)]">
              <span className="material-symbols-outlined text-secondary">event_repeat</span>
              <input type="date" value={globalDueDate} onChange={e => { setGlobalDueDate(e.target.value); setHasUnsavedChanges(true); }} className="bg-transparent border-none outline-none w-full text-on-surface font-semibold focus:ring-0" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-8 flex flex-col gap-4">
          {properties.map(prop => {
            const isMulti = prop.meters === MULTI_METER;
            const consumption = getPropertyConsumption(prop);
            const energyCost = consumption * kwhRate;
            const trashCost = getPropertyTrashCost(prop, trashPerUnit, apartmentTrashBill);
            const totalUnit = energyCost + trashCost;
            const unitName = prop.unit || prop.name || prop.id;
            return (
              <div key={prop.id} className="glass-panel p-6 rounded-xl ambient-shadow flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-center gap-4 min-w-[150px]">
                  <div className="w-12 h-12 rounded-lg bg-surface flex items-center justify-center border border-glass-stroke">
                    <span className="material-symbols-outlined text-on-surface">
                      {unitName.toLowerCase().includes('apartamento') ? 'apartment' : unitName.toLowerCase().includes('salón') ? 'chair' : 'storefront'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{unitName}</h3>
                    <p className="text-sm text-on-surface-variant">{prop.tenant}</p>
                    <p className="text-[10px] uppercase tracking-widest text-vibrant-cyan mt-1">
                      {unitName.toLowerCase().includes('apartamento') ? 'Aseo Independiente' : unitName.toLowerCase().includes('garaje') ? 'Sin Aseo' : 'Aplica Aseo'}
                    </p>
                  </div>
                </div>

                <div className="flex-1 w-full flex flex-col gap-4">
                  {!isMulti ? (
                    <div className="flex flex-col gap-4 w-full">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] uppercase text-on-surface-variant">Lect. Anterior (kWh)</label>
                          <div className="bg-midnight-slate border border-glass-stroke rounded-lg px-3 py-2 vibrant-input flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">history</span>
                            <input type="number" value={prop.prev ?? 0} onChange={e => handleReadingChange(prop.id, 'prev', e.target.value)} className="bg-transparent border-none outline-none w-full text-on-surface text-sm" />
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] uppercase text-on-surface-variant">Lect. Actual (kWh)</label>
                          <div className="bg-midnight-slate border border-glass-stroke rounded-lg px-3 py-2 vibrant-input flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">speed</span>
                            <input type="number" value={prop.curr ?? 0} onChange={e => handleReadingChange(prop.id, 'curr', e.target.value)} className="bg-transparent border-none outline-none w-full text-on-surface text-sm" />
                          </div>
                        </div>
                      </div>

                      {/* Bloque de totales */}
                      <div className="flex justify-end gap-6 pt-4 border-t border-glass-stroke">
                        <div className="text-right">
                          <span className="text-[10px] uppercase text-on-surface-variant block">Consumo</span>
                          <span className="text-xl font-semibold">{consumption} <span className="text-sm">kWh</span></span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] uppercase text-on-surface-variant block">Costo Energía</span>
                          <span className="text-xl font-semibold text-vibrant-cyan">{formatCOP(energyCost)}</span>
                        </div>
                        {prop.unit !== 'Garaje' && (
                          <div className="text-right">
                            <span className="text-[10px] uppercase text-on-surface-variant block">Aseo ($)</span>
                            <span className="text-xl font-semibold text-vibrant-cyan">{formatCOP(trashCost)}</span>
                          </div>
                        )}
                        <div className="text-right">
                          <span className="text-[10px] uppercase text-on-surface-variant block">Total</span>
                          <span className="text-xl font-bold text-on-surface">{formatCOP(totalUnit)}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {[0,1,2].map(idx => (
                        <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                          <div className="md:col-span-3">
                            <span className="text-sm font-semibold text-vibrant-cyan">
                              Contador {idx+1} {idx===2 ? '(Trifásico)' : '(Estándar)'}
                            </span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] uppercase text-on-surface-variant">Lect. Anterior</label>
                            <input type="number" value={prop[`m${idx+1}Prev`] ?? 0} onChange={e => handleReadingChange(prop.id, `m${idx+1}Prev`, e.target.value)} className="bg-midnight-slate border border-glass-stroke rounded-lg px-3 py-2 vibrant-input text-sm" />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] uppercase text-on-surface-variant">Lect. Actual</label>
                            <input type="number" value={prop[`m${idx+1}Curr`] ?? 0} onChange={e => handleReadingChange(prop.id, `m${idx+1}Curr`, e.target.value)} className="bg-midnight-slate border border-glass-stroke rounded-lg px-3 py-2 vibrant-input text-sm" />
                          </div>
                        </div>
                      ))}
                      <div className="flex justify-end gap-6 pt-4 border-t border-glass-stroke">
                        <div className="text-right">
                          <span className="text-[10px] uppercase text-on-surface-variant block">Consumo Total</span>
                          <span className="text-xl font-semibold">{consumption} <span className="text-sm">kWh</span></span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] uppercase text-on-surface-variant block">Costo Energía</span>
                          <span className="text-xl font-semibold text-vibrant-cyan">{formatCOP(energyCost)}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] uppercase text-on-surface-variant block">Aseo ($)</span>
                          <span className="text-xl font-semibold text-vibrant-cyan">{formatCOP(trashCost)}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] uppercase text-on-surface-variant block">Total</span>
                          <span className="text-xl font-bold text-on-surface">{formatCOP(totalUnit)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Resumen lateral */}
        <div className="md:col-span-4 flex flex-col gap-4">
          <div className="glass-panel p-6 rounded-xl ambient-shadow sticky top-24">
            <h2 className="text-2xl mb-6 border-b border-glass-stroke pb-4">Resumen de Liquidación</h2>
            <div className="flex flex-col gap-4 mb-8">
              <div className="flex justify-between items-center bg-surface-container-low p-3 rounded-lg">
                <div>
                  <span className="text-sm text-on-surface-variant block">Contador General</span>
                  <span className="text-2xl font-semibold">{totalConsumption} kWh</span>
                </div>
                <div className="text-right">
                  <span className="text-sm text-on-surface-variant block">Suma Sub-medidores</span>
                  <span className="text-2xl font-semibold">{totalConsumption} kWh</span>
                </div>
              </div>
              <div className="flex justify-between items-center text-vibrant-cyan">
                <span className="text-sm">Diferencia</span>
                <span className="text-lg font-bold">0 kWh</span>
              </div>
              <div className="mt-4 space-y-2">
                <div className="pt-4 border-t border-glass-stroke space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-on-surface-variant">Suma Aseo Locales/Salón ({trashUnitsCount} ud)</span>
                    <span className="text-lg">{formatCOP(totalTrashBill)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-on-surface-variant">Aseo Independiente (Apartamento)</span>
                    <span className="text-lg">{formatCOP(apartmentTrashBill)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-glass-stroke/30">
                    <span className="text-sm text-on-surface-variant">Total Aseo General</span>
                    <span className="text-lg font-bold text-vibrant-cyan">{formatCOP(totalTrashBill + apartmentTrashBill)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-surface-container rounded-lg p-4 mb-6 border border-glass-stroke flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-[rgba(0,240,255,0.05)] pointer-events-none"></div>
              <span className="text-[10px] uppercase text-vibrant-cyan mb-1 z-10">Total a Pagar Estimado</span>
              <span className="text-4xl font-bold z-10">{formatCOP(totalGeneralServices)}</span>
            </div>

            <button
              onClick={handleSendNotifications}
              className="w-full bg-secondary-container text-on-secondary-container font-semibold py-3 rounded-lg hover:shadow-[0_0_20px_rgba(46,91,255,0.3)] transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">save</span>
              Guardar Liquidación
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}