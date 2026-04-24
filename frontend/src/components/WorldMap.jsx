import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { geoCentroid, geoMercator, geoPath, geoArea } from 'd3-geo';
import { feature } from 'topojson-client';
import countries110m from 'world-atlas/countries-110m.json';
import { getClusterTheme, getRoleWorldProfile } from '../data/worldConfig';

const FALLBACK_REGION_LAYOUTS = [
  { path: 'M108,134 C84,86 118,48 178,54 C230,60 252,122 220,166 C194,204 130,204 108,134 Z', labelX: 170, labelY: 122 },
  { path: 'M336,98 C374,54 442,66 466,116 C492,170 460,228 402,236 C352,242 302,188 308,140 C310,124 320,112 336,98 Z', labelX: 392, labelY: 146 },
  { path: 'M552,136 C582,88 648,86 688,122 C724,156 716,214 676,246 C630,282 560,262 534,212 C520,184 524,162 552,136 Z', labelX: 626, labelY: 176 },
  { path: 'M190,324 C226,274 294,276 332,314 C362,346 360,404 318,434 C278,464 214,454 178,416 C146,382 152,352 190,324 Z', labelX: 252, labelY: 366 },
  { path: 'M470,334 C510,286 580,290 616,334 C654,380 642,446 592,474 C536,506 458,482 430,430 C410,396 434,362 470,334 Z', labelX: 534, labelY: 390 },
  { path: 'M326,470 C360,436 416,434 450,462 C484,492 478,548 432,572 C386,594 326,578 300,536 C280,504 294,488 326,470 Z', labelX: 390, labelY: 516 },
];

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
    return 22 + normalized * 36;
  }

  function lonLatToCanvas(lat, lon) {
    return {
      x: ((lon + 180) / 360) * canvas.width,
      y: ((90 - lat) / 180) * canvas.height,
    };
  }

  countryMetrics.forEach((country) => {
    const { lat = 0, lon = 0 } = country;
    const radius = radiusFor(country.complexity || 1);
    const { x, y } = lonLatToCanvas(lat, lon);
    const active = country.id === selectedCountryId;
    const theme = getClusterTheme(country.continentId);

    ctx.beginPath();
    ctx.ellipse(x, y, radius * 1.3, radius, 0, 0, Math.PI * 2);
    ctx.fillStyle = active ? 'rgba(255, 241, 168, 0.62)' : theme.glow;
    ctx.fill();
    ctx.lineWidth = active ? 4 : 2;
    ctx.strokeStyle = active ? 'rgba(255, 247, 204, 0.98)' : theme.accent;
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

function useCountryGeometry(country) {
  const [data, setData] = useState({ loading: false, error: '', geojson: null });

  useEffect(() => {
    let cancelled = false;

    async function loadGeometry() {
      if (!country?.id) {
        setData({ loading: false, error: '', geojson: null });
        return;
      }

      const profile = getRoleWorldProfile(country.id);
      setData({ loading: true, error: '', geojson: null });

      try {
        const metaRes = await fetch(`https://www.geoboundaries.org/api/current/gbOpen/${profile.iso3}/ADM1/`);
        if (!metaRes.ok) {
          throw new Error('metadata');
        }
        const meta = await metaRes.json();
        const geoRes = await fetch(meta.simplifiedGeometryGeoJSON || meta.gjDownloadURL);
        if (!geoRes.ok) {
          throw new Error('geometry');
        }
        const geojson = await geoRes.json();
        if (!cancelled) {
          setData({ loading: false, error: '', geojson });
        }
      } catch {
        if (!cancelled) {
          setData({ loading: false, error: 'offline', geojson: null });
        }
      }
    }

    loadGeometry();
    return () => {
      cancelled = true;
    };
  }, [country]);

  return data;
}

function buildFallbackRegions(requirements, stateById) {
  return requirements.map((requirement, index) => ({
    requirement,
    state: stateById.get(requirement.state_id),
    layout: FALLBACK_REGION_LAYOUTS[index % FALLBACK_REGION_LAYOUTS.length],
  }));
}

function CountryPopup({ country, roleDetails, stateById, selectedStateId, onStateSelect, onBack }) {
  const { loading, error, geojson } = useCountryGeometry(country);
  const profile = getRoleWorldProfile(country.id);
  const requirements = roleDetails?.state_requirements || [];
  const theme = getClusterTheme(country.continentId);

  const regions = useMemo(() => {
    if (!geojson?.features?.length) return [];

    const ranked = [...geojson.features]
      .sort((a, b) => geoArea(b) - geoArea(a))
      .slice(0, requirements.length);

    return ranked.map((featureItem, index) => ({
      feature: featureItem,
      requirement: requirements[index],
      state: stateById.get(requirements[index].state_id),
    }));
  }, [geojson, requirements, stateById]);

  const projection = useMemo(() => {
    if (!geojson) return null;
    return geoMercator().fitSize([780, 560], geojson);
  }, [geojson]);

  const pathBuilder = useMemo(() => (projection ? geoPath(projection) : null), [projection]);
  const fallbackRegions = useMemo(() => buildFallbackRegions(requirements, stateById), [requirements, stateById]);
  const showFallbackMap = !loading && (!pathBuilder || !regions.length);

  return (
    <div className="map-popup map-popup-country">
      <div className="map-toolbar">
        <button className="back-btn" onClick={onBack}>Back</button>
        <div>
          <h3>{profile.realm}</h3>
          <p>{profile.countryName} • {country.title}</p>
        </div>
      </div>

      <div className="country-meta-banner">
        <span>{roleDetails?.summary}</span>
      </div>

      {loading && <div className="inline-banner">Loading provinces...</div>}
      {error && <div className="inline-banner subtle">Offline map mode</div>}

      <div className="country-map-shell">
        {pathBuilder && regions.length ? (
          <svg className="country-map-svg" viewBox="0 0 780 560">
            {regions.map(({ feature: region, requirement, state }) => {
              const active = selectedStateId === requirement.state_id;
              const [cx, cy] = pathBuilder.centroid(region);
              return (
                <g
                  key={requirement.state_id}
                  className="state-region-group"
                  onClick={() => onStateSelect(requirement.state_id)}
                >
                  <path
                    d={pathBuilder(region)}
                    className={active ? 'state-region active' : 'state-region'}
                    style={{
                      fill: active ? theme.accent : undefined,
                      opacity: active ? 0.95 : 0.82,
                    }}
                  />
                  <text x={cx} y={cy - 4} textAnchor="middle" className="state-region-title">
                    {state?.title || requirement.state_id}
                  </text>
                  <text x={cx} y={cy + 16} textAnchor="middle" className="state-region-sub">
                    {state?.nodes?.length || 0} cities
                  </text>
                </g>
              );
            })}
          </svg>
        ) : null}

        {showFallbackMap ? (
          <svg className="country-map-svg country-map-svg-fallback" viewBox="0 0 780 560">
            <defs>
              <linearGradient id="seaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#97e3ff" />
                <stop offset="100%" stopColor="#58bfff" />
              </linearGradient>
            </defs>
            <rect width="780" height="560" rx="28" fill="url(#seaGradient)" />
            <circle cx="88" cy="86" r="34" fill="rgba(255,255,255,0.32)" />
            <circle cx="686" cy="92" r="26" fill="rgba(255,255,255,0.22)" />
            <circle cx="714" cy="452" r="22" fill="rgba(255,255,255,0.18)" />
            {fallbackRegions.map(({ requirement, state, layout }) => {
              const active = selectedStateId === requirement.state_id;
              return (
                <g
                  key={requirement.state_id}
                  className="state-region-group"
                  onClick={() => onStateSelect(requirement.state_id)}
                >
                  <path
                    d={layout.path}
                    className={active ? 'state-region active fallback-region' : 'state-region fallback-region'}
                    style={{
                      fill: active ? theme.accent : 'rgba(255,255,255,0.9)',
                      opacity: 1,
                    }}
                  />
                  <text x={layout.labelX} y={layout.labelY} textAnchor="middle" className="state-region-title fallback-text">
                    {state?.title || requirement.state_id}
                  </text>
                  <text x={layout.labelX} y={layout.labelY + 18} textAnchor="middle" className="state-region-sub fallback-text-sub">
                    {state?.nodes?.length || 0} cities
                  </text>
                </g>
              );
            })}
          </svg>
        ) : null}
      </div>
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
        <button className="back-btn" onClick={onBack}>Back</button>
        <div>
          <h3>{stateDetails.title}</h3>
          <p>Clear the route.</p>
        </div>
      </div>

      <div className="state-map-scroll">
        <svg className="state-map-svg" width="980" height={Math.max(420, 180 + nodes.length * 54)}>
          <defs>
            <marker id="path-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 Z" fill="#68d8ff" />
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
    const camera = new THREE.PerspectiveCamera(38, mount.clientWidth / 680, 0.1, 1000);
    camera.position.z = 3;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, 680);
    mount.appendChild(renderer.domElement);

    const textureLoader = new THREE.TextureLoader();
    const earthMap = textureLoader.load('https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg');
    const bumpMap = textureLoader.load('https://threejs.org/examples/textures/planets/earth_bump_4096.jpg');
    const specMap = textureLoader.load('https://threejs.org/examples/textures/planets/earth_specular_2048.jpg');

    scene.add(new THREE.AmbientLight(0xffffff, 1.2));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.05);
    keyLight.position.set(3, 2, 4);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0xb3f1ff, 0.68);
    rimLight.position.set(-4, -2, -3);
    scene.add(rimLight);

    const earth = new THREE.Mesh(
      new THREE.SphereGeometry(1, 96, 96),
      new THREE.MeshPhongMaterial({
        map: earthMap,
        bumpMap,
        bumpScale: 0.04,
        specularMap: specMap,
        specular: new THREE.Color(0x888888),
        shininess: 14,
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
      new THREE.SphereGeometry(1.06, 64, 64),
      new THREE.MeshPhongMaterial({
        color: 0x7ce7ff,
        transparent: true,
        opacity: 0.16,
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
      const height = 680;
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
      camera.aspect = mount.clientWidth / 680;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, 680);
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
        <span>Tap a realm.</span>
        <span>Clear its provinces.</span>
      </div>
    </div>
  );
}

function buildCountryPositions(countryMetrics) {
  const world = feature(countries110m, countries110m.objects.countries);
  const centroidByName = new Map(world.features.map((item) => [item.properties.name, geoCentroid(item)]));

  return countryMetrics.map((country) => {
    const profile = getRoleWorldProfile(country.id);
    const centroid = centroidByName.get(profile.countryName) || [0, 0];
    return {
      ...country,
      lon: centroid[0],
      lat: centroid[1],
      profile,
    };
  });
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

  const positionedMetrics = useMemo(() => buildCountryPositions(props.countryMetrics), [props.countryMetrics]);

  const selectedCountryWithPosition = useMemo(
    () => positionedMetrics.find((country) => country.id === selectedCountry?.id) || selectedCountry,
    [positionedMetrics, selectedCountry]
  );

  return (
    <div className="map-mode-shell">
      <GlobeMode
        countryMetrics={positionedMetrics}
        selectedCountryId={props.selectedCountryId}
        onCountrySelect={props.onCountrySelect}
      />
      {selectedCountryWithPosition && (
        <CountryPopup
          country={selectedCountryWithPosition}
          roleDetails={roleDetails}
          stateById={props.stateById}
          selectedStateId={selectedStateId}
          onStateSelect={onStateSelect}
          onBack={onBackToGlobe}
        />
      )}
      {selectedCountryWithPosition && selectedStateId && stateDetails && (
        <StatePopup stateDetails={stateDetails} onBack={onBackToCountry} />
      )}
    </div>
  );
}
