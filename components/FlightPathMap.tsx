"use client";

import { useEffect, useRef, useState } from "react";
import type { PathAnalysis, Coordinate } from "@/lib/types";

interface FlightPathMapProps {
  pathAnalysis: PathAnalysis;
  waypoints: Coordinate[];
}

export function FlightPathMap({ pathAnalysis, waypoints }: FlightPathMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let L: any;
    try {
      L = require("leaflet");
      require("leaflet/dist/leaflet.css");
    } catch {
      setMapError("Failed to load map library");
      return;
    }

    if (!mapRef.current) {
      try {
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
          iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        });

        const origin = waypoints[0];
        const destination = waypoints[waypoints.length - 1];
        const centerLng = (origin[0] + destination[0]) / 2;
        const centerLat = (origin[1] + destination[1]) / 2;

        mapRef.current = L.map(mapContainerRef.current).setView([centerLat, centerLng], 4);

        L.tileLayer(
          "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
          { attribution: '© <a href="https://www.openstreetmap.org/copyright">OSM</a> © <a href="https://carto.com/attributions">CARTO</a>' }
        ).addTo(mapRef.current);
      } catch {
        setMapError("Error initializing map");
        return;
      }
    }

    try {
      const map = mapRef.current;
      map.eachLayer((layer: any) => {
        if (!(layer instanceof L.TileLayer)) map.removeLayer(layer);
      });

      const routeCoords: [number, number][] = waypoints.map((wp) => [wp[1], wp[0]]);

      L.polyline(routeCoords, { color: "#4f8ff7", weight: 2, opacity: 0.7, dashArray: "6, 4" }).addTo(map);

      const origin = waypoints[0];
      L.circleMarker([origin[1], origin[0]], { radius: 5, fillColor: "#34d399", color: "#34d399", weight: 2, fillOpacity: 0.9 })
        .bindPopup("Origin")
        .addTo(map);

      const dest = waypoints[waypoints.length - 1];
      L.circleMarker([dest[1], dest[0]], { radius: 5, fillColor: "#f87171", color: "#f87171", weight: 2, fillOpacity: 0.9 })
        .bindPopup("Destination")
        .addTo(map);

      // Show waypoint markers at intervals to avoid clutter (every ~5th point for 20+ waypoints)
      const step = waypoints.length > 10 ? Math.floor(waypoints.length / 6) : 1;
      for (let i = step; i < waypoints.length - 1; i += step) {
        const wp = waypoints[i];
        L.circleMarker([wp[1], wp[0]], { radius: 2.5, fillColor: "#fbbf24", color: "#fbbf24", weight: 1, fillOpacity: 0.5 })
          .addTo(map);
      }

      pathAnalysis.segments.forEach((seg) => {
        if (seg.riskLevel === "HIGH" || seg.riskLevel === "CRITICAL") {
          const color = seg.riskLevel === "CRITICAL" ? "#f87171" : "#f97316";
          L.polyline([[seg.from[1], seg.from[0]], [seg.to[1], seg.to[0]]], { color, weight: 4, opacity: 0.5 }).addTo(map);
        }
      });

      map.fitBounds(L.latLngBounds(routeCoords), { padding: [40, 40] });
    } catch {
      setMapError("Error rendering map");
    }
  }, [waypoints, pathAnalysis]);

  useEffect(() => {
    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, []);

  if (mapError) {
    return (
      <div className="card">
        <div className="card-header">
          <div className="card-title"><span className="card-title-icon">🗺️</span> Flight Path Map</div>
        </div>
        <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.8125rem" }}>
          {mapError}
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "1rem 1.5rem 0" }}>
        <div className="card-title"><span className="card-title-icon">🗺️</span> Flight Path Map</div>
      </div>
      <div ref={mapContainerRef} style={{ height: "420px", background: "var(--bg)" }} />
    </div>
  );
}
