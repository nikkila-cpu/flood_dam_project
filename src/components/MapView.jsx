import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import { dams } from "../data/demoData";

export default function MapView({ selectedDam, onDamSelect }) {
  return (
    <div className="map-shell">
      <MapContainer center={[22.8, 79]} zoom={4.35} scrollWheelZoom className="map">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {dams.map((dam) => {
          const isSelected = dam.id === selectedDam?.id;
          return (
            <CircleMarker
              key={dam.id}
              center={dam.position}
              radius={isSelected ? 11 : 8}
              pathOptions={{ color: "#fff", fillColor: isSelected ? "#f59e0b" : "#ef4444", fillOpacity: 1, weight: 2 }}
              eventHandlers={{ click: () => onDamSelect(dam) }}
            >
              <Popup><strong>{dam.name}</strong><br />{dam.river}<br />Capacity: {dam.capacity}</Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
      <div className="map-overlay legend">
        <span><i className="dot dam-dot" /> Dam</span>
        <span><i className="dot river-dot" /> River basin</span>
        <span><i className="dot flood-dot" /> Flood zone</span>
      </div>
      <div className="map-overlay map-title">India: dams and study basins</div>
    </div>
  );
}
