import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import AiDetectionView from './components/AiDetectionView';
import CatchView from './components/CatchView';
import PriceView from './components/PriceView';
import ProfitView from './components/ProfitView';
import MarketRecommendationView from './components/MarketRecommendationView';
import GisView from './components/GisView';
import UmkmView from './components/UmkmView';
import SpeciesCatalogModal from './components/SpeciesCatalogModal';
import { ROLE_TABS, DEMO_LOGIN } from './config/roles';
import { setAuthToken } from './lib/api';

const ROLES = ['Nelayan', 'UMKM', 'Admin', 'Pengelola Pasar', 'Stakeholder'];

const USERS_BY_ROLE = {
  Nelayan: { name: 'Pak Budi Santoso', email: 'nelayan@blueeconomy.id', role: 'Nelayan' },
  UMKM: { name: 'Ibu Siti Aminah', email: 'umkm@blueeconomy.id', role: 'UMKM' },
  Admin: { name: 'Admin Kelautan', email: 'admin@blueeconomy.id', role: 'Admin' },
  'Pengelola Pasar': { name: 'Pengelola Pasar Muara Baru', email: 'pasar@blueeconomy.id', role: 'Pengelola Pasar' },
  Stakeholder: { name: 'Dinas Kelautan & Perikanan', email: 'stakeholder@blueeconomy.id', role: 'Stakeholder' }
};

// Login akun demo agar backend tahu siapa penggunanya (mengambil token).
async function loginAs(role) {
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: DEMO_LOGIN[role], password: 'password123' })
    });
    const data = await res.json();
    if (res.ok && data.token) setAuthToken(data.token);
  } catch (err) {
    console.error('Login demo gagal:', err);
  }
}

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState(USERS_BY_ROLE['Nelayan']);

  useEffect(() => {
    loginAs('Nelayan');
  }, []);

  const handleSwitchRole = async (newRole) => {
    if (!USERS_BY_ROLE[newRole]) return;
    await loginAs(newRole);
    setCurrentUser(USERS_BY_ROLE[newRole]);
    setCurrentTab('dashboard');
  };

  const handleTestSpecies = () => {
    setCurrentTab('ai-detection');
  };

  const allowedTabs = ROLE_TABS[currentUser.role] || ['dashboard'];
  const safeTab = allowedTabs.includes(currentTab) ? currentTab : 'dashboard';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar
        currentUser={currentUser}
        onSwitchRole={handleSwitchRole}
        availableRoles={ROLES}
      />

      <div className="flex flex-1">
        <Sidebar
          currentTab={safeTab}
          onSelectTab={setCurrentTab}
          allowedTabs={allowedTabs}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl overflow-y-auto">
          {safeTab === 'dashboard' && (
            <DashboardView onNavigate={setCurrentTab} user={currentUser} />
          )}
          {safeTab === 'ai-detection' && (
            <AiDetectionView onCatchSaved={() => setCurrentTab('catches')} />
          )}
          {safeTab === 'catches' && <CatchView />}
          {safeTab === 'prices' && <PriceView userRole={currentUser?.role} />}
          {safeTab === 'profit' && <ProfitView />}
          {safeTab === 'market-rec' && <MarketRecommendationView />}
          {safeTab === 'gis' && <GisView />}
          {safeTab === 'umkm' && <UmkmView currentUser={currentUser} />}
          {safeTab === 'species' && (
            <SpeciesCatalogModal onTestSpecies={handleTestSpecies} />
          )}
        </main>
      </div>
    </div>
  );
}