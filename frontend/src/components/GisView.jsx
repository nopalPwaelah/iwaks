import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Filter, Layers, Navigation, Phone, Info } from 'lucide-react';
import L from 'leaflet';

export default function GisView() {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);

  const [locations, setLocations] = useState([]);
  const [filterType, setFilterType] = useState('ALL');
  const [selectedLocation, setSelectedLocation] = useState(null);

  useEffect(() => {
    fetch('/api/gis/locations')
      .then((r) => r.json())
      .then((data) => setLocations(data))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Initialize Leaflet Map
      const map = L.map(mapContainerRef.current).setView([-6.115, 106.815], 12);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      mapInstanceRef.current = map;
      markersLayerRef.current = L.layerGroup().addTo(map);
    }

    // Refresh markers
    if (markersLayerRef.current) {
      markersLayerRef.current.clearLayers();

      const filtered = locations.filter((loc) => {
        if (filterType === 'ALL') return true;
        if (filterType === 'TPI' && (loc.type === 'TPI' || loc.type === 'Pelabuhan')) return true;
        if (filterType === 'PASAR' && loc.type === 'Pasar Ikan') return true;
        if (filterType === 'UMKM' && loc.type === 'UMKM Pesisir') return true;
        return false;
      });

      filtered.forEach((loc) => {
        // Custom SVG circle marker
        const marker = L.circleMarker([loc.latitude, loc.longitude], {
          radius: 9,
          fillColor: loc.color || '#0284c7',
          color: '#ffffff',
          weight: 2.5,
          opacity: 1,
          fillOpacity: 0.9
        });

        marker.bindPopup(`
          <div style="font-family: system-ui, sans-serif; font-size: 12px; line-height: 1.4;">
            <strong style="font-size: 13px; color: #0f172a;">${loc.name}</strong><br/>
            <span style="color: #64748b; font-size: 11px;">${loc.type} &bull; ${loc.region}</span><br/>
            ${loc.address ? `<p style="margin: 4px 0 2px; color: #334155;">${loc.address}</p>` : ''}
            ${loc.needs ? `<p style="margin: 4px 0 2px; color: #0284c7; font-weight: bold;">Pasokan: ${loc.needs}</p>` : ''}
            <small style="color: #94a3b8;">Koordinat: ${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}</small>
          </div>
        `);

        marker.on('click', () => {
          setSelectedLocation(loc);
        });

        markersLayerRef.current.addLayer(marker);
      });
    }
  }, [locations, filterType]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-8 h-8 rounded-lg bg-ocean-50 text-ocean-700 flex items-center justify-center font-bold">
              <MapPin className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900">Coastal Geographic Information System (GIS)</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Peta sebaran geospasial pelabuhan perikanan, TPI pendaratan ikan, pasar komoditas, dan sentra UMKM pesisir.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl text-xs">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              filterType === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setFilterType('TPI')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center space-x-1 ${
              filterType === 'TPI' ? 'bg-ocean-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-ocean-400 inline-block"></span>
            <span>TPI &amp; Pelabuhan</span>
          </button>
          <button
            onClick={() => setFilterType('PASAR')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center space-x-1 ${
              filterType === 'PASAR' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-400 inline-block"></span>
            <span>Pasar Ikan</span>
          </button>
          <button
            onClick={() => setFilterType('UMKM')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center space-x-1 ${
              filterType === 'UMKM' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
            <span>Sentra UMKM</span>
          </button>
        </div>
      </div>

      {/* Map Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-9 bg-white rounded-2xl p-2 border border-slate-200 shadow-sm overflow-hidden">
          <div ref={mapContainerRef} className="w-full h-[540px] rounded-xl z-10" />
        </div>

        {/* Info Sidebar */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-xs space-y-3">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2 flex items-center space-x-1.5">
              <Layers className="w-4 h-4 text-ocean-600" />
              <span>Legenda Peta</span>
            </h3>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="w-3.5 h-3.5 rounded-full bg-[#0284c7] border-2 border-white shadow"></span>
                <span className="font-medium text-slate-700">TPI &amp; Pelabuhan Pendaratan</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3.5 h-3.5 rounded-full bg-[#e11d48] border-2 border-white shadow"></span>
                <span className="font-medium text-slate-700">Pasar Ikan &amp; Sentra Konsumsi</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3.5 h-3.5 rounded-full bg-[#16a34a] border-2 border-white shadow"></span>
                <span className="font-medium text-slate-700">Sentra Pengolahan UMKM</span>
              </div>
            </div>
          </div>

          {selectedLocation ? (
            <div className="bg-white p-5 rounded-2xl border border-ocean-300 ring-2 ring-ocean-500/10 shadow-sm text-xs space-y-2">
              <span className="text-[10px] uppercase font-bold text-ocean-600 tracking-wider">Titik Terpilih</span>
              <h4 className="font-bold text-slate-900 text-sm">{selectedLocation.name}</h4>
              <p className="text-slate-500">{selectedLocation.address || selectedLocation.region}</p>
              
              {selectedLocation.contact && (
                <div className="flex items-center space-x-1 text-slate-600 pt-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedLocation.contact}</span>
                </div>
              )}

              {selectedLocation.needs && (
                <div className="bg-ocean-50 p-2.5 rounded-xl border border-ocean-200 mt-2">
                  <strong className="text-ocean-900 block font-bold text-[11px]">Kebutuhan Pasokan:</strong>
                  <span className="text-ocean-800 text-[11px] leading-tight block mt-0.5">{selectedLocation.needs}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
              <Info className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <span>Klik salah satu marker pada peta untuk melihat profil lengkap dan kontak lokasi.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
