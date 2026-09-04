import React, { useState, useEffect } from 'react';
import { useDashboard } from '../context/DashboardContext';

export default function DashboardLayout({ children, user, onLogout, tabs }) {
  const { activeTab, setActiveTab } = useDashboard();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Generar nodos decorativos para el fondo
  useEffect(() => {
    const container = document.getElementById('node-container');
    if (!container) return;
    for (let i = 0; i < 30; i++) {
      const node = document.createElement('div');
      node.className = 'node-particle';
      node.style.top = `${Math.random() * 100}%`;
      node.style.left = `${Math.random() * 100}%`;
      node.style.width = `${Math.random() * 4 + 2}px`;
      node.style.height = `${Math.random() * 4 + 2}px`;
      node.style.animationDelay = `${Math.random() * 10}s`;
      container.appendChild(node);
    }
  }, []);

  const handleTabClick = (key) => {
    setActiveTab(key);
    setMobileOpen(false);
  };

  return (
    <div className="bg-background text-on-surface overflow-x-hidden min-h-screen flex flex-col md:flex-row relative">
      {/* Ambient Background */}
      <div className="fixed inset-0 z-0 bg-primary-container pointer-events-none">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(0, 240, 255, 0.1) 0%, transparent 50%)' }}></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-secondary-container/20 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-vibrant-cyan/10 rounded-full blur-[100px]"></div>
        <div className="absolute inset-0 overflow-hidden" id="node-container"></div>
      </div>

      {/* SideNavBar (Desktop) */}
      <nav className="hidden lg:flex flex-col h-screen w-64 sticky top-0 bg-surface-container-lowest text-vibrant-cyan font-medium border-r border-glass-stroke shadow-2xl p-4 z-50">
        <div className="mb-8 flex items-center gap-4">
          <img
            className="w-10 h-10 rounded-lg object-cover border border-glass-stroke"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuD5NnHXYpfjnM1zRWW2Q2F9XT8_cshFGR6uZWhhOOcAel9LloWyGcJw3yIVoFvom9vVw-Tbwq3SuADnLrtfmFWuyHiOJqoUbfGGwiRUuk-JKt1lZX7Ijnca93CMqDmJvNB3t6ofDPV9s4Wh0OVihrKdFVBQ7G_zq6XWVTztDB3NBSYDNF7lNdRS7mKCDwVIXsAve4wSivMNABwbBZJAxp88BPJSC9fK5OF62moa25smmJ52FzxHErM"
            alt="Logo"
          />
          <div>
            <h1 className="text-lg font-bold tracking-tighter text-vibrant-cyan">Bap Inmobiliaria</h1>
            <p className="text-sm text-on-surface-variant">Admin Portal</p>
          </div>
        </div>

        <div className="flex-1 space-y-2">
          {tabs?.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => handleTabClick(tab.key)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all active:scale-95 ${
                  isActive
                    ? 'text-vibrant-cyan bg-secondary-container/20'
                    : 'text-on-surface-variant hover:bg-glass-fill hover:text-vibrant-cyan'
                }`}
              >
                <span className={`material-symbols-outlined ${isActive ? 'fill' : ''}`}>
                  <Icon size={18} />
                </span>
                {tab.label}
              </button>
            );
          })}
        </div>

        <button className="mt-auto w-full bg-secondary-container text-on-secondary-container font-medium py-3 rounded-lg hover:shadow-[0_0_20px_rgba(0,240,255,0.3)] transition-all flex items-center justify-center gap-2">
          <span className="material-symbols-outlined">add</span>
          Nueva Propiedad
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen relative z-10 w-full">
        {/* TopNavBar */}
        <header className="sticky top-0 z-40 bg-glass-fill backdrop-blur-xl border-b border-glass-stroke shadow-sm flex justify-between items-center px-4 py-4 w-full">
          <div className="flex items-center gap-4 lg:hidden">
            <button onClick={() => setMobileOpen(true)} className="p-2 text-on-surface-variant">
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h1 className="text-lg font-bold tracking-tighter text-vibrant-cyan">Bap Inmobiliaria</h1>
          </div>

          {/* Search Bar */}
          <div className="hidden lg:flex items-center bg-midnight-slate border border-glass-stroke rounded-lg px-4 py-2 w-96 focus-within:border-vibrant-cyan focus-within:shadow-[0_0_15px_rgba(0,240,255,0.2)] transition-all">
            <span className="material-symbols-outlined text-on-surface-variant mr-2">search</span>
            <input
              className="bg-transparent border-none outline-none text-on-surface w-full placeholder-on-surface-variant text-sm focus:ring-0"
              placeholder="Buscar propiedades, inquilinos..."
              type="text"
            />
          </div>

          <div className="flex items-center gap-6">
            <button className="text-on-surface-variant hover:text-vibrant-cyan transition-colors relative">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-0 right-0 w-2 h-2 bg-error rounded-full shadow-[0_0_8px_rgba(255,180,171,0.8)]"></span>
            </button>
            <button className="text-on-surface-variant hover:text-vibrant-cyan transition-colors">
              <span className="material-symbols-outlined">settings</span>
            </button>
            <button onClick={onLogout} className="text-on-surface-variant hover:text-error transition-colors">
              <span className="material-symbols-outlined">logout</span>
            </button>
            <img
              alt="Admin profile avatar"
              className="w-10 h-10 rounded-full border border-glass-stroke object-cover cursor-pointer hover:border-vibrant-cyan transition-colors"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuD3L0AJME7aDB_dBXZ-eEgPjfBniJa8AY4bDMJQ-jXPe7DLetkPomQw962eVLSmm7liF1Ah4LUNN-KbtYOmoev92rKVBT0oPHZzHLRruW-vxmX52LP7NDtrwA-zRzPwTXiKJkAoqGobEAoKMFK0vSXgrW6lZhonwEGRG_asb9dWQ8P5MvuE1K2YmE59H-FV8wtjysqnJbGfqyFDZBlqy9zMqQqFFoC_-zbqWpuaY7it_R9bayJKs_w"
            />
          </div>
        </header>

        {/* Contenido dinámico */}
        <div className="flex-1 p-4 lg:p-8 space-y-4">
          {children}
        </div>

        {/* BottomNavBar (Mobile) */}
        <nav className="lg:hidden fixed bottom-0 left-0 w-full z-50 bg-surface-container/80 backdrop-blur-2xl border-t border-glass-stroke shadow-[0px_-4px_20px_rgba(0,0,0,0.4)] flex justify-around items-center px-4 py-2 rounded-t-xl">
          {tabs?.slice(0, 4).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => handleTabClick(tab.key)}
                className={`flex flex-col items-center justify-center p-2 rounded-lg transition-transform active:scale-90 ${
                  isActive ? 'text-vibrant-cyan font-bold scale-110' : 'text-on-surface-variant opacity-70'
                }`}
              >
                <span className={`material-symbols-outlined ${isActive ? 'fill' : ''}`}>
                  <Icon size={20} />
                </span>
                <span className="text-[10px] mt-1">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </main>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 bg-surface-container-lowest p-4 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-vibrant-cyan">Menú</h2>
              <button onClick={() => setMobileOpen(false)} className="p-2 text-on-surface-variant">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            {tabs?.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => handleTabClick(tab.key)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 ${
                    isActive
                      ? 'text-vibrant-cyan bg-secondary-container/20'
                      : 'text-on-surface-variant hover:bg-glass-fill'
                  }`}
                >
                  <span className={`material-symbols-outlined ${isActive ? 'fill' : ''}`}>
                    <Icon size={18} />
                  </span>
                  {tab.label}
                </button>
              );
            })}
            <button onClick={onLogout} className="mt-auto flex items-center gap-3 px-4 py-3 text-error">
              <span className="material-symbols-outlined">logout</span>
              Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}