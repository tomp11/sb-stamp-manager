
import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { StoreStamp } from '../types';
import { LocateFixed, ZoomIn } from 'lucide-react';

interface StoreMapProps {
  stamps: StoreStamp[];
}

const StoreMap: React.FC<StoreMapProps> = ({ stamps }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const userLocationMarkerRef = useRef<L.Circle | null>(null);
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const fixMapSize = useCallback(() => {
    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 100);
    }
  }, []);

  const handleRecenter = useCallback(() => {
    if (mapRef.current && userCoords) {
      mapRef.current.setView(userCoords, 14, { animate: true });
    }
  }, [userCoords]);

  const handleFitAll = useCallback(() => {
    if (mapRef.current && markersRef.current.length > 0) {
      const group = L.featureGroup(markersRef.current);
      mapRef.current.fitBounds(group.getBounds().pad(0.1));
    }
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapRef.current) {
      try {
        mapRef.current = L.map(mapContainerRef.current, {
          center: [35.6812, 139.7671],
          zoom: 13,
          scrollWheelZoom: true,
          zoomControl: false 
        });

        L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(mapRef.current);

        fixMapSize();
      } catch (e) {
        console.error("Leaflet init error:", e);
        return;
      }
    }

    markersRef.current.forEach(m => m?.remove());
    markersRef.current = [];
    if (userLocationMarkerRef.current) {
      userLocationMarkerRef.current.remove();
      userLocationMarkerRef.current = null;
    }

    const validStamps = (stamps || []).filter(s => 
      s && 
      typeof s?.latitude === 'number' && 
      typeof s?.longitude === 'number' && 
      !isNaN(s?.latitude) && 
      !isNaN(s?.longitude)
    );

    validStamps.forEach(stamp => {
      try {
        const visitCountStr = stamp?.visitCount !== undefined ? `${stamp?.visitCount}回` : '未確認';
        const visitDateStr = stamp?.lastVisitDate || '未取得';
        
        const marker = L.marker([stamp?.latitude!, stamp?.longitude!])
          .bindPopup(`
            <div style="min-width: 180px; padding: 4px;">
              <div style="font-weight: bold; color: #00704A; font-size: 15px; margin-bottom: 2px;">${stamp?.storeName}</div>
              <div style="font-size: 11px; color: #666; margin-bottom: 8px; line-height: 1.4;">${stamp?.address}</div>
              <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #eee; padding-top: 6px; font-size: 12px;">
                <span style="color: #999;">訪問回数</span>
                <span style="font-weight: bold; color: ${stamp?.visitCount !== undefined ? '#333' : '#ccc'};">${visitCountStr}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px; font-size: 11px;">
                <span style="color: #999;">最終訪問</span>
                <span style="color: ${stamp?.lastVisitDate ? '#333' : '#ccc'};">${visitDateStr}</span>
              </div>
            </div>
          `)
          .addTo(mapRef.current!);
        markersRef.current.push(marker);
      } catch (e) {
        console.warn("Marker creation failed for:", stamp?.storeName, e);
      }
    });

    if (navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const coords: [number, number] = [latitude, longitude];
          setUserCoords(coords);

          if (mapRef.current) {
            userLocationMarkerRef.current = L.circle(coords, {
              radius: 100,
              color: '#00704A',
              fillColor: '#00704A',
              fillOpacity: 0.4,
              weight: 3
            }).addTo(mapRef.current).bindPopup("現在地");

            fixMapSize();
            mapRef.current.setView(coords, 14);
          }
          setIsLocating(false);
        },
        () => {
          setIsLocating(false);
          if (markersRef.current.length > 0 && mapRef.current) {
            const group = L.featureGroup(markersRef.current);
            mapRef.current.fitBounds(group.getBounds().pad(0.1));
          }
          fixMapSize();
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, [stamps, fixMapSize]);

  useEffect(() => {
    fixMapSize();
  }, [fixMapSize]);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative group/map">
      <div 
        className="w-full h-[500px] md:h-[600px] rounded-2xl overflow-hidden shadow-inner bg-gray-100 border border-gray-200" 
        ref={mapContainerRef} 
        style={{ zIndex: 1 }}
      />
      
      <div className="absolute top-4 right-4 z-[10] flex flex-col gap-2">
        <button
          onClick={handleRecenter}
          disabled={!userCoords}
          className={`p-3 rounded-full shadow-lg border transition-all flex items-center justify-center ${
            userCoords 
              ? 'bg-white text-[#00704A] border-emerald-100 hover:bg-emerald-50 active:scale-95' 
              : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
          }`}
          title="現在地に移動"
        >
          <LocateFixed className="w-5 h-5" />
        </button>
        <button
          onClick={handleFitAll}
          disabled={markersRef.current.length === 0}
          className={`p-3 rounded-full shadow-lg border transition-all flex items-center justify-center ${
            markersRef.current.length > 0 
              ? 'bg-white text-[#00704A] border-emerald-100 hover:bg-emerald-50 active:scale-95' 
              : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
          }`}
          title="すべてのスタンプを表示"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
      </div>

      {isLocating && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[10] bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg border border-emerald-100 flex items-center gap-2 animate-in fade-in zoom-in">
          <LocateFixed className="w-4 h-4 text-[#00704A] animate-pulse" />
          <span className="text-xs font-bold text-gray-600">現在地を確認中...</span>
        </div>
      )}
    </div>
  );
};

export default StoreMap;
