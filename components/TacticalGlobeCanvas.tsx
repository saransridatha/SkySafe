"use client";

import { Canvas, useFrame, extend } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { useRef, useMemo, useEffect, useState } from "react";
import * as THREE from "three";

// Extend line_ to avoid conflict with SVG line element
extend({ Line_: THREE.Line });

function WireframeGlobe() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.15;
      groupRef.current.rotation.x = 0.2;
    }
  });

  const allLines = useMemo(() => {
    const lines: THREE.Vector3[][] = [];
    // Latitude lines
    for (let lat = -80; lat <= 80; lat += 20) {
      const points: THREE.Vector3[] = [];
      const phi = (90 - lat) * (Math.PI / 180);
      for (let lng = 0; lng <= 360; lng += 5) {
        const theta = lng * (Math.PI / 180);
        points.push(new THREE.Vector3(
          2 * Math.sin(phi) * Math.cos(theta),
          2 * Math.cos(phi),
          2 * Math.sin(phi) * Math.sin(theta)
        ));
      }
      lines.push(points);
    }
    // Longitude lines
    for (let lng = 0; lng < 360; lng += 30) {
      const points: THREE.Vector3[] = [];
      const theta = lng * (Math.PI / 180);
      for (let lat = -90; lat <= 90; lat += 5) {
        const phi = (90 - lat) * (Math.PI / 180);
        points.push(new THREE.Vector3(
          2 * Math.sin(phi) * Math.cos(theta),
          2 * Math.cos(phi),
          2 * Math.sin(phi) * Math.sin(theta)
        ));
      }
      lines.push(points);
    }
    return lines;
  }, []);

  return (
    <group ref={groupRef}>
      {allLines.map((points, i) => {
        const geom = new THREE.BufferGeometry().setFromPoints(points);
        return (
          <primitive key={i} object={new THREE.Line(
            geom,
            new THREE.LineBasicMaterial({ color: i < 9 ? "#38BDF8" : "#3B82F6", opacity: 0.15, transparent: true })
          )} />
        );
      })}
      <mesh>
        <ringGeometry args={[1.98, 2.02, 64]} />
        <meshBasicMaterial color="#38BDF8" opacity={0.3} transparent side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export default function TacticalGlobeCanvas() {
  const [webglSupported, setWebglSupported] = useState<boolean | null>(null);

  useEffect(() => {
    let supported = false;
    try {
      // Dry-run the exact code path Three.js/R3F uses to create a renderer.
      // If this throws we know WebGL isn't usable and we skip the Canvas entirely.
      const testRenderer = new THREE.WebGLRenderer({
        canvas: document.createElement("canvas"),
        antialias: false,
        alpha: true,
        powerPreference: "low-power",
        failIfMajorPerformanceCaveat: false,
      });
      testRenderer.dispose();
      supported = true;
    } catch {
      supported = false;
    }
    setWebglSupported(supported);
  }, []);

  if (webglSupported === null) {
    // Still checking — show nothing to avoid flash
    return <div className="absolute inset-0" />;
  }

  if (!webglSupported) {
    return (
      <div className="absolute inset-0 opacity-30 flex items-center justify-center pointer-events-none">
        <div className="relative w-64 h-64">
          <div className="absolute inset-0 rounded-full border border-electric/30 animate-pulse" />
          <div className="absolute inset-6 rounded-full border border-electric/20" />
          <div className="absolute inset-12 rounded-full border border-electric/15" />
          {[20, 40, 60, 80, 100, 120, 140].map((top) => (
            <div key={top} className="absolute left-4 right-4 h-px bg-electric/10" style={{ top }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 opacity-60">
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
        <ambientLight intensity={0.3} />
        <Stars radius={50} depth={50} count={1500} factor={3} saturation={0} fade speed={0.5} />
        <WireframeGlobe />
      </Canvas>
    </div>
  );
}
