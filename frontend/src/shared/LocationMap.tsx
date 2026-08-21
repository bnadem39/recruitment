import { Icon } from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/leaflet.css';

type LocationMapProps = {
  latitude: number;
  longitude: number;
  locationName: string;
  address: string;
  zoom?: number;
};

const defaultMarkerIcon = new Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export function LocationMap({
  latitude,
  longitude,
  locationName,
  address,
  zoom = 16,
}: LocationMapProps) {
  return (
    <div
      className="location-map"
      role="region"
      aria-label={`Interactive map showing ${locationName} at ${address}`}
    >
      <MapContainer
        center={[latitude, longitude]}
        zoom={zoom}
        scrollWheelZoom={false}
        className="location-map__canvas"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[latitude, longitude]} icon={defaultMarkerIcon}>
          <Popup>
            <strong>{locationName}</strong>
            <span className="location-map__popup-address">{address}</span>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
