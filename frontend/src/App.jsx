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
import AuthModal from './components/AuthModal';
import ErrorBoundary from './components/ErrorBoundary';
import { ROLE_TABS } from './config/roles';
import { setAuthToken } from './lib/api';

const PUBLIC_USER = {
  role: 'Public',
  name: 'Tamu Publik'
};

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState(PUBLIC_USER);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [authModalConfig, setAuthModalConfig] = useState({
    defaultTab: 'login',
    initialRole: 'Nelayan'
  });

  const handleOpenAuth = (tab = 'login', role = 'Nelayan') => {
    setAuthModalConfig({ defaultTab: tab, initialRole: role });
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    // Jika nelayan baru login, arahkan ke dashboard atau tab relevan
    if (user.role === 'Nelayan' && currentTab === 'dashboard') {
      setCurrentTab('dashboard');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
    } catch (e) {
      // ignore
    }
    setAuthToken(null);
    setCurrentUser(PUBLIC_USER);
    setCurrentTab('dashboard');
  };

  const handleTestSpecies = () => {
    if (currentUser.role === 'Public') {
      handleOpenAuth('login', 'Nelayan');
    } else {
      setCurrentTab('ai-detection');
    }
  };

  const allowedTabs = ROLE_TABS[currentUser.role] || ROLE_TABS.Public;
  const safeTab = allowedTabs.includes(currentTab) ? currentTab : 'dashboard';

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <Navbar
          currentUser={currentUser}
          onOpenAuthModal={() => handleOpenAuth('login', 'Nelayan')}
          onLogout={handleLogout}
          isMobileMenuOpen={isMobileMenuOpen}
          onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
        />

        <div className="flex flex-1 relative">
          <Sidebar
            currentTab={safeTab}
            onSelectTab={(tab) => {
              setCurrentTab(tab);
              setIsMobileMenuOpen(false);
            }}
            allowedTabs={allowedTabs}
            isMobileOpen={isMobileMenuOpen}
            onCloseMobile={() => setIsMobileMenuOpen(false)}
          />

          <main className="w-full flex-1 min-w-0 p-3 sm:p-6 lg:p-8 max-w-7xl overflow-y-auto">
            {safeTab === 'dashboard' && (
              <DashboardView
                onNavigate={setCurrentTab}
                user={currentUser}
                onOpenAuthModal={() => handleOpenAuth('login', 'Nelayan')}
              />
            )}
            {safeTab === 'ai-detection' && (
              <AiDetectionView onCatchSaved={() => setCurrentTab('catches')} />
            )}
            {safeTab === 'catches' && <CatchView />}
            {safeTab === 'prices' && <PriceView userRole={currentUser?.role} />}
            {safeTab === 'profit' && <ProfitView />}
            {safeTab === 'market-rec' && <MarketRecommendationView />}
            {safeTab === 'gis' && <GisView />}
            {safeTab === 'umkm' && (
              <UmkmView
                currentUser={currentUser}
                onOpenAuthModal={() => handleOpenAuth('login', 'UMKM')}
              />
            )}
            {safeTab === 'species' && (
              <SpeciesCatalogModal
                onTestSpecies={handleTestSpecies}
                currentUser={currentUser}
                onOpenAuthModal={() => handleOpenAuth('login', 'Nelayan')}
              />
            )}
          </main>
        </div>

        {/* Modal Login & Registrasi Terpadu */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onAuthSuccess={handleAuthSuccess}
          defaultTab={authModalConfig.defaultTab}
          initialRole={authModalConfig.initialRole}
        />
      </div>
    </ErrorBoundary>
  );
}
