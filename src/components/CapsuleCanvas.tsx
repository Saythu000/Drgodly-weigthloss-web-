'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function CapsuleCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = 260;
    const height = 260;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Group for capsule halves
    const capsuleGroup = new THREE.Group();

    // Top Half (Navy Blue #001a3f)
    const topGeo = new THREE.CylinderGeometry(0.7, 0.7, 1.2, 32);
    const topMat = new THREE.MeshPhongMaterial({
      color: 0x001a3f,
      shininess: 100,
      specular: 0x4a5e87,
    });
    const topMesh = new THREE.Mesh(topGeo, topMat);
    topMesh.position.y = 0.6;

    const topCapGeo = new THREE.SphereGeometry(0.7, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const topCapMesh = new THREE.Mesh(topCapGeo, topMat);
    topCapMesh.position.y = 1.2;

    // Bottom Half (Teal / Cyan #00E5FF)
    const botGeo = new THREE.CylinderGeometry(0.7, 0.7, 1.2, 32);
    const botMat = new THREE.MeshPhongMaterial({
      color: 0x00e5ff,
      shininess: 100,
      specular: 0xffffff,
    });
    const botMesh = new THREE.Mesh(botGeo, botMat);
    botMesh.position.y = -0.6;

    const botCapGeo = new THREE.SphereGeometry(0.7, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
    const botCapMesh = new THREE.Mesh(botCapGeo, botMat);
    botCapMesh.position.y = -1.2;

    capsuleGroup.add(topMesh);
    capsuleGroup.add(topCapMesh);
    capsuleGroup.add(botMesh);
    capsuleGroup.add(botCapMesh);

    // Initial inclination tilt
    capsuleGroup.rotation.z = Math.PI / 6;

    scene.add(capsuleGroup);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight1.position.set(5, 5, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x00e5ff, 0.6);
    dirLight2.position.set(-5, -5, -2);
    scene.add(dirLight2);

    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      // Continuous 3D rotation
      capsuleGroup.rotation.y += 0.02;
      capsuleGroup.rotation.x = Math.sin(Date.now() * 0.002) * 0.2;
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (container && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className="w-[260px] h-[260px] relative flex items-center justify-center">
      <div ref={containerRef} className="w-[260px] h-[260px]" />
    </div>
  );
}
