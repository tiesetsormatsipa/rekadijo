"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const driverIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

const deliveryIcon = L.divIcon({
  className: "",
  html: `<div style="width:14px;height:14px;border-radius:50%;background:#16a34a;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7]
});

type DriverTrackingMapProps = {
  driverLat?: number;
  driverLng?: number;
  deliveryLat?: number;
  deliveryLng?: number;
};

export function DriverTrackingMap({ driverLat, driverLng, deliveryLat, deliveryLng }: DriverTrackingMapProps) {
  const center: [number, number] =
    driverLat != null && driverLng != null
      ? [driverLat, driverLng]
      : deliveryLat != null && deliveryLng != null
        ? [deliveryLat, deliveryLng]
        : [-26.2041, 28.0473];

  return (
    <div className="h-64 w-full">
      <MapContainer center={center} zoom={15} scrollWheelZoom={false} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {deliveryLat != null && deliveryLng != null && (
          <Marker position={[deliveryLat, deliveryLng]} icon={deliveryIcon}>
            <Popup>Delivery location</Popup>
          </Marker>
        )}
        {driverLat != null && driverLng != null && (
          <Marker position={[driverLat, driverLng]} icon={driverIcon}>
            <Popup>Driver</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
