import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import worldData from '../data/worldGlobe.json';
import { getClusterTheme, getRoleWorldProfile } from '../data/worldConfig';

const GLOBE_RADIUS = 4.45;
const ACTIVE_LIFT = 0.06;
const HOVER_LIFT = 0.18;
const HOVER_SCALE = 1.04;
const OCEAN_COLOR = '#92ddff';
const LAND_MUTED = '#f8fcff';
const LAND_MUTED_SIDE = '#d8eefb';
const OUTLINE_COLOR = '#77c8ec';
const HOVER_EMISSIVE = '#fff8c8';
const SELECTED_TOP = '#ffffff';
const SELECTED_SIDE = '#bfe8ff';

function lonLatToVec3(lon, lat, r, out = new THREE.Vector3()) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  out.set(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
  return out;
}

function bary(a, b, c, u, v) {
  const w = 1 - u - v;
  return [a[0] * w + b[0] * u + c[0] * v, a[1] * w + b[1] * u + c[1] * v];
}

function buildSphericalPolygon(ring, r) {
  if (!ring || ring.length < 4) return null;
  const flat = ring.slice();
  if (
    flat.length > 1 &&
    flat[0][0] === flat[flat.length - 1][0] &&
    flat[0][1] === flat[flat.length - 1][1]
  ) {
    flat.pop();
  }
  if (flat.length < 3) return null;

  const pts2 = flat.map(([x, y]) => new THREE.Vector2(x, y));
  let tris;
  try {
    tris = THREE.ShapeUtils.triangulateShape(pts2, []);
  } catch {
    return null;
  }
  if (!tris.length) return null;

  const positions = [];
  const tmp = new THREE.Vector3();
  const SUB = 2;

  function pushPoint(lon, lat) {
    lonLatToVec3(lon, lat, r, tmp);
    positions.push(tmp.x, tmp.y, tmp.z);
  }

  for (const t of tris) {
    const a = flat[t[0]];
    const b = flat[t[1]];
    const c = flat[t[2]];
    if (!a || !b || !c) continue;

    for (let i = 0; i < SUB; i += 1) {
      for (let j = 0; j < SUB - i; j += 1) {
        const u0 = i / SUB;
        const v0 = j / SUB;
        const u1 = (i + 1) / SUB;
        const v1 = j / SUB;
        const u2 = i / SUB;
        const v2 = (j + 1) / SUB;
        const p0 = bary(a, b, c, u0, v0);
        const p1 = bary(a, b, c, u1, v1);
        const p2 = bary(a, b, c, u2, v2);
        pushPoint(p0[0], p0[1]);
        pushPoint(p1[0], p1[1]);
        pushPoint(p2[0], p2[1]);

        if (i + j < SUB - 1) {
          const u3 = (i + 1) / SUB;
          const v3 = (j + 1) / SUB;
          const p3 = bary(a, b, c, u3, v3);
          pushPoint(p1[0], p1[1]);
          pushPoint(p3[0], p3[1]);
          pushPoint(p2[0], p2[1]);
        }
      }
    }
  }

  if (!positions.length) return null;

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.computeVertexNormals();
  const normals = geo.attributes.position.array;
  const normalAttr = new Float32Array(normals.length);
  for (let i = 0; i < normals.length; i += 3) {
    const v = new THREE.Vector3(normals[i], normals[i + 1], normals[i + 2]).normalize();
    normalAttr[i] = v.x;
    normalAttr[i + 1] = v.y;
    normalAttr[i + 2] = v.z;
  }
  geo.setAttribute('normal', new THREE.BufferAttribute(normalAttr, 3));
  return geo;
}

function buildOutline(ring, r) {
  const positions = [];
  const tmp = new THREE.Vector3();
  for (let i = 0; i < ring.length - 1; i += 1) {
    const [lon1, lat1] = ring[i];
    const [lon2, lat2] = ring[i + 1];
    const steps = 4;
    for (let s = 0; s < steps; s += 1) {
      const t1 = s / steps;
      const t2 = (s + 1) / steps;
      lonLatToVec3(lon1 + (lon2 - lon1) * t1, lat1 + (lat2 - lat1) * t1, r, tmp);
      positions.push(tmp.x, tmp.y, tmp.z);
      lonLatToVec3(lon1 + (lon2 - lon1) * t2, lat1 + (lat2 - lat1) * t2, r, tmp);
      positions.push(tmp.x, tmp.y, tmp.z);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  return g;
}

function buildSideStrip(ring, innerR, outerR) {
  if (!ring || ring.length < 4) return null;
  const positions = [];
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const aOut = new THREE.Vector3();
  const bOut = new THREE.Vector3();

  for (let i = 0; i < ring.length - 1; i += 1) {
    const [lon1, lat1] = ring[i];
    const [lon2, lat2] = ring[i + 1];
    lonLatToVec3(lon1, lat1, innerR, a);
    lonLatToVec3(lon2, lat2, innerR, b);
    lonLatToVec3(lon1, lat1, outerR, aOut);
    lonLatToVec3(lon2, lat2, outerR, bOut);
    positions.push(a.x, a.y, a.z, b.x, b.y, b.z, aOut.x, aOut.y, aOut.z);
    positions.push(b.x, b.y, b.z, bOut.x, bOut.y, bOut.z, aOut.x, aOut.y, aOut.z);
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.computeVertexNormals();
  return g;
}

function countryCentroid(geom, r) {
  const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;
  let best = polys[0][0];
  for (const p of polys) {
    if (p[0].length > best.length) best = p[0];
  }
  let sx = 0;
  let sy = 0;
  let n = 0;
  for (const [lon, lat] of best) {
    sx += lon;
    sy += lat;
    n += 1;
  }
  return lonLatToVec3(sx / n, sy / n, r);
}

function buildCountryLookup(countryMetrics) {
  return new Map(
    countryMetrics.map((country) => {
      const profile = getRoleWorldProfile(country.id);
      return [profile.countryName, { ...country, profile }];
    })
  );
}

export default function WorldMap({ countryMetrics, selectedCountryId, onCountrySelect }) {
  const mountRef = useRef(null);
  const labelsLayerRef = useRef(null);
  const countryLookup = useMemo(() => buildCountryLookup(countryMetrics), [countryMetrics]);

  useEffect(() => {
    const mount = mountRef.current;
    const labelsLayer = labelsLayerRef.current;
    if (!mount || !labelsLayer) return undefined;

    const scene = new THREE.Scene();
    scene.background = null;
    scene.fog = new THREE.Fog(0xe7f8ff, 24, 60);

    const camera = new THREE.PerspectiveCamera(38, mount.clientWidth / mount.clientHeight, 0.1, 200);
    camera.position.set(0, 2.2, 15.8);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.78));
    const hemi = new THREE.HemisphereLight(0xffffff, 0xc7ecff, 0.72);
    scene.add(hemi);
    const key = new THREE.DirectionalLight(0xffffff, 1);
    key.position.set(8, 6, 10);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xdff5ff, 0.52);
    fill.position.set(-10, -2, 4);
    scene.add(fill);

    const root = new THREE.Group();
    root.rotation.z = 0.32;
    scene.add(root);

    const ocean = new THREE.Mesh(
      new THREE.SphereGeometry(GLOBE_RADIUS - 0.005, 64, 64),
      new THREE.MeshStandardMaterial({
        color: OCEAN_COLOR,
        roughness: 1,
        metalness: 0,
      })
    );
    root.add(ocean);

    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(GLOBE_RADIUS * 1.06, 48, 48),
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        uniforms: { uColor: { value: new THREE.Color('#eef8ff') } },
        vertexShader: `
          varying vec3 vN;
          void main() {
            vN = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec3 vN;
          uniform vec3 uColor;
          void main() {
            float i = pow(0.85 - abs(vN.z), 2.2);
            gl_FragColor = vec4(uColor, i * 0.55);
          }
        `,
      })
    );
    scene.add(glow);

    const countries = [];
    const pickables = [];
    let activeColorIndex = 0;

    for (const feature of worldData.features) {
      const skillCountry = countryLookup.get(feature.properties.name) || null;
      const active = Boolean(skillCountry);
      const selected = skillCountry?.id === selectedCountryId;
      const theme = skillCountry ? getClusterTheme(skillCountry.continentId) : null;
      const baseColor = selected
        ? new THREE.Color(SELECTED_TOP)
        : active
          ? new THREE.Color(theme.accent)
          : new THREE.Color(LAND_MUTED);
      const sideColor = selected
        ? new THREE.Color(SELECTED_SIDE)
        : active
          ? new THREE.Color(theme.accent).multiplyScalar(0.72)
          : new THREE.Color(LAND_MUTED_SIDE);
      const group = new THREE.Group();
      const surfaceR = GLOBE_RADIUS + (active ? 0.012 + ACTIVE_LIFT : 0.006);
      const polys =
        feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates;

      for (const poly of polys) {
        const outer = poly[0];
        if (!outer || outer.length < 4) continue;

        const topGeo = buildSphericalPolygon(outer, surfaceR);
        if (!topGeo) continue;

        const topMat = new THREE.MeshStandardMaterial({
          color: baseColor.clone(),
          roughness: 0.8,
          metalness: 0.02,
          side: THREE.DoubleSide,
        });
        const topMesh = new THREE.Mesh(topGeo, topMat);
        group.add(topMesh);
        if (active) pickables.push(topMesh);

        if (active) {
          const sideGeo = buildSideStrip(outer, GLOBE_RADIUS + 0.006, surfaceR);
          if (sideGeo) {
            const sideMat = new THREE.MeshStandardMaterial({
              color: sideColor,
              roughness: 0.95,
              metalness: 0,
              side: THREE.DoubleSide,
            });
            group.add(new THREE.Mesh(sideGeo, sideMat));
          }
        }

        const outline = new THREE.LineSegments(
          buildOutline(outer, surfaceR + 0.001),
          new THREE.LineBasicMaterial({
            color: new THREE.Color(active ? OUTLINE_COLOR : '#a8b8a8'),
            transparent: true,
            opacity: active ? 0.55 : 0.25,
          })
        );
        group.add(outline);
      }

      root.add(group);

      const countryRecord = {
        name: feature.properties.name,
        active,
        selected,
        group,
        centroid: countryCentroid(feature.geometry, GLOBE_RADIUS + 0.05),
        hoverT: 0,
        idlePhase: Math.random() * Math.PI * 2,
        baseColor,
        sideColor,
        skillCountry,
        accentIndex: activeColorIndex,
        labelEl: null,
      };

      const idx = countries.length;
      group.traverse((obj) => {
        if (obj.isMesh) obj.userData.countryIndex = idx;
      });

      if (active) activeColorIndex += 1;
      countries.push(countryRecord);
    }

    countries.forEach((country) => {
      if (!country.active || !country.skillCountry) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `pastel-globe-label${country.selected ? ' active' : ''}`;
      button.textContent = country.skillCountry.title;
      button.addEventListener('click', () => {
        onCountrySelect(country.skillCountry.continentId, country.skillCountry);
      });
      labelsLayer.appendChild(button);
      country.labelEl = button;
    });

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let hoveredIdx = -1;
    let pointerInside = false;
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;
    let manualYaw = 0;
    let manualPitch = 0;
    let dragVelX = 0;

    const tmpColor = new THREE.Color();
    const hoverEmissive = new THREE.Color(HOVER_EMISSIVE);
    const black = new THREE.Color(0x000000);
    const worldVec = new THREE.Vector3();
    const projVec = new THREE.Vector3();
    const globeWorldPos = new THREE.Vector3();
    const toCam = new THREE.Vector3();
    const normal = new THREE.Vector3();
    const clock = new THREE.Clock();

    function updatePointer(event) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      pointerInside = true;
    }

    function onMove(event) {
      updatePointer(event);
      if (!isDragging) return;
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      manualYaw += dx * 0.005;
      manualPitch = THREE.MathUtils.clamp(manualPitch + dy * 0.005, -0.9, 0.9);
      dragVelX = dx * 0.005;
      lastX = event.clientX;
      lastY = event.clientY;
    }

    function onLeave() {
      pointerInside = false;
      hoveredIdx = -1;
      isDragging = false;
    }

    function onDown(event) {
      isDragging = true;
      lastX = event.clientX;
      lastY = event.clientY;
      renderer.domElement.setPointerCapture?.(event.pointerId);
    }

    function onUp() {
      isDragging = false;
    }

    function onClick() {
      if (hoveredIdx < 0) return;
      const country = countries[hoveredIdx];
      if (!country?.skillCountry) return;
      onCountrySelect(country.skillCountry.continentId, country.skillCountry);
    }

    function onResize() {
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }

    renderer.domElement.addEventListener('pointermove', onMove);
    renderer.domElement.addEventListener('pointerleave', onLeave);
    renderer.domElement.addEventListener('pointerdown', onDown);
    renderer.domElement.addEventListener('pointerup', onUp);
    renderer.domElement.addEventListener('click', onClick);
    window.addEventListener('resize', onResize);

    let raf = 0;
    function tick() {
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;

      if (!isDragging) {
        manualYaw += (0.04 + dragVelX) * dt;
        dragVelX *= 0.94;
      }
      root.rotation.y = manualYaw;
      root.rotation.x = manualPitch * 0.6;
      root.position.y = Math.sin(t * 0.6) * 0.08;

      if (pointerInside && !isDragging) {
        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObjects(pickables, false);
        hoveredIdx = hits.length ? hits[0].object.userData.countryIndex : -1;
      } else if (isDragging) {
        hoveredIdx = -1;
      }

      renderer.domElement.style.cursor = hoveredIdx >= 0 ? 'pointer' : isDragging ? 'grabbing' : 'grab';
      root.getWorldPosition(globeWorldPos);

      for (let i = 0; i < countries.length; i += 1) {
        const country = countries[i];
        if (country.active) {
          const target = i === hoveredIdx ? 1 : 0;
          country.hoverT += (target - country.hoverT) * Math.min(1, dt * 9);

          const breathe = Math.sin(t * 1.1 + country.idlePhase) * 0.006;
          const lift = country.hoverT * HOVER_LIFT;
          const scale = 1 + country.hoverT * (HOVER_SCALE - 1) + breathe;
          country.group.scale.setScalar(scale);

          const centroidDir = country.centroid.clone().normalize();
          country.group.position.copy(centroidDir.multiplyScalar(lift));

          country.group.traverse((obj) => {
            if (!obj.isMesh) return;
            const mat = obj.material;
            if (!mat || !('color' in mat)) return;
            const isSelected = country.selected;
            const base = isSelected ? new THREE.Color(SELECTED_TOP) : country.baseColor;
            tmpColor.copy(base).lerp(new THREE.Color('#ffffff'), country.hoverT * 0.18);
            mat.color.copy(tmpColor);
            if (mat.emissive) {
              mat.emissive.copy(black).lerp(hoverEmissive, country.hoverT * 0.5);
            }
          });
        }

        if (!country.labelEl) continue;
        worldVec.copy(country.centroid).applyMatrix4(root.matrixWorld);
        normal.copy(worldVec).sub(globeWorldPos).normalize();
        toCam.copy(camera.position).sub(worldVec).normalize();
        const facing = normal.dot(toCam) > 0.1;

        projVec.copy(worldVec).project(camera);
        const x = (projVec.x * 0.5 + 0.5) * renderer.domElement.clientWidth;
        const y = (-projVec.y * 0.5 + 0.5) * renderer.domElement.clientHeight;
        const hovered = countries[hoveredIdx] === country;

        if (
          facing &&
          projVec.z < 1 &&
          x > -80 &&
          x < renderer.domElement.clientWidth + 80 &&
          y > -40 &&
          y < renderer.domElement.clientHeight + 40
        ) {
          country.labelEl.style.opacity = hovered ? '1' : '0.95';
          country.labelEl.style.transform = `translate(-50%, -140%) translate(${x}px, ${y}px) scale(${hovered ? 1.06 : 1})`;
          country.labelEl.classList.toggle('is-hovered', hovered);
        } else {
          country.labelEl.style.opacity = '0';
          country.labelEl.classList.remove('is-hovered');
        }
      }

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      renderer.domElement.removeEventListener('pointermove', onMove);
      renderer.domElement.removeEventListener('pointerleave', onLeave);
      renderer.domElement.removeEventListener('pointerdown', onDown);
      renderer.domElement.removeEventListener('pointerup', onUp);
      renderer.domElement.removeEventListener('click', onClick);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (!obj.material) return;
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((material) => material.dispose());
      });
      countries.forEach((country) => country.labelEl?.remove());
      if (renderer.domElement.parentElement === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [countryLookup, onCountrySelect, selectedCountryId]);

  return (
    <div className="map-mode-shell">
      <div className="globe-shell pastel-globe-shell">
        <div className="globe-stage pastel-globe-stage" ref={mountRef}>
          <div className="shooting-stars" aria-hidden="true">
            <div className="shooting-star star-1" />
            <div className="shooting-star star-2" />
            <div className="shooting-star star-3" />
          </div>
        </div>
        <div ref={labelsLayerRef} className="pastel-globe-labels" />
        <div className="globe-caption">
          <span>Click any realm.</span>
          <span>It opens in a new window.</span>
        </div>
      </div>
    </div>
  );
}
