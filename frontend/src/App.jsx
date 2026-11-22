import React, { useState } from 'react';
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

const ROLES = ['Nelayan', 'UMKM', 'Admin', 'Pengelola Pasar', 'Stakeholder'];

const USERS_BY_ROLE = {
  Nelayan: { name: 'Pak Budi Santoso', email: 'nelayan@blueeconomy.id', role: 'Nelayan' },
  UMKM: { name: 'Ibu Siti Aminah', email: 'umkm@blueeconomy.id', role: 'UMKM' },
  Admin: { name: 'Admin Kelautan', email: 'admin@blueeconomy.id', role: 'Admin' },
  'Pengelola Pasar': { name: 'Pengelola Pasar Muara Baru', email: 'pasar@blueeconomy.id', role: 'Pengelola Pasar' },
  Stakeholder: { name: 'Dinas Kelautan & Perikanan', email: 'stakeholder@blueeconomy.id', role: 'Stakeholder' }
};

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState(USERS_BY_ROLE['Nelayan']);

  const handleSwitchRole = (newRole) => {
    if (USERS_BY_ROLE[newRole]) {
      setCurrentUser(USERS_BY_ROLE[newRole]);
    }
  };

  const handleTestSpecies = (speciesScientific) => {
    setCurrentTab('ai-detection');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar
        currentUser={currentUser}
        onSwitchRole={handleSwitchRole}
        availableRoles={ROLES}
      />

      <div className="flex flex-1">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl overflow-y-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              onNavigate={setCurrentTab}
              user={currentUser}
            />
          )}

          {currentTab === 'ai-detection' && (
            <AiDetectionView
              onCatchSaved={() => setCurrentTab('catches')}
            />
          )}

          {currentTab === 'catches' && (
            <CatchView />
          )}

          {currentTab === 'prices' && (
            <PriceView userRole={currentUser?.role} />
          )}

          {currentTab === 'profit' && (
            <ProfitView />
          )}

          {currentTab === 'market-rec' && (
            <MarketRecommendationView />
          )}

          {currentTab === 'gis' && (
            <GisView />
          )}

          {currentTab === 'umkm' && (
            <UmkmView currentUser={currentUser} />
          )}

          {currentTab === 'species' && (
            <SpeciesCatalogModal onTestSpecies={handleTestSpecies} />
          )}
        </main>
      </div>
    </div>
  );
}
