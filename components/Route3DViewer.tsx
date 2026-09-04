import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Play, Pause, RotateCcw, Eye, Compass, Layers, Info } from 'lucide-react';

interface Checkpoint3D {
  id: string;
  name: string;
  lat: number;
  lng: number;
  xp_reward?: number;
  description?: string;
}

interface Route3DViewerProps {
  checkpoints: Checkpoint3D[];
  routeName: string;
  difficulty?: string;
  onSelectCheckpoint?: (cp: Checkpoint3D) => void;
}

export const Route3DViewer: React.FC<Route3DViewerProps> = ({
  checkpoints,
  routeName,
  difficulty = 'moderado',
  onSelectCheckpoint
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeCheckpointIndex, setActiveCheckpointIndex] = useState<number | null>(null);
  const [isRotating, setIsRotating] = useState<boolean>(true);

  // References for animation and control
  const animFrameId = useRef<number | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const curveRef = useRef<THREE.CatmullRomCurve3 | null>(null);
  const flyProgressRef = useRef<number>(0);
  const controlsRef = useRef<{
    isDragging: boolean;
    prevX: number;
    prevY: number;
    theta: number; // Azimuth
    phi: number;   // Polar elevation
    radius: number;
    center: THREE.Vector3;
  }>({
    isDragging: false,
    prevX: 0,
    prevY: 0,
    theta: Math.PI / 4,
    phi: Math.PI / 3.5,
    radius: 38,
    center: new THREE.Vector3(0, 0, 0)
  });

  const getThemeColor = (diff: string) => {
    const d = diff.toLowerCase();
    if (d.includes('fácil') || d.includes('facil') || d.includes('easy')) return 0x10b981;
    if (d.includes('moderado') || d.includes('medio')) return 0x3b82f6;
    if (d.includes('difícil') || d.includes('dificil')) return 0xf59e0b;
    return 0xef4444;
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container || !checkpoints || checkpoints.length === 0) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 340;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0a0f1d);
    scene.fog = new THREE.FogExp2(0x0a0f1d, 0.015);

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    cameraRef.current = camera;

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xdde8ff, 0.75);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff1cf, 1.8);
    sunLight.position.set(30, 45, 25);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);

    const blueRimLight = new THREE.DirectionalLight(0x38bdf8, 0.8);
    blueRimLight.position.set(-30, 20, -25);
    scene.add(blueRimLight);

    // 5. Convert GPS coords into 3D Normalized Coordinates
    const lats = checkpoints.map(c => c.lat);
    const lngs = checkpoints.map(c => c.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const latSpan = Math.max(maxLat - minLat, 0.005);
    const lngSpan = Math.max(maxLng - minLng, 0.005);
    const mapScale = 22; // Plane span

    // 6. Realistic Patagonian Glacial Valley Terrain
    const terrainSize = 40;
    const terrainSegments = 70;
    const terrainGeo = new THREE.PlaneGeometry(terrainSize, terrainSize, terrainSegments, terrainSegments);
    terrainGeo.rotateX(-Math.PI / 2);

    const posAttr = terrainGeo.attributes.position;
    // Procedural organic mountainous relief
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);

      // Distance from center to create fjord/glacier valley trough
      const valleyTrough = Math.sin(x * 0.15) * 1.5;
      const mountainRidge = 
        Math.sin(x * 0.22) * Math.cos(z * 0.22) * 3.2 +
        Math.sin(x * 0.45 + 1.2) * Math.cos(z * 0.35) * 1.6 +
        Math.sin(x * 0.9) * 0.5;

      // Higher peaks around the edges
      const edgeFactor = Math.pow(Math.sqrt(x * x + z * z) / (terrainSize * 0.5), 2) * 3.5;
      
      let elevation = mountainRidge + edgeFactor + valleyTrough;
      if (elevation < 0.2) elevation = 0.2; // Lake level floor

      posAttr.setY(i, elevation);
    }
    terrainGeo.computeVertexNormals();

    // Material: Mountain rock with subtle elevation vertex shading effect
    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.85,
      metalness: 0.1,
      flatShading: true
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.receiveShadow = true;
    scene.add(terrainMesh);

    // Lake / Fiord Water Plane
    const waterGeo = new THREE.PlaneGeometry(terrainSize * 0.85, terrainSize * 0.85);
    waterGeo.rotateX(-Math.PI / 2);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.65
    });
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.position.y = 0.6;
    scene.add(waterMesh);

    // Grid wireframe subtly overlaying for high-tech topographic aesthetic
    const grid = new THREE.GridHelper(terrainSize, 24, 0x38bdf8, 0x1e3a5f);
    grid.position.y = 0.1;
    (grid.material as THREE.Material).opacity = 0.25;
    (grid.material as THREE.Material).transparent = true;
    scene.add(grid);

    // 7. Route 3D Points & Glowing Path
    const routePoints: THREE.Vector3[] = checkpoints.map((cp, idx) => {
      // Map lat/lng to terrain local coordinates
      const normX = ((cp.lng - minLng) / lngSpan - 0.5) * mapScale;
      const normZ = -((cp.lat - minLat) / latSpan - 0.5) * mapScale;
      
      // Calculate realistic elevation: valley floor to uphill checkpoints
      const baseAlt = 1.4 + Math.sin(idx / Math.max(checkpoints.length - 1, 1) * Math.PI) * 2.8 + (idx * 0.4);
      return new THREE.Vector3(normX, baseAlt, normZ);
    });

    const routeColor = getThemeColor(difficulty);

    // If only 1 checkpoint, duplicate slightly to make a curve
    let curvePts = [...routePoints];
    if (curvePts.length === 1) {
      curvePts.push(new THREE.Vector3(curvePts[0].x + 1, curvePts[0].y, curvePts[0].z + 1));
    }
    const curve = new THREE.CatmullRomCurve3(curvePts, false, 'catmullrom', 0.2);
    curveRef.current = curve;

    // Glowing 3D Tube for the Route Path
    const tubeGeo = new THREE.TubeGeometry(curve, 100, 0.22, 10, false);
    const tubeMat = new THREE.MeshStandardMaterial({
      color: routeColor,
      emissive: routeColor,
      emissiveIntensity: 0.85,
      roughness: 0.2,
      metalness: 0.3
    });
    const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
    scene.add(tubeMesh);

    // Animated Runner / Pulse Ball on Path
    const runnerGeo = new THREE.SphereGeometry(0.5, 16, 16);
    const runnerMat = new THREE.MeshBasicMaterial({
      color: 0xffffff
    });
    const runnerMesh = new THREE.Mesh(runnerGeo, runnerMat);
    scene.add(runnerMesh);

    // Add Beacon Checkpoint Markers
    checkpoints.forEach((cp, idx) => {
      const pt = routePoints[idx];

      // Vertical Laser Line
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(pt.x, 0.5, pt.z),
        new THREE.Vector3(pt.x, pt.y + 2.2, pt.z)
      ]);
      const lineMat = new THREE.LineBasicMaterial({
        color: routeColor,
        transparent: true,
        opacity: 0.5
      });
      const laserLine = new THREE.Line(lineGeo, lineMat);
      scene.add(laserLine);

      // Checkpoint Floating Gem/Pin
      const pinGeo = new THREE.OctahedronGeometry(0.75, 0);
      const pinMat = new THREE.MeshStandardMaterial({
        color: idx === 0 ? 0x10b981 : (idx === checkpoints.length - 1 ? 0xf59e0b : routeColor),
        emissive: routeColor,
        emissiveIntensity: 0.6,
        roughness: 0.1,
        metalness: 0.9
      });
      const pinMesh = new THREE.Mesh(pinGeo, pinMat);
      pinMesh.position.set(pt.x, pt.y + 2.2, pt.z);
      pinMesh.name = `checkpoint_${idx}`;
      scene.add(pinMesh);

      // Glow Ring at ground base
      const ringGeo = new THREE.RingGeometry(0.4, 0.7, 24);
      ringGeo.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: routeColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.set(pt.x, 0.7, pt.z);
      scene.add(ringMesh);
    });

    // 8. Orbit & Camera Handling
    const updateCameraPos = () => {
      const ctrl = controlsRef.current;
      const x = ctrl.center.x + ctrl.radius * Math.sin(ctrl.phi) * Math.sin(ctrl.theta);
      const y = ctrl.center.y + ctrl.radius * Math.cos(ctrl.phi);
      const z = ctrl.center.z + ctrl.radius * Math.sin(ctrl.phi) * Math.cos(ctrl.theta);
      camera.position.set(x, y, z);
      camera.lookAt(ctrl.center);
    };

    updateCameraPos();

    // Mouse / Touch Drag Handlers
    const onMouseDown = (e: MouseEvent) => {
      controlsRef.current.isDragging = true;
      controlsRef.current.prevX = e.clientX;
      controlsRef.current.prevY = e.clientY;
      setIsRotating(false);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!controlsRef.current.isDragging) return;
      const deltaX = e.clientX - controlsRef.current.prevX;
      const deltaY = e.clientY - controlsRef.current.prevY;
      controlsRef.current.prevX = e.clientX;
      controlsRef.current.prevY = e.clientY;

      controlsRef.current.theta -= deltaX * 0.008;
      controlsRef.current.phi = Math.max(0.2, Math.min(Math.PI / 2.2, controlsRef.current.phi - deltaY * 0.008));
      updateCameraPos();
    };

    const onMouseUp = () => {
      controlsRef.current.isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      controlsRef.current.radius = Math.max(12, Math.min(65, controlsRef.current.radius + e.deltaY * 0.04));
      updateCameraPos();
    };

    // Touch support for Mobile
    let touchStartX = 0;
    let touchStartY = 0;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        setIsRotating(false);
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const deltaX = e.touches[0].clientX - touchStartX;
        const deltaY = e.touches[0].clientY - touchStartY;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;

        controlsRef.current.theta -= deltaX * 0.01;
        controlsRef.current.phi = Math.max(0.2, Math.min(Math.PI / 2.2, controlsRef.current.phi - deltaY * 0.01));
        updateCameraPos();
      }
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('wheel', onWheel, { passive: false });
    dom.addEventListener('touchstart', onTouchStart, { passive: true });
    dom.addEventListener('touchmove', onTouchMove, { passive: true });

    // Handle Resize
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 9. Animation Loop
    let clock = new THREE.Clock();
    const animate = () => {
      animFrameId.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Gentle auto-rotation when user is not manually navigating
      if (isRotating && !controlsRef.current.isDragging && !isPlaying) {
        controlsRef.current.theta += delta * 0.12;
        updateCameraPos();
      }

      // Pulse and bobbing checkpoint pins
      scene.children.forEach(child => {
        if (child.name.startsWith('checkpoint_')) {
          child.rotation.y += delta * 1.5;
          child.rotation.z += delta * 0.8;
          child.position.y += Math.sin(time * 3 + Number(child.name.split('_')[1])) * 0.004;
        }
      });

      // Runner particle progress along spline
      if (curveRef.current) {
        const pulseT = (time * 0.25) % 1;
        const runnerPos = curveRef.current.getPointAt(pulseT);
        runnerMesh.position.copy(runnerPos);

        // Flyover Camera Mode
        if (isPlaying) {
          flyProgressRef.current = (flyProgressRef.current + delta * 0.08) % 1;
          const camPos = curveRef.current.getPointAt(flyProgressRef.current);
          const tangent = curveRef.current.getTangentAt(flyProgressRef.current);

          camera.position.set(camPos.x - tangent.x * 4, camPos.y + 3.5, camPos.z - tangent.z * 4);
          const lookAtTarget = new THREE.Vector3().copy(camPos).add(tangent.multiplyScalar(4));
          camera.lookAt(lookAtTarget);

          // Update active checkpoint highlight
          const currentCpIdx = Math.floor(flyProgressRef.current * checkpoints.length);
          setActiveCheckpointIndex(currentCpIdx);
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('wheel', onWheel);
      dom.removeEventListener('touchstart', onTouchStart);
      dom.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      terrainGeo.dispose();
      terrainMat.dispose();
      if (container.contains(dom)) container.removeChild(dom);
    };
  }, [checkpoints, difficulty, isPlaying, isRotating]);

  const toggleFlyover = () => {
    setIsPlaying(prev => {
      const nextState = !prev;
      if (nextState) {
        setIsRotating(false);
      } else {
        // Reset camera orbit to standard view
        controlsRef.current.theta = Math.PI / 4;
        controlsRef.current.phi = Math.PI / 3.5;
        controlsRef.current.radius = 38;
        if (cameraRef.current) {
          cameraRef.current.position.set(25, 20, 25);
          cameraRef.current.lookAt(0, 0, 0);
        }
      }
      return nextState;
    });
  };

  const resetView = () => {
    setIsPlaying(false);
    setIsRotating(true);
    controlsRef.current.theta = Math.PI / 4;
    controlsRef.current.phi = Math.PI / 3.5;
    controlsRef.current.radius = 38;
    if (cameraRef.current) {
      cameraRef.current.position.set(25, 20, 25);
      cameraRef.current.lookAt(0, 0, 0);
    }
  };

  return (
    <div className="relative w-full h-[360px] rounded-[2.5rem] overflow-hidden border border-cyan-500/20 shadow-[0_0_40px_rgba(6,182,212,0.15)] bg-slate-950 select-none">
      {/* Three.js Canvas Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Overlay Badge */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-cyan-500/30 text-xs font-bold text-cyan-300 shadow-lg">
        <Compass className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '8s' }} />
        <span className="tracking-wider uppercase text-[10px]">Relieve 3D Patagónico</span>
      </div>

      {/* Top Right Checkpoint Count */}
      <div className="absolute top-4 right-4 z-20 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-[10px] font-black text-slate-300">
        {checkpoints.length} HITOS 3D
      </div>

      {/* Bottom Floating Control Bar */}
      <div className="absolute bottom-4 inset-x-4 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={toggleFlyover}
            className={`px-4 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-xl transition-all active:scale-95 ${
              isPlaying
                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Pausar Vuelo</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Sobrevolar Ruta</span>
              </>
            )}
          </button>

          <button
            onClick={resetView}
            title="Restablecer cámara"
            className="w-10 h-10 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-white/10 flex items-center justify-center backdrop-blur-md transition-all active:scale-95 shadow-lg"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-md px-3 py-2 rounded-2xl border border-white/10 text-[10px] text-slate-400 flex items-center gap-1.5 pointer-events-auto">
          <Eye className="w-3.5 h-3.5 text-cyan-400" />
          <span>Arrastra para rotar • Rueda para zoom</span>
        </div>
      </div>
    </div>
  );
};
