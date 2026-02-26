/**
 * House3D Component
 * Interaktives 3D Smart Home mit Three.js
 * Farbcodierung basierend auf Grid-Status (CO2/Preis)
 */

import { useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import { getGridCurrent } from "../api/client";

// Einzelner Raum als 3D-Box
function Room({ position, size, color, label, onClick, isSelected }) {
  const [hovered, setHovered] = useState(false);

  return (
    <group position={position}>
      {/* Raum-Box */}
      <mesh
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={hovered || isSelected ? color : color}
          opacity={hovered ? 0.9 : 0.7}
          transparent
          emissive={hovered || isSelected ? color : "#000000"}
          emissiveIntensity={hovered || isSelected ? 0.3 : 0}
        />
      </mesh>

      {/* Raum-Label */}
      <Text
        position={[0, size[1] / 2 + 0.3, 0]}
        fontSize={0.3}
        color="black"
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>

      {/* Wireframe für bessere Sichtbarkeit */}
      <mesh>
        <boxGeometry args={size} />
        <meshBasicMaterial color="#333333" wireframe />
      </mesh>
    </group>
  );
}

// Dach als Pyramide
function Roof({ position, color }) {
  return (
    <mesh position={position} rotation={[0, Math.PI / 4, 0]}>
      <coneGeometry args={[2.5, 1.5, 4]} />
      <meshStandardMaterial color={color} opacity={0.8} transparent />
    </mesh>
  );
}

const House3D = () => {
  const [gridData, setGridData] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const response = await getGridCurrent();
      setGridData(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching grid data for 3D house:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Update alle 30s
    return () => clearInterval(interval);
  }, []);

  // Farbberechnung basierend auf Grid-Status
  const getHouseColor = () => {
    if (!gridData) return "#888888";

    const { price, co2 } = gridData;

    // Grün: Günstig & wenig CO2
    if (price < 0.25 && co2 < 300) return "#10B981"; // Grün

    // Gelb: Normal
    if (price < 0.35 && co2 < 500) return "#F59E0B"; // Gelb

    // Rot: Teuer oder viel CO2
    return "#EF4444"; // Rot
  };

  const houseColor = getHouseColor();

  // Räume Definition
  const rooms = [
    {
      id: "living",
      label: "Wohnzimmer",
      position: [-1.5, 0.5, 0],
      size: [2, 1, 2],
      devices: ["TV", "Smart Lights", "Heizung"],
    },
    {
      id: "kitchen",
      label: "Küche",
      position: [1.5, 0.5, 0],
      size: [2, 1, 2],
      devices: ["Herd", "Kühlschrank", "Spülmaschine"],
    },
    {
      id: "bedroom",
      label: "Schlafzimmer",
      position: [-1.5, 0.5, -2.5],
      size: [2, 1, 2],
      devices: ["Smart AC", "Ladestation"],
    },
    {
      id: "bathroom",
      label: "Bad",
      position: [1.5, 0.5, -2.5],
      size: [2, 1, 2],
      devices: ["Waschmaschine", "Warmwasser"],
    },
    {
      id: "garage",
      label: "Garage",
      position: [0, 0.3, 2.5],
      size: [3, 0.6, 1.5],
      devices: ["E-Auto Ladestation", "Wallbox"],
    },
  ];

  const getStatusText = () => {
    if (!gridData) return { text: "Lade Daten...", color: "gray" };

    const { price, co2 } = gridData;

    if (price < 0.25 && co2 < 300) {
      return {
        text: "✅ Perfekter Zeitpunkt! Günstig & Grün",
        color: "green",
      };
    }
    if (price < 0.35 && co2 < 500) {
      return {
        text: "⚠️ Normaler Zeitpunkt",
        color: "yellow",
      };
    }
    return {
      text: "❌ Warten empfohlen - Teuer oder Schmutzig",
      color: "red",
    };
  };

  const status = getStatusText();

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Smart Home 3D</h2>
        <div className="h-96 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Lade 3D-Modell...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Smart Home 3D</h2>
        <div
          className={`px-4 py-2 rounded-lg font-semibold ${
            status.color === "green"
              ? "bg-green-100 text-green-800"
              : status.color === "yellow"
                ? "bg-gray-100 text-gray-800 border-2 border-gray-200"
                : "bg-red-100 text-red-800"
          }`}
        >
          {gridData && gridData.price
            ? `${gridData.price.toFixed(2)} €/kWh`
            : "---"}
        </div>
      </div>

      {/* Status Banner */}
      <div
        className={`mb-4 p-3 rounded-lg ${
          status.color === "green"
            ? "bg-green-50 border-2 border-green-200"
            : status.color === "yellow"
              ? "bg-gray-50 border-2 border-gray-200"
              : "bg-red-50 border-2 border-red-200"
        }`}
      >
        <p className="text-sm font-medium text-gray-800">{status.text}</p>
      </div>

      {/* 3D Canvas */}
      <div className="h-96 bg-gradient-to-b from-white to-green-100 rounded-lg overflow-hidden">
        <Canvas camera={{ position: [8, 6, 8], fov: 50 }}>
          {/* Beleuchtung */}
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <pointLight position={[-10, 10, -5]} intensity={0.5} />

          {/* Räume */}
          {rooms.map((room) => (
            <Room
              key={room.id}
              position={room.position}
              size={room.size}
              color={houseColor}
              label={room.label}
              isSelected={selectedRoom?.id === room.id}
              onClick={() => setSelectedRoom(room)}
            />
          ))}

          {/* Dach */}
          <Roof position={[0, 2.2, -1.25]} color={houseColor} />

          {/* Boden */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
            <planeGeometry args={[15, 15]} />
            <meshStandardMaterial color="#90EE90" opacity={0.3} transparent />
          </mesh>

          {/* Orbit Controls */}
          <OrbitControls
            enableZoom={true}
            enablePan={true}
            maxPolarAngle={Math.PI / 2}
            minDistance={5}
            maxDistance={20}
          />
        </Canvas>
      </div>

      {/* Raum-Details Panel */}
      {selectedRoom && (
        <div className="mt-4 p-4 bg-gray-50 border-2 border-gray-200 rounded-lg">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                📍 {selectedRoom.label}
              </h3>
              <div className="text-sm text-gray-700">
                <p className="font-semibold mb-1">Geräte:</p>
                <ul className="list-disc list-inside space-y-1">
                  {selectedRoom.devices.map((device, index) => (
                    <li key={index}>{device}</li>
                  ))}
                </ul>
              </div>
              {gridData && gridData.price < 0.25 && (
                <div className="mt-3 p-2 bg-green-100 rounded text-sm text-green-800">
                  💡 <strong>Empfehlung:</strong> Jetzt ist ein guter Zeitpunkt,
                  um Geräte zu nutzen!
                </div>
              )}
            </div>
            <button
              onClick={() => setSelectedRoom(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Legende */}
      <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-200 rounded"></div>
          <span className="text-gray-700">Günstig & Grün</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-200 rounded"></div>
          <span className="text-gray-700">Normal</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-200 rounded"></div>
          <span className="text-gray-700">Teuer/Schmutzig</span>
        </div>
      </div>

      {/* Interaktions-Hinweis */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600 text-center">
        🖱️ Klicke auf Räume für Details • Drehe & Zoome mit der Maus
      </div>
    </div>
  );
};

export default House3D;
