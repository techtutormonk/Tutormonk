import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Sparkles, Eye, Compass, Zap } from 'lucide-react';

interface ThreeBackgroundProps {
  interactive?: boolean;
}

export const ThreeBackground: React.FC<ThreeBackgroundProps> = ({ interactive = true }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [animationMode, setAnimationMode] = useState<'galaxy' | 'quantum' | 'geometry'>('galaxy');
  const [is3DActive, setIs3DActive] = useState<boolean>(true);

  // Mouse coordinates tracked in ref to avoid re-renders
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    if (!mountRef.current || !is3DActive) return;

    // Detect software WebGL guard
    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return false;
      }
    })();

    // Scene & Camera
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0e0624, 0.012);

    const width = window.innerWidth;
    const height = window.innerHeight;

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
    camera.position.z = 32;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setClearColor(0x000000, 0); // Transparent canvas over CSS gradient
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 1.75));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const currentMount = mountRef.current;
    currentMount.appendChild(renderer.domElement);

    // Main 3D Knowledge Universe Group
    const universeGroup = new THREE.Group();
    scene.add(universeGroup);

    // --- 1. PROCEDURAL STARFIELD / KNOWLEDGE SPARKS ---
    const starCount = isSoftwareGl ? 350 : 850;
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    const palette = [
      new THREE.Color('#f59e0b'), // Amber / Gold
      new THREE.Color('#a855f7'), // Purple
      new THREE.Color('#6366f1'), // Indigo
      new THREE.Color('#38bdf8'), // Cyan
      new THREE.Color('#ec4899'), // Pink spark
    ];

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      const radius = 15 + Math.random() * 45;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      starPositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      starPositions[i3 + 2] = (Math.random() - 0.5) * 40;

      const col = palette[Math.floor(Math.random() * palette.length)];
      starColors[i3] = col.r;
      starColors[i3 + 1] = col.g;
      starColors[i3 + 2] = col.b;
    }

    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    // Particle sprite using canvas texture for soft circular glow
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      gradient.addColorStop(0, 'rgba(255,255,255,1)');
      gradient.addColorStop(0.3, 'rgba(250, 204, 21, 0.8)');
      gradient.addColorStop(0.7, 'rgba(168, 85, 247, 0.3)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 32, 32);
    }
    const particleTexture = new THREE.CanvasTexture(canvas);
    particleTexture.colorSpace = THREE.SRGBColorSpace;

    const starMaterial = new THREE.PointsMaterial({
      size: 1.2,
      vertexColors: true,
      map: particleTexture,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const starField = new THREE.Points(starGeometry, starMaterial);
    universeGroup.add(starField);

    // --- 2. FLOATING MATHEMATICAL GEOMETRY (SACRED ICOSAHEDRON) ---
    const icoGroup = new THREE.Group();
    icoGroup.position.set(-14, 5, -5);

    const icoGeo = new THREE.IcosahedronGeometry(3.6, 0);
    const icoMat = new THREE.MeshStandardMaterial({
      color: 0x8b5cf6,
      roughness: 0.25,
      metalness: 0.85,
      wireframe: true,
    });
    const icoMesh = new THREE.Mesh(icoGeo, icoMat);
    icoGroup.add(icoMesh);

    // Inner glowing core
    const innerCoreGeo = new THREE.SphereGeometry(1.6, 16, 16);
    const innerCoreMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      wireframe: false,
      transparent: true,
      opacity: 0.75,
    });
    const innerCore = new THREE.Mesh(innerCoreGeo, innerCoreMat);
    icoGroup.add(innerCore);

    universeGroup.add(icoGroup);

    // --- 3. ATOM / SCIENCE ORBITAL RINGS ---
    const atomGroup = new THREE.Group();
    atomGroup.position.set(15, -4, -8);

    // Nucleus
    const nucleusGeo = new THREE.DodecahedronGeometry(2.0, 1);
    const nucleusMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      roughness: 0.3,
      metalness: 0.7,
      emissive: 0xbe123c,
      emissiveIntensity: 0.4,
    });
    const nucleus = new THREE.Mesh(nucleusGeo, nucleusMat);
    atomGroup.add(nucleus);

    // 3 Electron Torus Rings
    const ringMat1 = new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true, transparent: true, opacity: 0.6 });
    const ringMat2 = new THREE.MeshBasicMaterial({ color: 0xa855f7, wireframe: true, transparent: true, opacity: 0.6 });
    const ringMat3 = new THREE.MeshBasicMaterial({ color: 0xfbbf24, wireframe: true, transparent: true, opacity: 0.6 });

    const ringGeo = new THREE.TorusGeometry(4.8, 0.05, 8, 48);

    const ring1 = new THREE.Mesh(ringGeo, ringMat1);
    const ring2 = new THREE.Mesh(ringGeo, ringMat2);
    const ring3 = new THREE.Mesh(ringGeo, ringMat3);

    ring1.rotation.x = Math.PI / 3;
    ring2.rotation.y = Math.PI / 3;
    ring3.rotation.z = Math.PI / 4;

    atomGroup.add(ring1);
    atomGroup.add(ring2);
    atomGroup.add(ring3);

    universeGroup.add(atomGroup);

    // --- 4. FLOATING GLOBAL CURRICULUM LATTICE SPHERE ---
    const globeGroup = new THREE.Group();
    globeGroup.position.set(2, 9, -12);

    const globeGeo = new THREE.SphereGeometry(3.0, 16, 16);
    const globeMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      wireframe: true,
      transparent: true,
      opacity: 0.4,
    });
    const globeMesh = new THREE.Mesh(globeGeo, globeMat);
    globeGroup.add(globeMesh);

    // Equatorial Ring
    const eqGeo = new THREE.RingGeometry(3.8, 4.0, 32);
    const eqMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5,
    });
    const eqMesh = new THREE.Mesh(eqGeo, eqMat);
    eqMesh.rotation.x = Math.PI / 2.2;
    globeGroup.add(eqMesh);

    universeGroup.add(globeGroup);

    // --- LIGHTING ---
    const ambientLight = new THREE.AmbientLight(0x2e1065, 1.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfef08a, 2.0); // Warm sunlight
    keyLight.position.set(12, 15, 20);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x818cf8, 1.8); // Cool violet rim
    rimLight.position.set(-15, -10, -10);
    scene.add(rimLight);

    // Mouse Tracking Event
    const handlePointerMove = (e: MouseEvent) => {
      mouseRef.current.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseRef.current.targetY = -(e.clientY / window.innerHeight - 0.5) * 2;
    };

    const handleResize = () => {
      if (!currentMount) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animationFrameId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Smooth camera parallax damping
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.04;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.04;

      camera.position.x = mouseRef.current.x * 2.5;
      camera.position.y = mouseRef.current.y * 2.0;
      camera.lookAt(0, 0, 0);

      // Rotate starfield slowly
      starField.rotation.y = elapsed * 0.025;
      starField.rotation.x = elapsed * 0.012;

      // Rotate Math Icosahedron
      icoGroup.rotation.x = elapsed * 0.35;
      icoGroup.rotation.y = elapsed * 0.45;
      icoGroup.position.y = 5 + Math.sin(elapsed * 0.8) * 0.8;

      // Rotate Atom rings and nucleus
      ring1.rotation.x = elapsed * 0.8;
      ring2.rotation.y = elapsed * 0.7;
      ring3.rotation.z = elapsed * 0.9;
      nucleus.rotation.y = elapsed * 0.5;
      atomGroup.position.y = -4 + Math.cos(elapsed * 0.9) * 0.9;

      // Rotate Globe Lattice
      globeMesh.rotation.y = elapsed * 0.2;
      eqMesh.rotation.z = elapsed * 0.15;
      globeGroup.position.y = 9 + Math.sin(elapsed * 0.7 + 1) * 0.7;

      // Dynamic Animation Mode Modifiers
      if (animationMode === 'quantum') {
        atomGroup.scale.setScalar(1.2 + Math.sin(elapsed * 2) * 0.15);
      } else if (animationMode === 'geometry') {
        icoGroup.scale.setScalar(1.2 + Math.cos(elapsed * 2) * 0.15);
      } else {
        atomGroup.scale.setScalar(1.0);
        icoGroup.scale.setScalar(1.0);
      }

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup on unmount
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);

      // Dispose Three.js objects to prevent memory leaks
      starGeometry.dispose();
      starMaterial.dispose();
      particleTexture.dispose();
      icoGeo.dispose();
      icoMat.dispose();
      innerCoreGeo.dispose();
      innerCoreMat.dispose();
      nucleusGeo.dispose();
      nucleusMat.dispose();
      ringGeo.dispose();
      ringMat1.dispose();
      ringMat2.dispose();
      ringMat3.dispose();
      globeGeo.dispose();
      globeMat.dispose();
      eqGeo.dispose();
      eqMat.dispose();

      renderer.dispose();
      if (currentMount && renderer.domElement) {
        currentMount.removeChild(renderer.domElement);
      }
    };
  }, [is3DActive, animationMode]);

  return (
    <>
      {/* 3D WebGL Canvas Layer (Fixed full-screen behind content) */}
      <div
        ref={mountRef}
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      />

      {/* Interactive 3D Mode Switcher (Discreet Bottom-Left Widget to engage students) */}
      <div className="fixed bottom-4 left-4 z-30 hidden md:flex items-center gap-2 bg-[#120730]/90 backdrop-blur-md border border-violet-500/30 px-3 py-1.5 rounded-full shadow-2xl text-xs">
        <div className="flex items-center gap-1.5 text-amber-300 font-semibold pr-2 border-r border-violet-800/60">
          <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
          <span>3D Cosmos</span>
        </div>

        {/* 3D Mode Selection Pills */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setAnimationMode('galaxy')}
            className={`px-2 py-0.5 rounded-full transition-all ${
              animationMode === 'galaxy'
                ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Galaxy Starfield Mode"
          >
            Galaxy
          </button>
          <button
            onClick={() => setAnimationMode('quantum')}
            className={`px-2 py-0.5 rounded-full transition-all ${
              animationMode === 'quantum'
                ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Quantum Atom Physics Mode"
          >
            Quantum
          </button>
          <button
            onClick={() => setAnimationMode('geometry')}
            className={`px-2 py-0.5 rounded-full transition-all ${
              animationMode === 'geometry'
                ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Sacred Geometry Math Mode"
          >
            Math
          </button>
        </div>

        {/* Toggle On/Off for accessibility / performance */}
        <button
          onClick={() => setIs3DActive(prev => !prev)}
          className={`ml-1 p-1 rounded-full text-[10px] font-mono transition-colors ${
            is3DActive ? 'text-emerald-400 hover:bg-emerald-500/20' : 'text-slate-500 hover:text-slate-300'
          }`}
          title={is3DActive ? 'Pause 3D animation' : 'Enable 3D animation'}
        >
          {is3DActive ? '● ON' : '○ OFF'}
        </button>
      </div>
    </>
  );
};
