import React, { useState } from 'react';
import { Send, Zap, Trash, Home, Calendar, Clock, X } from 'lucide-react';
import {
  formatCOP, getPropertyConsumption, getPropertyTrashCost,
  getPropertyTotal, MULTI_METER
} from '../../../utils/dashboardUtils';

export default function CalculatorTab({
  properties, setProperties, bills, setBills,
  kwhRate, setKwhRate, kwhInputText, setKwhInputText,
  totalTrashBill, setTotalTrashBill, trashInputText, setTrashInputText,
  apartmentTrashBill, setApartmentTrashBill, apartmentTrashInputText, setApartmentTrashInputText,
  readingStartDate, setReadingStartDate, readingEndDate, setReadingEndDate,
  globalDueDate, setGlobalDueDate, hasUnsavedChanges, setHasUnsavedChanges,
  trashUnitsCount, trashPerUnit, totalGeneralServices,
  handleSendNotifications
}) {
  const [editingMulti, setEditingMulti] = useState(null);

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

  const handleStatusChange = (id, newStatus) => {
    setProperties(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
    setBills(prev => prev.map(b => b.propertyId === id && b.status !== 'Pagado' ? { ...b, status: newStatus } : b));
  };

  const handleGlobalDueDateChange = (newDate) => {
    setGlobalDueDate(newDate);
    setProperties(prev => prev.map(p => ({ ...p, dueDate: newDate })));
    setHasUnsavedChanges(true);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn">

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Servicios</h1>
        <button
          onClick={handleSendNotifications}
          className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
        >
          Guardar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-50 rounded-2xl p-5">
          <label className="text-sm font-medium text-slate-500 flex items-center gap-2 mb-3">
            <Zap size={16} className="text-amber-500" /> Tarifa kWh
          </label>
          <input
            type="text"
            value={kwhInputText}
            onChange={handleKwhChange}
            className="w-full bg-white border-0 rounded-xl px-4 py-3 text-2xl font-bold text-slate-900 focus:ring-2 focus:ring-slate-200 outline-none transition-all"
          />
          <p className="text-sm text-slate-400 mt-2">${kwhRate.toLocaleString('es-CO')}/kWh</p>
        </div>

        <div className="bg-slate-50 rounded-2xl p-5">
          <label className="text-sm font-medium text-slate-500 flex items-center gap-2 mb-3">
            <Trash size={16} className="text-emerald-500" /> Aseo general
          </label>
          <input
            type="text"
            value={trashInputText}
            onChange={handleTrashChange}
            className="w-full bg-white border-0 rounded-xl px-4 py-3 text-2xl font-bold text-slate-900 focus:ring-2 focus:ring-slate-200 outline-none transition-all"
          />
          <p className="text-sm text-slate-400 mt-2">{trashUnitsCount} unid. · {formatCOP(trashPerUnit)} c/u</p>
        </div>

        <div className="bg-slate-50 rounded-2xl p-5">
          <label className="text-sm font-medium text-slate-500 flex items-center gap-2 mb-3">
            <Calendar size={16} className="text-slate-400" /> Período
          </label>
          <div className="flex gap-2">
            <input
              type="date"
              value={readingStartDate}
              onChange={e => { setReadingStartDate(e.target.value); setHasUnsavedChanges(true); }}
              className="flex-1 bg-white border-0 rounded-xl px-3 py-3 text-sm text-slate-700 focus:ring-2 focus:ring-slate-200 outline-none"
            />
            <input
              type="date"
              value={readingEndDate}
              onChange={e => { setReadingEndDate(e.target.value); setHasUnsavedChanges(true); }}
              className="flex-1 bg-white border-0 rounded-xl px-3 py-3 text-sm text-slate-700 focus:ring-2 focus:ring-slate-200 outline-none"
            />
          </div>
          <div className="flex items-center gap-2 mt-3">
            <Clock size={14} className="text-slate-400" />
            <input
              type="date"
              value={globalDueDate}
              onChange={e => handleGlobalDueDateChange(e.target.value)}
              className="bg-white border-0 rounded-xl px-3 py-2 text-sm text-slate-700 focus:ring-2 focus:ring-slate-200 outline-none"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-6 py-4 text-sm font-medium text-slate-400 border-b border-slate-100">
          <div className="col-span-3">Unidad</div>
          <div className="col-span-2 text-right">Anterior</div>
          <div className="col-span-2 text-right">Actual</div>
          <div className="col-span-2 text-right">Consumo</div>
          <div className="col-span-2 text-right">Total</div>
          <div className="col-span-1 text-center">Estado</div>
        </div>

        {properties.map((prop) => {
          const consumption = getPropertyConsumption(prop);
          const trashCost = getPropertyTrashCost(prop, trashPerUnit, apartmentTrashBill);
          const energyTotal = consumption * kwhRate;
          const total = energyTotal + trashCost;
          const isMulti = prop.meters === MULTI_METER;

          return (
            <div 
              key={prop.id} 
              className="grid grid-cols-12 gap-4 px-6 py-5 items-center hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
            >
              <div className="col-span-3">
                <p className="font-semibold text-slate-900">{prop.id}</p>
                <p className="text-sm text-slate-400">{prop.tenant}</p>
                {isMulti && (
                  <button
                    onClick={() => setEditingMulti(prop)}
                    className="text-xs text-indigo-600 font-medium mt-1 hover:underline"
                  >
                    Editar 3 contadores
                  </button>
                )}
              </div>

              <div className="col-span-2 text-right">
                {isMulti ? (
                  <span className="text-sm text-slate-500 font-mono">{prop.m1Prev} + {prop.m2Prev} + {prop.m3Prev}</span>
                ) : (
                  <input
                    type="number"
                    value={prop.prev ?? ''}
                    onChange={e => handleReadingChange(prop.id, 'prev', e.target.value)}
                    className="w-24 text-right bg-slate-50 rounded-lg px-3 py-2 text-sm font-mono font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-200 outline-none transition-all"
                  />
                )}
              </div>

              <div className="col-span-2 text-right">
                {isMulti ? (
                  <span className="text-sm text-slate-500 font-mono">{prop.m1Curr} + {prop.m2Curr} + {prop.m3Curr}</span>
                ) : (
                  <input
                    type="number"
                    value={prop.curr ?? ''}
                    onChange={e => handleReadingChange(prop.id, 'curr', e.target.value)}
                    className="w-24 text-right bg-slate-50 rounded-lg px-3 py-2 text-sm font-mono font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-200 outline-none transition-all"
                  />
                )}
              </div>

              <div className="col-span-2 text-right">
                <span className="text-lg font-bold text-slate-900 font-mono">{consumption}</span>
                <span className="text-sm text-slate-400 ml-1">kWh</span>
              </div>

              <div className="col-span-2 text-right">
                <p className="text-lg font-bold text-slate-900 font-mono">{formatCOP(total)}</p>
                <p className="text-xs text-slate-400">{formatCOP(energyTotal)} + {formatCOP(trashCost)}</p>
              </div>

              <div className="col-span-1 text-center">
                <button
                  onClick={() => {
                    const next = prop.status === 'Pendiente' ? 'Pagado' : prop.status === 'Pagado' ? 'Atrasado' : 'Pendiente';
                    handleStatusChange(prop.id, next);
                  }}
                  className="inline-flex items-center gap-1.5 text-sm font-medium"
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    prop.status === 'Pagado' ? 'bg-emerald-500' : 
                    prop.status === 'Atrasado' ? 'bg-rose-500' : 'bg-amber-500'
                  }`} />
                  <span className={
                    prop.status === 'Pagado' ? 'text-emerald-700' : 
                    prop.status === 'Atrasado' ? 'text-rose-700' : 'text-amber-700'
                  }>{prop.status}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between bg-slate-900 text-white rounded-2xl px-8 py-5">
        <div className="flex items-center gap-8">
          <div>
            <p className="text-xs text-slate-400 mb-1">Consumo total</p>
            <p className="text-xl font-bold font-mono">
              {properties.reduce((a, p) => a + getPropertyConsumption(p), 0)} kWh
            </p>
          </div>
          <div className="w-px h-8 bg-slate-700" />
          <div>
            <p className="text-xs text-slate-400 mb-1">Total a cobrar</p>
            <p className="text-2xl font-extrabold font-mono">{formatCOP(totalGeneralServices)}</p>
          </div>
        </div>
        <p className="text-sm text-slate-400">{properties.length} unidades</p>
      </div>

      {editingMulti && (
        <div className="fixed inset-0 bg-slate-950/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{editingMulti.id}</h3>
                <p className="text-sm text-slate-500">{editingMulti.tenant}</p>
              </div>
              <button onClick={() => setEditingMulti(null)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              {[
                { label: 'Contador 1', prev: 'm1Prev', curr: 'm1Curr' },
                { label: 'Contador 2', prev: 'm2Prev', curr: 'm2Curr' },
                { label: 'Trifásico', prev: 'm3Prev', curr: 'm3Curr' },
              ].map(m => (
                <div key={m.label} className="bg-slate-50 rounded-xl p-4">
                  <p className="text-sm font-medium text-slate-600 mb-3">{m.label}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Anterior</label>
                      <input
                        type="number"
                        value={editingMulti[m.prev] ?? 0}
                        onChange={e => handleReadingChange(editingMulti.id, m.prev, e.target.value)}
                        className="w-full bg-white rounded-lg px-3 py-2 text-sm font-mono font-semibold text-right focus:ring-2 focus:ring-slate-200 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1 block">Actual</label>
                      <input
                        type="number"
                        value={editingMulti[m.curr] ?? 0}
                        onChange={e => handleReadingChange(editingMulti.id, m.curr, e.target.value)}
                        className="w-full bg-white rounded-lg px-3 py-2 text-sm font-mono font-semibold text-right focus:ring-2 focus:ring-slate-200 outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm font-mono font-medium text-slate-600">
                Total: {formatCOP(getPropertyTotal(editingMulti, kwhRate, trashPerUnit, apartmentTrashBill))}
              </p>
              <button
                onClick={() => setEditingMulti(null)}
                className="bg-slate-900 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}