"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet's default marker icon asset paths in Next.js
const customIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export interface MapBranch {
  id: string;
  businessName: string;
  branchName: string;
  lat: number;
  lng: number;
  rating: number;
  category: string;
  city: string;
  businessSlug: string;
}

interface VendorMapProps {
  branches: MapBranch[];
  userLocation: { lat: number; lng: number } | null;
  focusedBranchId: string | null;
}

// 1. THE SECRET SAUCE: A child component to manage internal updates safely
function MapController({ focusedBranch }: { focusedBranch: MapBranch | null }) {
  const map = useMap();

  useEffect(() => {
    if (focusedBranch) {
      // Smoothly pan and zoom to the store selected on the sidebar/bottom sheet
      map.setView([focusedBranch.lat, focusedBranch.lng], 14, {
        animate: true,
        duration: 0.75,
      });
    }
  }, [focusedBranch, map]);

  return null;
}

export function VendorMap({ branches, userLocation, focusedBranchId }: VendorMapProps) {
  // Find the exact branch object that is currently active/hovered
  const focusedBranch = branches.find((b) => b.id === focusedBranchId) || null;
  
  // Establish a fallback starting coordinate (or default center)
  const defaultCenter: [number, number] = useMemo(() => {
    return userLocation 
      ? [userLocation.lat, userLocation.lng] 
      : branches.length > 0 
      ? [branches[0].lat, branches[0].lng] 
      : [0, 0];
  }, [userLocation, branches]);

  // FIXED: Dynamic key forces a clean MapContainer remount when the base location loads or HMR fires
  const mapInstanceKey = `${defaultCenter[0]}-${defaultCenter[1]}`;

  return (
    <div className="h-full w-full relative">
      <MapContainer
        key={mapInstanceKey}
        center={defaultCenter}
        zoom={12}
        scrollWheelZoom={true}
        className="h-full w-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Render your list of markers reactively */}
        {branches.map((branch) => (
          <Marker 
            key={branch.id} 
            position={[branch.lat, branch.lng]} 
            icon={customIcon}
          >
            <Popup>
              <div className="p-1 font-sans">
                <h4 className="font-bold text-sm text-gray-900">{branch.businessName}</h4>
                <p className="text-xs text-gray-500">{branch.branchName}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* 2. Mount the controller inside the container to receive context safely */}
        <MapController focusedBranch={focusedBranch} />
      </MapContainer>
    </div>
  );
}