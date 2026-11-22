import React from 'react';
import { Waves, UserCheck, Shield, ChevronDown } from 'lucide-react';

export default function Navbar({ currentUser, onSwitchRole, availableRoles }) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-ocean-700 to-marine-500 flex items-center justify-center text-white shadow-md shadow-ocean-500/20">
            <Waves className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-xl tracking-tight text-ocean-950">BlueEconomy<span className="text-ocean-600">.AI</span></span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-ocean-100 text-ocean-700 border border-ocean-200">v1.0 MVP</span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">Coastal Economic Intelligence & Empowerment Platform</p>
          </div>
        </div>

        {/* User & Role Switcher */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <span className="text-slate-500 px-2 font-medium hidden md:inline">Simulasi Role:</span>
            <select
              value={currentUser?.role || "Nelayan"}
              onChange={(e) => onSwitchRole(e.target.value)}
              className="bg-white text-slate-800 font-semibold px-2.5 py-1 rounded-md border border-slate-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-ocean-500 cursor-pointer"
            >
              {availableRoles.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-3 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-ocean-600 text-white flex items-center justify-center font-bold text-sm shadow">
              {currentUser?.name ? currentUser.name.charAt(0) : "U"}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-slate-800 leading-tight">{currentUser?.name || "Pengguna"}</p>
              <span className="inline-block text-[10px] font-medium text-marine-600 bg-marine-50 px-1.5 py-0.2 rounded border border-marine-200">
                {currentUser?.role || "Nelayan"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
