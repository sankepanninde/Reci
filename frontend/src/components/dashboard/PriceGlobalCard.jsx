// src/components/dashboard/PriceGlobalCard.jsx
import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import GlassCard from '../common/GlassCard';

export default function PriceGlobalCard({ onChange }) {
  const [price, setPrice] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await api.get('/settings/global-price');
        if (!mounted) return;
        setPrice(res.data?.price ?? '');
      } catch (e) {
        console.error(e);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (price === '') return;
    const id = setTimeout(async () => {
      setSaving(true);
      try {
        await api.put('/settings/global-price', { price: Number(price) });
        if (onChange) onChange(Number(price));
      } catch (e) {
        console.error(e);
      } finally {
        setSaving(false);
      }
    }, 700);
    return () => clearTimeout(id);
  }, [price, onChange]);

  return (
    <GlassCard className="rounded-xl p-5 border-l-4 border-l-emerald-green flex items-center justify-between md:col-span-2 bg-emerald-green/5">
      <div className="flex items-center gap-5">
        <div className="w-12 h-12 rounded-lg bg-emerald-green/10 border flex items-center justify-center text-emerald-green">
          <span className="material-symbols-outlined">payments</span>
        </div>
        <div>
          <p className="text-[11px] text-emerald-green uppercase tracking-widest font-bold mb-0.5">Precio Global kWh</p>
          <p className="text-sm text-on-surface-variant">Afecta el cálculo de importe de todos los subcontadores</p>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-surface px-5 py-2.5 rounded-lg border shadow-sm">
        <span className="text-xl font-bold text-emerald-green">$</span>
        <input
          id="global-kwh-price"
          type="number"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
          className="w-20 bg-transparent border-none p-0 text-xl font-bold text-emerald-green text-right focus:outline-none"
          aria-label="Precio global por kWh"
        />
        <span className="text-sm text-outline font-medium ml-1">/ kWh</span>
        {saving && <span className="text-xs text-outline ml-3">Guardando…</span>}
      </div>
    </GlassCard>
  );
}
