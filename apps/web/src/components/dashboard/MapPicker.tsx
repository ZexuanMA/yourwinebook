"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icon (Leaflet uses relative paths that break with bundlers)
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Hong Kong center as default
const HK_CENTER: [number, number] = [22.3193, 114.1694];
const DEFAULT_ZOOM = 15;

interface MapPickerProps {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
  t: (key: string) => string;
}

export default function MapPicker({ lat, lng, onChange, t }: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [localLat, setLocalLat] = useState(lat ?? HK_CENTER[0]);
  const [localLng, setLocalLng] = useState(lng ?? HK_CENTER[1]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const center: [number, number] = [localLat, localLng];
    const map = L.map(mapRef.current).setView(center, DEFAULT_ZOOM);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker(center, { draggable: true, icon: defaultIcon }).addTo(map);

    marker.on("dragend", () => {
      const pos = marker.getLatLng();
      setLocalLat(pos.lat);
      setLocalLng(pos.lng);
      onChange(pos.lat, pos.lng);
    });

    map.on("click", (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      setLocalLat(e.latlng.lat);
      setLocalLng(e.latlng.lng);
      onChange(e.latlng.lat, e.latlng.lng);
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;

    // Ensure map tiles render correctly after container is visible
    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-2">
      <div
        ref={mapRef}
        className="w-full h-[300px] rounded-lg border border-bg-card overflow-hidden z-0"
      />
      <p className="text-xs text-text-sub/60">{t("stores.coordinates.hint")}</p>
      <div className="flex gap-3 text-xs text-text-sub">
        <span>{t("stores.coordinates.lat")}: {localLat.toFixed(6)}</span>
        <span>{t("stores.coordinates.lng")}: {localLng.toFixed(6)}</span>
      </div>
    </div>
  );
}
