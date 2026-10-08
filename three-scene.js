/**
 * FORMIQ — Master WebGL 3D Cinematic Scene Engine
 * Built with Three.js. Manages fluid spatial particles, 3D form geometry,
 * exploded architecture planes, and continuous camera choreography.
 */

(function () {
  'use strict';

  const canvas = document.getElementById('webgl-canvas');
  if (!canvas || typeof THREE === 'undefined') {
    console.warn('Three.js or Canvas missing; running in 2D fallback mode.');
    return;
  }

  // Scene, Camera, Renderer
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x000000, 0.0018);

  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
  );
  camera.position.set(0, 0, 100);

  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  // Mouse & Parallax State
  let mouseX = 0;
  let mouseY = 0;
  let targetMouseX = 0;
  let targetMouseY = 0;
  let isDragging = false;
  let previousMousePosition = { x: 0, y: 0 };
  let pipelineOrbitAngleX = 0;
  let pipelineOrbitAngleY = 0;

  // Active Cinematic Scene State (1 through 12)
  let currentSceneIndex = 1;
  let targetSceneIndex = 1;
  let sceneProgress = 0; // 0.0 to 1.0 within active scene

  // =========================================================================
  // 1. DYNAMIC PARTICLE SYSTEM (3,500 PARTICLES)
  // =========================================================================
  const PARTICLE_COUNT = 3200;
  const particleGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const basePositions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const sizes = new Float32Array(PARTICLE_COUNT);

  // Color constants
  const colWhite = new THREE.Color(0xffffff);
  const colElectric = new THREE.Color(0x00f0ff);
  const colDim = new THREE.Color(0x2a3040);
  const colEmerald = new THREE.Color(0x10b981);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const i3 = i * 3;
    // Initial void spread
    const r = Math.random() * 450 + 20;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);

    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = (Math.random() - 0.5) * 600;

    positions[i3] = x;
    positions[i3 + 1] = y;
    positions[i3 + 2] = z;

    basePositions[i3] = x;
    basePositions[i3 + 1] = y;
    basePositions[i3 + 2] = z;

    // Subtly colored particles
    const randCol = Math.random();
    let c = colWhite;
    if (randCol > 0.85) c = colElectric;
    else if (randCol > 0.6) c = colDim;

    colors[i3] = c.r;
    colors[i3 + 1] = c.g;
    colors[i3 + 2] = c.b;

    sizes[i] = Math.random() * 2.2 + 0.8;
  }

  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  particleGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  // Custom Point Texture Generator (Smooth glow point without external images)
  function createPointTexture() {
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 64;
    pCanvas.height = 64;
    const pCtx = pCanvas.getContext('2d');
    const grad = pCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.2, 'rgba(255,255,255,0.8)');
    grad.addColorStop(0.6, 'rgba(0,240,255,0.25)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    pCtx.fillStyle = grad;
    pCtx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(pCanvas);
  }

  const pointMat = new THREE.PointsMaterial({
    size: 2.4,
    vertexColors: true,
    map: createPointTexture(),
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const particleSystem = new THREE.Points(particleGeo, pointMat);
  scene.add(particleSystem);

  // =========================================================================
  // 2. 3D FLOATING FORM TABLET (SCENE 03)
  // =========================================================================
  const formGroup = new THREE.Group();
  const tabletGeo = new THREE.PlaneGeometry(70, 95);
  const tabletMat = new THREE.MeshBasicMaterial({
    color: 0x07090e,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.75
  });
  const tabletMesh = new THREE.Mesh(tabletGeo, tabletMat);

  // Glowing wireframe border
  const edgesGeo = new THREE.EdgesGeometry(tabletGeo);
  const edgesMat = new THREE.LineBasicMaterial({
    color: 0x00f0ff,
    transparent: true,
    opacity: 0.45
  });
  const tabletBorder = new THREE.LineSegments(edgesGeo, edgesMat);
  formGroup.add(tabletMesh);
  formGroup.add(tabletBorder);
  formGroup.position.set(0, 0, -200); // Initially recessed
  formGroup.visible = false;
  scene.add(formGroup);

  // =========================================================================
  // 3. 3D EXPLODED ARCHITECTURE STACK (SCENE 10)
  // =========================================================================
  const stackGroup = new THREE.Group();
  const layerPlanes = [];
  const LAYER_COUNT = 6;
  const layerColors = [0x38bdf8, 0x00f0ff, 0x94a3b8, 0x00f0ff, 0x10b981, 0x10b981];

  for (let l = 0; l < LAYER_COUNT; l++) {
    const lGeo = new THREE.PlaneGeometry(80, 48);
    const lMat = new THREE.MeshBasicMaterial({
      color: 0x0a0d14,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide
    });
    const lMesh = new THREE.Mesh(lGeo, lMat);
    lMesh.rotation.x = -Math.PI / 2.6;
    lMesh.position.y = (l - 2.5) * 16;

    const lEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(lGeo),
      new THREE.LineBasicMaterial({
        color: layerColors[l],
        transparent: true,
        opacity: 0.4
      })
    );
    lMesh.add(lEdges);
    layerPlanes.push(lMesh);
    stackGroup.add(lMesh);
  }
  stackGroup.position.set(0, -10, -180);
  stackGroup.visible = false;
  scene.add(stackGroup);

  // =========================================================================
  // 4. PIPELINE CONNECTING RAYS (SCENE 08)
  // =========================================================================
  const pipelineLineGeo = new THREE.BufferGeometry();
  const pipelinePts = [];
  for (let i = 0; i < 7; i++) {
    pipelinePts.push(new THREE.Vector3((i - 3) * 32, Math.sin(i * 0.8) * 8, 0));
  }
  const pipelineCurve = new THREE.CatmullRomCurve3(pipelinePts);
  const pipelineTubeGeo = new THREE.TubeGeometry(pipelineCurve, 64, 0.6, 8, false);
  const pipelineTubeMat = new THREE.MeshBasicMaterial({
    color: 0x00f0ff,
    transparent: true,
    opacity: 0.4,
    wireframe: true
  });
  const pipelineTube = new THREE.Mesh(pipelineTubeGeo, pipelineTubeMat);
  pipelineTube.position.set(0, 0, -120);
  pipelineTube.visible = false;
  scene.add(pipelineTube);

  // =========================================================================
  // 5. CLUSTER TARGET CENTERS (SCENE 05)
  // =========================================================================
  const clusterCenters = [
    new THREE.Vector3(-60, 25, -20),  // Infrastructure
    new THREE.Vector3(55, 30, -30),   // Scheduling
    new THREE.Vector3(-45, -35, -15), // Faculty
    new THREE.Vector3(50, -30, -25),  // Resources
    new THREE.Vector3(0, 0, -10)      // Experience
  ];

  // =========================================================================
  // WINDOW RESIZE & MOUSE EVENT HANDLERS
  // =========================================================================
  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', onWindowResize);

  window.addEventListener('mousemove', (e) => {
    targetMouseX = (e.clientX - window.innerWidth / 2) * 0.05;
    targetMouseY = (e.clientY - window.innerHeight / 2) * 0.05;

    // If dragging in Scene 8 (Pipeline exploration)
    if (isDragging && currentSceneIndex === 8) {
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;
      pipelineOrbitAngleY += deltaX * 0.005;
      pipelineOrbitAngleX += deltaY * 0.005;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    }
  });

  window.addEventListener('mousedown', (e) => {
    isDragging = true;
    previousMousePosition = { x: e.clientX, y: e.clientY };
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
  });

  // Touch Support for mobile/tablet interactive dragging
  window.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
      targetMouseX = (e.touches[0].clientX - window.innerWidth / 2) * 0.05;
      targetMouseY = (e.touches[0].clientY - window.innerHeight / 2) * 0.05;
    }
  }, { passive: true });

  // =========================================================================
  // MAIN ANIMATION LOOP & PHYSICS UPDATE
  // =========================================================================
  let clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    const time = clock.getElapsedTime();

    // Smooth Mouse Parallax Easing
    mouseX += (targetMouseX - mouseX) * 0.06;
    mouseY += (targetMouseY - mouseY) * 0.06;

    // Interpolate active scene
    currentSceneIndex += (targetSceneIndex - currentSceneIndex) * 0.08;
    const roundedScene = Math.round(currentSceneIndex);

    // Camera Framing according to Scene
    updateCameraChoreography(time);

    // Particle Physics Morphing based on Active Scene
    updateParticleBehaviors(time);

    // Object Visibilities & Transformations
    updateObjectStates(time, roundedScene);

    renderer.render(scene, camera);
  }

  function updateCameraChoreography(time) {
    let targetZ = 100;
    let targetX = mouseX * 0.5;
    let targetY = -mouseY * 0.5;

    switch (Math.round(currentSceneIndex)) {
      case 1: // The Void
        targetZ = 120 + Math.sin(time * 0.5) * 5;
        break;
      case 2: // Chaos fly-through
        targetZ = 40;
        break;
      case 3: // Form
        targetZ = 75;
        targetX += 15;
        break;
      case 4: // Collect
        targetZ = 85;
        break;
      case 5: // Intelligence clusters
        targetZ = 95;
        break;
      case 6: // Insight (negative space)
        targetZ = 110;
        break;
      case 7: // Decision
        targetZ = 80;
        targetX -= 12;
        break;
      case 8: // Pipeline Orbit
        targetZ = 90;
        targetX += pipelineOrbitAngleY * 40;
        targetY += pipelineOrbitAngleX * 30;
        break;
      case 9: // Multiple Worlds
        targetZ = 105;
        break;
      case 10: // Technology stack
        targetZ = 85;
        break;
      case 11: // Continuous transformation
        targetZ = 95;
        break;
      case 12: // Final void
        targetZ = 130;
        break;
    }

    camera.position.x += (targetX - camera.position.x) * 0.06;
    camera.position.y += (targetY - camera.position.y) * 0.06;
    camera.position.z += (targetZ - camera.position.z) * 0.06;
    camera.lookAt(0, 0, 0);
  }

  function updateParticleBehaviors(time) {
    const pos = particleGeo.attributes.position.array;
    const sceneIdx = Math.round(currentSceneIndex);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const bx = basePositions[i3];
      const by = basePositions[i3 + 1];
      const bz = basePositions[i3 + 2];

      if (sceneIdx === 1) {
        // The Void: Gentle cosmic drift around center
        pos[i3] += Math.sin(time * 0.3 + i) * 0.15;
        pos[i3 + 1] += Math.cos(time * 0.3 + i) * 0.15;
        pos[i3 + 2] += 0.2;
        if (pos[i3 + 2] > 200) pos[i3 + 2] = -400;
      } 
      else if (sceneIdx === 2) {
        // The Chaos: Rushing towards camera at hyper velocity
        pos[i3 + 2] += 4.5 + (i % 3);
        if (pos[i3 + 2] > 150) {
          pos[i3 + 2] = -450;
          pos[i3] = (Math.random() - 0.5) * 350;
          pos[i3 + 1] = (Math.random() - 0.5) * 250;
        }
      } 
      else if (sceneIdx === 3) {
        // Form: Collapsing inward to outline the rectangular form tablet
        const targetX = Math.sign(bx) * 36;
        const targetY = (by % 45);
        const targetZ = 0;
        pos[i3] += (targetX - pos[i3]) * 0.05;
        pos[i3 + 1] += (targetY - pos[i3 + 1]) * 0.05;
        pos[i3 + 2] += (targetZ - pos[i3 + 2]) * 0.05;
      } 
      else if (sceneIdx === 4) {
        // Collect: Swarming in from outer horizons toward (0,0,0)
        const dx = -pos[i3];
        const dy = -pos[i3 + 1];
        const dz = -pos[i3 + 2];
        pos[i3] += dx * 0.04;
        pos[i3 + 1] += dy * 0.04;
        pos[i3 + 2] += dz * 0.04;
        if (Math.abs(pos[i3]) < 5 && Math.abs(pos[i3 + 1]) < 5) {
          pos[i3] = (Math.random() - 0.5) * 380;
          pos[i3 + 1] = (Math.random() - 0.5) * 280;
          pos[i3 + 2] = (Math.random() - 0.5) * 200;
        }
      } 
      else if (sceneIdx === 5) {
        // Intelligence: Converging into 5 distinct spatial clusters!
        const cTarget = clusterCenters[i % 5];
        const jx = Math.sin(time * 2 + i) * 6;
        const jy = Math.cos(time * 2 + i) * 6;
        const jz = Math.sin(time + i) * 6;
        pos[i3] += (cTarget.x + jx - pos[i3]) * 0.04;
        pos[i3 + 1] += (cTarget.y + jy - pos[i3 + 1]) * 0.04;
        pos[i3 + 2] += (cTarget.z + jz - pos[i3 + 2]) * 0.04;
      } 
      else if (sceneIdx === 6) {
        // Insight: Opening vast negative space in the center, framing insight
        const dist = Math.sqrt(pos[i3] * pos[i3] + pos[i3 + 1] * pos[i3 + 1]);
        if (dist < 65) {
          pos[i3] *= 1.08;
          pos[i3 + 1] *= 1.08;
        }
      } 
      else if (sceneIdx === 8) {
        // Pipeline: Aligning along horizontal stream
        const step = (i % 7);
        const pt = pipelinePts[step];
        pos[i3] += (pt.x + (Math.random() - 0.5) * 10 - pos[i3]) * 0.05;
        pos[i3 + 1] += (pt.y + (Math.random() - 0.5) * 10 - pos[i3 + 1]) * 0.05;
        pos[i3 + 2] += (pt.z - 120 - pos[i3 + 2]) * 0.05;
      } 
      else if (sceneIdx === 10) {
        // Technology: Floating in planes
        const planeIdx = i % 6;
        const py = (planeIdx - 2.5) * 16;
        pos[i3] += (bx * 0.25 - pos[i3]) * 0.05;
        pos[i3 + 1] += (py - pos[i3 + 1]) * 0.05;
        pos[i3 + 2] += (-160 - pos[i3 + 2]) * 0.05;
      } 
      else if (sceneIdx === 11) {
        // Transformation: Morphing into high-order crystal lattice grid
        const gx = ((i % 25) - 12) * 14;
        const gy = ((Math.floor(i / 25) % 20) - 10) * 12;
        const gz = -50;
        pos[i3] += (gx - pos[i3]) * 0.05;
        pos[i3 + 1] += (gy - pos[i3 + 1]) * 0.05;
        pos[i3 + 2] += (gz - pos[i3 + 2]) * 0.05;
      } 
      else if (sceneIdx === 12) {
        // Final: Dissipating into deep void
        pos[i3 + 2] += 0.1;
        pos[i3] *= 0.992;
        pos[i3 + 1] *= 0.992;
      } 
      else {
        // Default graceful return
        pos[i3] += (bx - pos[i3]) * 0.02;
        pos[i3 + 1] += (by - pos[i3 + 1]) * 0.02;
        pos[i3 + 2] += (bz - pos[i3 + 2]) * 0.02;
      }
    }

    particleGeo.attributes.position.needsUpdate = true;
  }

  function updateObjectStates(time, sceneIdx) {
    // 3D Tablet in Scene 3
    if (sceneIdx === 3) {
      formGroup.visible = true;
      formGroup.position.z += (0 - formGroup.position.z) * 0.06;
      formGroup.rotation.y = Math.sin(time * 0.8) * 0.12 + (mouseX * 0.005);
      formGroup.rotation.x = Math.cos(time * 0.6) * 0.08 - (mouseY * 0.005);
    } else {
      formGroup.position.z += (-220 - formGroup.position.z) * 0.06;
      if (formGroup.position.z < -200) formGroup.visible = false;
    }

    // Exploded Architecture Stack in Scene 10
    if (sceneIdx === 10) {
      stackGroup.visible = true;
      stackGroup.position.z += (-60 - stackGroup.position.z) * 0.06;
      stackGroup.rotation.y = time * 0.2 + (mouseX * 0.008);
      // Independent breathing motion for layers
      layerPlanes.forEach((mesh, idx) => {
        mesh.position.y = (idx - 2.5) * 16 + Math.sin(time * 1.5 + idx) * 1.5;
      });
    } else {
      stackGroup.position.z += (-220 - stackGroup.position.z) * 0.06;
      if (stackGroup.position.z < -200) stackGroup.visible = false;
    }

    // Pipeline in Scene 8
    if (sceneIdx === 8) {
      pipelineTube.visible = true;
      pipelineTube.position.z += (0 - pipelineTube.position.z) * 0.06;
      pipelineTube.rotation.y = pipelineOrbitAngleY;
      pipelineTube.rotation.x = pipelineOrbitAngleX;
    } else {
      pipelineTube.position.z += (-180 - pipelineTube.position.z) * 0.06;
      if (pipelineTube.position.z < -160) pipelineTube.visible = false;
    }
  }

  animate();

  // Expose Global Hook to Sync Camera & Particles with ScrollTrigger / HUD
  window.setCinematicScene = function (index, progress = 0) {
    targetSceneIndex = index;
    sceneProgress = progress;
  };

})();
