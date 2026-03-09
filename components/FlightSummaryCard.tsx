"use client";

import type { FlightDetails } from "@/lib/types";

interface FlightSummaryCardProps {
  flight: FlightDetails;
}

export function FlightSummaryCard({ flight }: FlightSummaryCardProps) {
  const departure = new Date(flight.departureTime);
  const arrival = new Date(flight.arrivalTime);
  const durationMs = arrival.getTime() - departure.getTime();
  const hours = Math.floor(durationMs / 3600000);
  const minutes = Math.floor((durationMs % 3600000) / 60000);

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <span className="card-title-icon">✈️</span>
          Flight Summary
        </div>
      </div>
      <div className="info-row">
        <span className="info-label">Flight</span>
        <span className="info-value mono">{flight.flightNumber}</span>
      </div>
      <div className="info-row">
        <span className="info-label">Airline</span>
        <span className="info-value">{flight.airlineName}</span>
      </div>
      <div className="info-row">
        <span className="info-label">Aircraft</span>
        <span className="info-value mono">{flight.aircraftType}</span>
      </div>
      <div className="info-row">
        <span className="info-label">Route</span>
        <span className="info-value">
          <span className="mono">{flight.origin}</span>
          {" → "}
          <span className="mono">{flight.destination}</span>
        </span>
      </div>
      <div className="info-row">
        <span className="info-label">Duration</span>
        <span className="info-value mono">{hours}h {minutes}m</span>
      </div>
      <div className="info-row">
        <span className="info-label">Date</span>
        <span className="info-value">{departure.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
      </div>
    </div>
  );
}
