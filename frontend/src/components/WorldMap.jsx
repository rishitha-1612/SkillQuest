import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { geoCentroid } from 'd3-geo';
import { feature } from 'topojson-client';
import countries110m from 'world-atlas/countries-110m.json';
import { getClusterTheme, getRoleWorldProfile } from '../data/worldConfig';

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
    return 22 + normalized * 34;
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
    ctx.fillStyle = active ? 'rgba(255, 241, 168, 0.7)' : theme.glow;
    ctx.fill();
    ctx.lineWidth = active ? 4 : 2;
    ctx.strokeStyle = active ? 'rgba(255, 247, 204, 1)' : theme.accent;
    ctx.stroke();

    hitAreas.push({ country, lat, lon });
  });

  return {
    texture: new THREE.CanvasTexture(canvas),
    hitAreas,
  };
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
        <span>Click any realm.</span>
        <span>It opens in a new window.</span>
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

export default function WorldMap({ countryMetrics, selectedCountryId, onCountrySelect }) {
  const positionedMetrics = useMemo(() => buildCountryPositions(countryMetrics), [countryMetrics]);

  return (
    <div className="map-mode-shell">
      <GlobeMode
        countryMetrics={positionedMetrics}
        selectedCountryId={selectedCountryId}
        onCountrySelect={onCountrySelect}
      />
    </div>
  );
}
