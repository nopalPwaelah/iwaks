import { useState, useEffect } from 'react';

/**
 * BlueEconomy AI - Global State Store (Zero-Dependency)
 * Mendukung reaktivitas antar komponen tanpa memerlukan dependensi eksternal,
 * dan aman dari masalah kuota LocalStorage (hanya menyimpan metadata ringan).
 */

const STORAGE_KEY = 'blueeconomy_state_v1';

// Initial state
const initialState = {
  selectedImagePreview: null,
  detectionResults: [],
  selectedSpecies: null,
  marketPrices: [],
  profitData: null,
  activeFilter: 'all',
  lastScanTime: null,
};

// Safe loader from storage (excluding large preview strings)
function loadPersistedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw);
    return {
      ...initialState,
      detectionResults: parsed.detectionResults || [],
      selectedSpecies: parsed.selectedSpecies || null,
      profitData: parsed.profitData || null,
      lastScanTime: parsed.lastScanTime || null,
    };
  } catch (e) {
    console.warn('Gagal membaca persisted state:', e);
    return initialState;
  }
}

// In-memory state and subscriber set
let currentState = loadPersistedState();
const listeners = new Set();

function notify() {
  listeners.forEach((listener) => listener(currentState));
  // Save lightweight slice to localStorage
  try {
    const sliceToSave = {
      detectionResults: currentState.detectionResults,
      selectedSpecies: currentState.selectedSpecies,
      profitData: currentState.profitData,
      lastScanTime: currentState.lastScanTime,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sliceToSave));
  } catch (err) {
    console.warn('Gagal menyimpan cache store:', err);
  }
}

// Global store dispatchers
export const store = {
  getState: () => currentState,

  setState: (updater) => {
    const nextState = typeof updater === 'function' ? updater(currentState) : updater;
    currentState = { ...currentState, ...nextState };
    notify();
  },

  setDetectionResults: (results, previewUrl = null) => {
    store.setState({
      detectionResults: results || [],
      selectedImagePreview: previewUrl,
      lastScanTime: new Date().toISOString(),
      selectedSpecies: results?.[0]?.scientific_name || null,
    });
  },

  setProfitData: (data) => {
    store.setState({ profitData: data });
  },

  setSelectedSpecies: (species) => {
    store.setState({ selectedSpecies: species });
  },

  clearResults: () => {
    store.setState({
      selectedImagePreview: null,
      detectionResults: [],
      selectedSpecies: null,
      lastScanTime: null,
    });
  },
};

/**
 * Custom React Hook untuk subscribe ke state store
 * Contoh: const { detectionResults, setDetectionResults } = useStore();
 */
export function useStore(selector = (state) => state) {
  const [slice, setSlice] = useState(() => selector(currentState));

  useEffect(() => {
    const handleUpdate = (newState) => {
      setSlice(selector(newState));
    };
    listeners.add(handleUpdate);
    return () => {
      listeners.delete(handleUpdate);
    };
  }, [selector]);

  return {
    ...slice,
    setState: store.setState,
    setDetectionResults: store.setDetectionResults,
    setProfitData: store.setProfitData,
    setSelectedSpecies: store.setSelectedSpecies,
    clearResults: store.clearResults,
  };
}

export default useStore;

