export const ROLE_TABS = {
  Public: ['dashboard', 'prices', 'market-rec', 'gis', 'umkm', 'species'],
  Nelayan: ['dashboard', 'ai-detection', 'catches', 'prices', 'profit', 'market-rec', 'gis', 'umkm', 'species'],
  UMKM: ['dashboard', 'prices', 'gis', 'umkm', 'species'],
  'Pengelola Pasar': ['dashboard', 'prices', 'gis', 'species'],
  'Admin & Stakeholder (DKP)': ['dashboard', 'ai-detection', 'catches', 'prices', 'profit', 'market-rec', 'gis', 'umkm', 'species'],
  // Alias backward compatibility
  Admin: ['dashboard', 'ai-detection', 'catches', 'prices', 'profit', 'market-rec', 'gis', 'umkm', 'species'],
  Stakeholder: ['dashboard', 'ai-detection', 'catches', 'prices', 'profit', 'market-rec', 'gis', 'umkm', 'species']
};

export const DEMO_LOGIN = {
  Nelayan: 'nelayan@blueeconomy.id',
  UMKM: 'umkm@blueeconomy.id',
  'Pengelola Pasar': 'pasar@blueeconomy.id',
  'Admin & Stakeholder (DKP)': 'admin@blueeconomy.id',
  Admin: 'admin@blueeconomy.id',
  Stakeholder: 'admin@blueeconomy.id'
};
