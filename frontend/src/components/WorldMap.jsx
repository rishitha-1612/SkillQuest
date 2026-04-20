import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

const CLUSTER_ANCHORS = {
  ai_data: { lat: 40, lon: -105 },
  cloud_infrastructure: { lat: 28, lon: 92 },
};

const CLUSTER_OFFSETS = {
  ai_data: [
    { lat: 8, lon: -18 },
    { lat: 14, lon: -4 },
    { lat: 10, lon: 10 },
    { lat: 2, lon: -16 },
    { lat: 2, lon: 0 },
    { lat: -4, lon: 14 },
    { lat: -8, lon: -2 },
  ],
  cloud_infrastructure: [
    { lat: 10, lon: -20 },
    { lat: 14, lon: -5 },
    { lat: 10, lon: 10 },
    { lat: 4, lon: -16 },
    { lat: 2, lon: 0 },
    { lat: -4, lon: 14 },
    { lat: -10, lon: -2 },
  ],
};

function latLonToVector3(lat, lon, radius = 1.02) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function projectLabel(vector, camera, width, height) {
  const projected = vector.clone().project(camera);
  return {
    x: (projected.x * 0.5 + 0.5) * width,
    y: (-projected.y * 0.5 + 0.5) * height,
    visible: projected.z < 1,
  };
}

function buildOverlayTexture(countryMetrics, selectedCountryId) {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  const hitAreas = [];

  const complexityValues = countryMetrics.map((country) => country.complexity || 1);
  const min = Math.min(...complexityValues, 1);
  const max = Math.max(...complexityValues, 1);

  function radiusFor(complexity) {
    const normalized = max === min ? 0.5 : (complexity - min) / (max - min);
    return 26 + normalized * 42;
  }

  function lonLatToCanvas(lat, lon) {
    return {
      x: ((lon + 180) / 360) * canvas.width,
      y: ((90 - lat) / 180) * canvas.height,
    };
  }

  countryMetrics.forEach((country, idx) => {
    const cluster = CLUSTER_ANCHORS[country.continentId] || { lat: 0, lon: 0 };
    const offsets = CLUSTER_OFFSETS[country.continentId] || [{ lat: 0, lon: 0 }];
    const offset = offsets[idx % offsets.length];
    const lat = cluster.lat + offset.lat;
    const lon = cluster.lon + offset.lon;
    const radius = radiusFor(country.complexity || 1);
    const { x, y } = lonLatToCanvas(lat, lon);
    const active = country.id === selectedCountryId;

    ctx.beginPath();
    ctx.ellipse(x, y, radius * 1.4, radius, 0, 0, Math.PI * 2);
    ctx.fillStyle = active ? 'rgba(255, 227, 122, 0.54)' : 'rgba(110, 221, 120, 0.24)';
    ctx.fill();
    ctx.lineWidth = active ? 4 : 2;
    ctx.strokeStyle = active ? 'rgba(255, 244, 188, 0.96)' : 'rgba(190, 255, 210, 0.52)';
    ctx.stroke();

    hitAreas.push({ country, lat, lon });
  });

  return {
    texture: new THREE.CanvasTexture(canvas),
    hitAreas,
  };
}

function buildLevels(nodes, edges) {
  const indeg = new Map(nodes.map((n) => [n.id, 0]));
  const outgoing = new Map(nodes.map((n) => [n.id, []]));
  edges.forEach(([from, to]) => {
    if (outgoing.has(from) && indeg.has(to)) {
      outgoing.get(from).push(to);
      indeg.set(to, indeg.get(to) + 1);
    }
  });
  const queue = [];
  indeg.forEach((v, k) => {
    if (v === 0) queue.push(k);
  });
  const level = new Map(nodes.map((n) => [n.id, 0]));
  for (let i = 0; i < queue.length; i += 1) {
    const cur = queue[i];
    outgoing.get(cur).forEach((nxt) => {
      level.set(nxt, Math.max(level.get(nxt), level.get(cur) + 1));
      indeg.set(nxt, indeg.get(nxt) - 1);
      if (indeg.get(nxt) === 0) queue.push(nxt);
    });
  }
  return level;
}

const COUNTRY_SHAPES = {
  ai_data: {
    name: 'India',
    silhouette: 'M335,52 L420,66 L490,118 L546,154 L579,240 L558,336 L492,418 L440,508 L362,522 L316,468 L260,448 L208,384 L194,300 L220,214 L268,162 L300,102 Z',
    states: [
      { id: 'python_programming', title: 'Python', path: 'M282,162 L344,156 L362,214 L318,252 L266,226 Z' },
      { id: 'mathematics_statistics', title: 'Math', path: 'M360,154 L436,168 L444,244 L368,246 Z' },
      { id: 'machine_learning', title: 'ML', path: 'M454,186 L520,204 L512,292 L444,276 Z' },
      { id: 'deep_learning', title: 'Deep Learning', path: 'M298,272 L380,266 L402,352 L332,386 L274,340 Z' },
      { id: 'data_visualization', title: 'Data Viz', path: 'M402,286 L496,302 L474,388 L396,394 Z' },
    ],
  },
  cloud_infrastructure: {
    name: 'Japan',
    silhouette: 'M424,60 L458,96 L446,152 L476,188 L456,252 L492,316 L466,402 L420,488 L382,466 L394,392 L356,334 L372,266 L338,194 L366,122 L392,84 Z',
    states: [
      { id: 'cloud_platforms', title: 'Cloud', path: 'M392,108 L430,114 L424,176 L390,164 Z' },
      { id: 'networking_fundamentals', title: 'Network', path: 'M406,186 L446,200 L434,264 L396,246 Z' },
      { id: 'containers_orchestration', title: 'Containers', path: 'M420,274 L468,292 L450,344 L406,328 Z' },
      { id: 'ci_cd_pipelines', title: 'CI/CD', path: 'M432,352 L474,370 L456,420 L416,408 Z' },
      { id: 'system_design', title: 'System Design', path: 'M414,426 L452,442 L438,482 L404,470 Z' },
    ],
  },
};

function CountryPopup({ country, roleDetails, stateById, selectedStateId, onStateSelect, onBack }) {
  const states = country?.states || [];
  const shape = COUNTRY_SHAPES[country?.continentId] || COUNTRY_SHAPES.ai_data;
  const stateShapes = shape.states.filter((item) => states.includes(item.id));
  const nodeCounts = states.map((stateId) => stateById.get(stateId)?.nodes?.length || 1);
  const maxNodes = Math.max(...nodeCounts, 1);

  return (
    <div className="map-popup map-popup-country">
      <div className="map-toolbar">
        <button className="back-btn" onClick={onBack}>Close Country</button>
        <div>
          <h3>{shape.name} / {country.title}</h3>
          <p>{roleDetails?.summary || 'Open a skill cluster to inspect its learning pathway.'}</p>
        </div>
      </div>

      <svg className="country-map-svg" viewBox="0 0 760 580">
        <path d={shape.silhouette} className="country-silhouette" />
        {stateShapes.map((stateShape) => {
          const state = stateById.get(stateShape.id);
          const active = selectedStateId === stateShape.id;
          const complexityScale = ((state?.nodes?.length || 1) / maxNodes) * 0.12;
          return (
            <g key={stateShape.id} onClick={() => onStateSelect(stateShape.id)} className="state-region-group">
              <path
                d={stateShape.path}
                className={active ? 'state-region active' : 'state-region'}
                style={{ transformOrigin: '380px 290px', transform: `scale(${1 + complexityScale})` }}
              />
              <text x={380} y={290} textAnchor="middle" className="state-region-title state-region-title-hidden">
                {stateShape.title}
              </text>
              <text
                x={stateShape.id === 'python_programming' ? 310 : stateShape.id === 'mathematics_statistics' ? 402 : stateShape.id === 'machine_learning' ? 478 : stateShape.id === 'deep_learning' ? 338 : stateShape.id === 'data_visualization' ? 438 : stateShape.id === 'cloud_platforms' ? 408 : stateShape.id === 'networking_fundamentals' ? 420 : stateShape.id === 'containers_orchestration' ? 434 : stateShape.id === 'ci_cd_pipelines' ? 444 : 424}
                y={stateShape.id === 'python_programming' ? 204 : stateShape.id === 'mathematics_statistics' ? 206 : stateShape.id === 'machine_learning' ? 246 : stateShape.id === 'deep_learning' ? 330 : stateShape.id === 'data_visualization' ? 344 : stateShape.id === 'cloud_platforms' ? 146 : stateShape.id === 'networking_fundamentals' ? 226 : stateShape.id === 'containers_orchestration' ? 310 : stateShape.id === 'ci_cd_pipelines' ? 390 : 458}
                textAnchor="middle"
                className="state-region-title"
              >
                {stateShape.title}
              </text>
              <text
                x={stateShape.id === 'python_programming' ? 310 : stateShape.id === 'mathematics_statistics' ? 402 : stateShape.id === 'machine_learning' ? 478 : stateShape.id === 'deep_learning' ? 338 : stateShape.id === 'data_visualization' ? 438 : stateShape.id === 'cloud_platforms' ? 408 : stateShape.id === 'networking_fundamentals' ? 420 : stateShape.id === 'containers_orchestration' ? 434 : stateShape.id === 'ci_cd_pipelines' ? 444 : 424}
                y={stateShape.id === 'python_programming' ? 224 : stateShape.id === 'mathematics_statistics' ? 226 : stateShape.id === 'machine_learning' ? 266 : stateShape.id === 'deep_learning' ? 350 : stateShape.id === 'data_visualization' ? 364 : stateShape.id === 'cloud_platforms' ? 164 : stateShape.id === 'networking_fundamentals' ? 244 : stateShape.id === 'containers_orchestration' ? 328 : stateShape.id === 'ci_cd_pipelines' ? 408 : 476}
                textAnchor="middle"
                className="state-region-sub"
              >
                {state?.nodes?.length || 0} cities
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function StatePopup({ stateDetails, onBack }) {
  const nodes = stateDetails?.nodes || [];
  const edges = stateDetails?.edges || [];
  if (!stateDetails) return null;

  const levels = buildLevels(nodes, edges);
  const grouped = new Map();
  nodes.forEach((node) => {
    const l = levels.get(node.id) || 0;
    if (!grouped.has(l)) grouped.set(l, []);
    grouped.get(l).push(node);
  });

  const cols = [...grouped.keys()].sort((a, b) => a - b);
  const positions = new Map();
  cols.forEach((colId, colIndex) => {
    grouped.get(colId).forEach((node, rowIndex) => {
      positions.set(node.id, {
        x: 110 + colIndex * 190,
        y: 120 + rowIndex * 110,
      });
    });
  });

  return (
    <div className="map-popup map-popup-state">
      <div className="map-toolbar">
        <button className="back-btn" onClick={onBack}>Close State</button>
        <div>
          <h3>{stateDetails.title}</h3>
          <p>District-style state map with cities renamed to subskills. Arrows show the learning order.</p>
        </div>
      </div>

      <div className="state-map-scroll">
        <svg className="state-map-svg" width="980" height={Math.max(420, 180 + nodes.length * 54)}>
          <defs>
            <marker id="path-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 Z" fill="#678cd8" />
            </marker>
          </defs>
          {edges.map(([from, to]) => {
            const a = positions.get(from);
            const b = positions.get(to);
            if (!a || !b) return null;
            return (
              <line
                key={`${from}-${to}`}
                x1={a.x + 68}
                y1={a.y}
                x2={b.x - 68}
                y2={b.y}
                className="state-path-edge"
                markerEnd="url(#path-arrow)"
              />
            );
          })}
          {nodes.map((node) => {
            const p = positions.get(node.id);
            return (
              <g key={node.id}>
                <rect x={p.x - 54} y={p.y - 54} width="108" height="108" rx="22" className="district-cell" />
                <circle cx={p.x} cy={p.y} r="34" className="city-node" />
                <text x={p.x} y={p.y - 4} textAnchor="middle" className="city-label">
                  {node.title}
                </text>
                <text x={p.x} y={p.y + 14} textAnchor="middle" className="city-meta">
                  {node.type}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="city-list-inline">
        {nodes.map((node) => (
          <article key={node.id} className="city-card">
            <h4>{node.title}</h4>
            <p>{node.description}</p>
            <small>{node.type} • {node.estimated_time_minutes} mins • {node.xp_reward} XP</small>
          </article>
        ))}
      </div>
    </div>
  );
}

function GlobeMode({ countryMetrics, selectedCountryId, onCountrySelect }) {
  const mountRef = useRef(null);
  const overlayRef = useRef(null);
  const frameRef = useRef(0);
  const labelsRef = useRef([]);
  const [projected, setProjected] = useState([]);

  const overlayData = useMemo(
    () => buildOverlayTexture(countryMetrics, selectedCountryId),
    [countryMetrics, selectedCountryId]
  );

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, mount.clientWidth / 620, 0.1, 1000);
    camera.position.z = 3;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, 620);
    mount.appendChild(renderer.domElement);

    const textureLoader = new THREE.TextureLoader();
    const earthMap = textureLoader.load('https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg');
    const bumpMap = textureLoader.load('https://threejs.org/examples/textures/planets/earth_bump_4096.jpg');
    const specMap = textureLoader.load('https://threejs.org/examples/textures/planets/earth_specular_2048.jpg');

    scene.add(new THREE.AmbientLight(0xffffff, 1.1));
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.95);
    keyLight.position.set(3, 2, 4);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0x9bd6ff, 0.45);
    rimLight.position.set(-4, -2, -3);
    scene.add(rimLight);

    const earth = new THREE.Mesh(
      new THREE.SphereGeometry(1, 96, 96),
      new THREE.MeshPhongMaterial({
        map: earthMap,
        bumpMap,
        bumpScale: 0.05,
        specularMap: specMap,
        specular: new THREE.Color(0x444444),
        shininess: 10,
      })
    );

    const overlay = new THREE.Mesh(
      new THREE.SphereGeometry(1.006, 96, 96),
      new THREE.MeshPhongMaterial({
        map: overlayData.texture,
        transparent: true,
        depthWrite: false,
      })
    );

    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.05, 64, 64),
      new THREE.MeshPhongMaterial({
        color: 0x7fc8ff,
        transparent: true,
        opacity: 0.09,
        side: THREE.BackSide,
      })
    );

    scene.add(earth);
    scene.add(overlay);
    scene.add(atmosphere);

    let dragging = false;
    let prevX = 0;
    let prevY = 0;
    let velX = 0.0014;
    let velY = 0;

    function updateLabels() {
      const width = mount.clientWidth;
      const height = 620;
      const nextLabels = labelsRef.current.map((item) => {
        const pos = projectLabel(latLonToVector3(item.lat, item.lon, 1.08), camera, width, height);
        const frontFacing = latLonToVector3(item.lat, item.lon, 1.02).applyQuaternion(earth.quaternion).z > -0.15;
        return { ...item, ...pos, visible: pos.visible && frontFacing };
      });
      setProjected(nextLabels);
    }

    function animate() {
      frameRef.current = requestAnimationFrame(animate);
      if (!dragging) {
        earth.rotation.y += velX;
        overlay.rotation.y += velX;
        atmosphere.rotation.y += velX;
        earth.rotation.x += velY;
        overlay.rotation.x += velY;
        atmosphere.rotation.x += velY;
        velX *= 0.992;
        velY *= 0.992;
        if (Math.abs(velX) < 0.0007) velX = 0.0007;
      }
      renderer.render(scene, camera);
      updateLabels();
    }

    function onPointerDown(event) {
      dragging = true;
      prevX = event.clientX;
      prevY = event.clientY;
    }

    function onPointerMove(event) {
      if (!dragging) return;
      const dx = event.clientX - prevX;
      const dy = event.clientY - prevY;
      prevX = event.clientX;
      prevY = event.clientY;
      velX = dx * 0.00008;
      velY = dy * 0.00003;
      earth.rotation.y += dx * 0.0055;
      overlay.rotation.y += dx * 0.0055;
      atmosphere.rotation.y += dx * 0.0055;
      earth.rotation.x += dy * 0.0028;
      overlay.rotation.x += dy * 0.0028;
      atmosphere.rotation.x += dy * 0.0028;
      earth.rotation.x = Math.max(-0.6, Math.min(0.6, earth.rotation.x));
      overlay.rotation.x = earth.rotation.x;
      atmosphere.rotation.x = earth.rotation.x;
    }

    function onPointerUp() {
      dragging = false;
    }

    function onResize() {
      camera.aspect = mount.clientWidth / 620;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, 620);
    }

    mount.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('resize', onResize);

    overlayRef.current = overlay;

    animate();

    return () => {
      cancelAnimationFrame(frameRef.current);
      mount.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    if (!overlayRef.current) return;
    if (overlayRef.current.material.map) overlayRef.current.material.map.dispose();
    overlayRef.current.material.map = overlayData.texture;
    overlayRef.current.material.needsUpdate = true;
    labelsRef.current = overlayData.hitAreas.map((item) => ({
      id: item.country.id,
      continentId: item.country.continentId,
      label: item.country.title,
      lat: item.lat,
      lon: item.lon,
      country: item.country,
    }));
  }, [overlayData]);

  return (
    <div className="globe-shell">
      <div className="globe-stage" ref={mountRef} />
      <div className="label-layer">
        {projected.map((item) => (
          <button
            key={item.id}
            className={item.id === selectedCountryId ? 'globe-label active' : 'globe-label'}
            style={{
              left: item.x,
              top: item.y,
              opacity: item.visible ? 1 : 0,
              transform: `translate(-50%, -50%) scale(${item.id === selectedCountryId ? 1.08 : 1})`,
            }}
            onClick={() => onCountrySelect(item.continentId, item.country)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="globe-caption">
        <span>Large countries = more complex jobs with more sub-skills.</span>
        <span>Click a job label to open that country map and display its skill-cluster states.</span>
      </div>
    </div>
  );
}

export default function WorldMap(props) {
  const {
    roleDetails,
    stateDetails,
    selectedCountry,
    selectedStateId,
    onStateSelect,
    onBackToGlobe,
    onBackToCountry,
  } = props;

  return (
    <div className="map-mode-shell">
      <GlobeMode {...props} />
      {selectedCountry && (
        <CountryPopup
          country={selectedCountry}
          roleDetails={roleDetails}
          stateById={props.stateById}
          selectedStateId={selectedStateId}
          onStateSelect={onStateSelect}
          onBack={onBackToGlobe}
        />
      )}
      {selectedCountry && selectedStateId && stateDetails && (
        <StatePopup stateDetails={stateDetails} onBack={onBackToCountry} />
      )}
    </div>
  );
}
