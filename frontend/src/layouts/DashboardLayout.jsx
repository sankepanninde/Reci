import React, { useState } from 'react';
import { useDashboard } from '../context/DashboardContext';

const ADMIN_SECTION = ['units', 'tenants', 'maintenance', 'proofs'];

export default function DashboardLayout({ children, user, onLogout, tabs }) {
  const { activeTab, setActiveTab } = useDashboard();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const userInitial = (user?.name || user?.email || 'A').charAt(0).toUpperCase();
  const userName = user?.name || 'Administrador';
  const userRole = user?.role === 'admin' ? 'Administradora' : 'Usuario';
  const activeTabLabel = tabs?.find(t => t.key === activeTab)?.label || 'Dashboard';

  const platformTabs = tabs?.filter(t => !ADMIN_SECTION.includes(t.key)) || [];
  const adminTabs = tabs?.filter(t => ADMIN_SECTION.includes(t.key)) || [];

  const handleTabClick = (key) => {
    setActiveTab(key);
    setMobileOpen(false);
  };

  const sidebarWidth = collapsed ? 'w-20' : 'w-[264px]';

  const renderNavItem = (tab, isMobile = false) => {
  const isActive = activeTab === tab.key;
  if (collapsed && !isMobile) {
    return (
      <button
        key={tab.key}
        onClick={() => handleTabClick(tab.key)}
        title={tab.label}
        className={`w-10 h-10 mx-auto rounded-lg flex items-center justify-center transition-colors ${
          isActive
            ? 'bg-volt-surface-high text-volt-primary'
            : 'text-volt-outline hover:text-volt-primary hover:bg-volt-surface-mid'
        }`}
      >
        <span
          className="material-symbols-outlined text-[18px]"
          style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
        >
          {tab.icon}
        </span>
      </button>
    );
  }
  return (
    <button
      key={tab.key}
      onClick={() => handleTabClick(tab.key)}
      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors text-volt-label-md font-medium ${
        isActive
          ? 'bg-volt-surface-high text-volt-primary'
          : 'text-volt-ink-mute hover:text-volt-primary hover:bg-volt-surface-mid'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span
          className={`material-symbols-outlined text-[18px] shrink-0 ${isActive ? 'text-volt-primary' : 'text-volt-outline'}`}
          style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
        >
          {tab.icon}
        </span>
        <span className="truncate">{tab.label}</span>
      </div>
      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-volt-green shrink-0"></span>}
    </button>
  );
};

  return (
    <div className="flex h-screen bg-volt-bg text-volt-ink font-volt antialiased overflow-hidden">
      {/* ============ SIDEBAR DESKTOP ============ */}
      <aside className={`hidden lg:flex shrink-0 h-screen bg-volt-surface-low border-r border-volt-rule-soft flex-col justify-between select-none z-20 transition-all duration-200 ${sidebarWidth}`}>
        <div className="flex flex-col h-full overflow-hidden">
          {/* Workspace selector */}
          <div className={`${collapsed ? 'p-2' : 'p-4'} border-b border-volt-rule-soft`}>
            <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} p-1 rounded-lg hover:bg-volt-surface-mid cursor-pointer transition-colors`}>
              <div className={`flex items-center ${collapsed ? '' : 'gap-2.5'}`}>
                <div className="w-8 h-8 rounded-lg bg-volt-primary text-volt-white flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[19px]">domain</span>
                </div>
                {!collapsed && (
                  <div className="flex flex-col text-left min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-[13.5px] font-semibold text-volt-primary leading-tight truncate">Bap Inmobiliaria</span>
                      <span className="material-symbols-outlined text-[16px] text-volt-outline shrink-0">unfold_more</span>
                    </div>
                    <span className="text-[11px] text-volt-outline font-medium truncate">Panel de Administración</span>
                  </div>
                )}
              </div>
              {!collapsed && <span className="w-2 h-2 rounded-full bg-volt-green shrink-0"></span>}
            </div>
          </div>

          {/* Navigation */}
          <div className={`flex-1 overflow-y-auto custom-scrollbar ${collapsed ? 'px-2 py-3 space-y-4' : 'px-3 py-3.5 space-y-5'}`}>
            {/* PLATAFORMA */}
            <nav className={collapsed ? 'space-y-1.5 flex flex-col items-center' : 'space-y-0.5'}>
              {!collapsed && (
                <div className="px-2 pb-1.5 text-[10px] uppercase tracking-wider text-volt-outline font-semibold">
                  Plataforma
                </div>
              )}
              {platformTabs.map(tab => renderNavItem(tab))}
            </nav>

            {/* DIVIDER */}
            {collapsed ? (
              <div className="w-7 h-px bg-volt-rule-soft mx-auto"></div>
            ) : (
              <div className="mx-2 h-px bg-volt-rule-soft"></div>
            )}

            {/* ADMINISTRACIÓN */}
            <nav className={collapsed ? 'space-y-1.5 flex flex-col items-center' : 'space-y-0.5'}>
              {!collapsed && (
                <div className="px-2 pb-1.5 text-[10px] uppercase tracking-wider text-volt-outline font-semibold">
                  Administración
                </div>
              )}
              {adminTabs.map(tab => renderNavItem(tab))}
            </nav>
          </div>
        </div>

        {/* Bottom: config + profile + collapse */}
        <div className={`border-t border-volt-rule-soft bg-volt-surface-low ${collapsed ? 'p-2 space-y-2' : 'p-3 space-y-2'}`}>
          <button
            title={collapsed ? 'Configuración' : undefined}
            className={`flex items-center ${collapsed ? 'justify-center w-10 h-10 mx-auto' : 'gap-2.5 px-2.5 py-1.5 w-full'} rounded-lg text-volt-ink-mute hover:text-volt-primary hover:bg-volt-surface-mid transition-colors text-volt-label-md font-medium`}
          >
            <span className="material-symbols-outlined text-[18px] text-volt-outline shrink-0">tune</span>
            {!collapsed && <span>Tarifas & Configuración</span>}
          </button>

          {!collapsed ? (
            <div className="pt-1 flex items-center justify-between px-2 py-1">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-volt-green to-volt-amber flex items-center justify-center text-volt-white font-semibold text-[12.5px] shrink-0">
                  {userInitial}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[12.5px] font-semibold text-volt-primary truncate">{userName}</span>
                  <span className="text-[10.5px] text-volt-outline truncate">{userRole}</span>
                </div>
              </div>
              <button
                onClick={() => setCollapsed(true)}
                className="text-volt-outline hover:text-volt-primary p-1 rounded hover:bg-volt-surface-mid transition-colors"
                title="Colapsar"
              >
                <span className="material-symbols-outlined text-[18px]">keyboard_double_arrow_left</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1 pt-1">
              <div
                className="w-8 h-8 rounded-full bg-gradient-to-br from-volt-green to-volt-amber flex items-center justify-center text-volt-white font-semibold text-[12.5px] cursor-pointer"
                title={userName}
              >
                {userInitial}
              </div>
              <button
                onClick={() => setCollapsed(false)}
                className="text-volt-outline hover:text-volt-primary p-1 rounded hover:bg-volt-surface-mid transition-colors"
                title="Expandir"
              >
                <span className="material-symbols-outlined text-[18px]">keyboard_double_arrow_right</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ============ MAIN ============ */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-volt-bg">
        {/* Header */}
        <header className="h-14 shrink-0 px-4 lg:px-8 border-b border-volt-rule-soft bg-volt-bg/80 backdrop-blur flex items-center justify-between z-10">
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-1.5 text-volt-ink-mute hover:text-volt-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">menu</span>
            </button>

            {/* Breadcrumb */}
            <div className="hidden sm:flex items-center gap-1.5 text-volt-outline text-[13px]">
              <span className="hover:text-volt-primary cursor-pointer transition-colors">Bap Inmobiliaria</span>
              <span className="text-volt-outline/50">/</span>
              <span className="text-volt-primary font-medium truncate">{activeTabLabel}</span>
            </div>

            <div className="hidden md:block h-4 w-px bg-volt-rule-soft"></div>

            {/* Search */}
            <button className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-md bg-volt-surface-mid text-volt-outline hover:text-volt-primary border border-volt-rule-soft text-[12.5px] font-medium transition-all">
              <span className="material-symbols-outlined text-[16px]">search</span>
              <span>Buscar propiedad, recibo o inquilino...</span>
              <kbd className="ml-2 font-mono text-[10px] px-1.5 py-0.5 bg-volt-white rounded border border-volt-rule-soft text-volt-outline">
                ⌘K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-2 lg:gap-3">
            {/* Cycle selector */}
            <button className="hidden lg:flex items-center gap-2 bg-volt-white border border-volt-rule-soft px-3 py-1.5 rounded-lg text-volt-primary text-[12.5px] font-medium shadow-volt-subtle hover:bg-volt-surface-low transition-colors">
              <span className="material-symbols-outlined text-[16px] text-volt-outline">calendar_month</span>
              <span>Octubre 2024</span>
              <span className="text-volt-outline font-normal text-[11px]">· Vence 15 Nov</span>
              <span className="material-symbols-outlined text-[15px] text-volt-outline ml-1">arrow_drop_down</span>
            </button>

            {/* Notifications */}
            <button className="w-8 h-8 rounded-lg flex items-center justify-center text-volt-outline hover:text-volt-primary hover:bg-volt-surface-mid transition-colors relative">
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-volt-amber"></span>
            </button>

            {/* CTA Registrar Lectura */}
            <button className="hidden lg:flex items-center gap-1.5 bg-volt-primary text-volt-white hover:bg-volt-primary-soft transition-all px-3.5 py-1.5 rounded-lg text-[13px] font-medium shadow-volt-subtle active:scale-[0.98]">
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Registrar Lectura</span>
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-[1360px] mx-auto w-full px-4 lg:px-8 py-6 lg:py-7">
            {children}
          </div>
        </div>
      </main>

      {/* ============ MOBILE DRAWER ============ */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-volt-inverse/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 bg-volt-surface-low border-r border-volt-rule-soft flex flex-col animate-slideIn">
            <div className="p-4 border-b border-volt-rule-soft flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-volt-primary text-volt-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">domain</span>
                </div>
                <span className="text-[17px] font-semibold text-volt-primary">Bap Inmobiliaria</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="p-1.5 text-volt-outline hover:text-volt-primary transition-colors">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3.5 space-y-5">
              <nav className="space-y-0.5">
                <div className="px-2 pb-1.5 text-[10px] uppercase tracking-wider text-volt-outline font-semibold">Plataforma</div>
                {platformTabs.map(tab => renderNavItem(tab, true))}
              </nav>
              <div className="mx-2 h-px bg-volt-rule-soft"></div>
              <nav className="space-y-0.5">
                <div className="px-2 pb-1.5 text-[10px] uppercase tracking-wider text-volt-outline font-semibold">Administración</div>
                {adminTabs.map(tab => renderNavItem(tab, true))}
              </nav>
            </div>

            <div className="p-3 border-t border-volt-rule-soft">
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-volt-error hover:bg-volt-error-soft transition-colors text-[13px] font-medium"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                <span>Cerrar sesión</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}