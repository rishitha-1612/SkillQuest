import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import koreaData from '../data/korea.json';

const KOREA_SKILL_REGIONS = {
  python_programming: 'Gyeongsangbuk-do',
  mathematics_statistics: 'Gangwon-do',
  machine_learning: 'Gyeonggi-do',
  deep_learning: 'Busan',
  system_design: 'Jeju-do',
};

const REGION_FILL = '#96F08E';
const REGION_BORDER = '#3AC252';
const REGION_SIDE = '#74d96c';
const INACTIVE_FILL = '#d7dfd2';
const INACTIVE_SIDE = '#b8c3b2';
const INACTIVE_BORDER = '#a5b2a0';
const HOVER_EMISSIVE = '#3AC252';
const OUTLINE_COLOR = '#3AC252';
const SEA_COLOR = '#d6f0ee';

const ACTIVE_DEPTH = 0.6;
const INACTIVE_DEPTH = 0.22;
const HOVER_LIFT = 0.4;
const HOVER_SCALE = 1.06;

function ringToShape(ring, cx, cy, scale) {
  const shape = new THREE.Shape();
  ring.forEach(([lng, lat], index) => {
    const x = (lng - cx) * scale;
    const y = (lat - cy) * scale;
    if (index === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  });
  return shape;
}

export default function Korea3DMap({ roleDetails, stateById, selectedStateId, onStateSelect }) {
  const mountRef = useRef(null);
  const labelsRef = useRef(null);

  const regionSkillMap = useMemo(() => {
    const pairs = (roleDetails?.state_requirements || [])
      .map((req) => {
        const regionName = KOREA_SKILL_REGIONS[req.state_id];
        const state = stateById.get(req.state_id);
        if (!regionName || !state) return null;
        return [
          regionName,
          {
            id: req.state_id,
            title: state.title,
            color: REGION_FILL,
          },
        ];
      })
      .filter(Boolean);

    return new Map(pairs);
  }, [roleDetails, stateById]);

  useEffect(() => {
    const mount = mountRef.current;
    const labelsLayer = labelsRef.current;
    if (!mount || !labelsLayer) return undefined;

    const width = mount.clientWidth || 920;
    const height = mount.clientHeight || 680;

    const scene = new THREE.Scene();
    scene.background = null;
    scene.fog = new THREE.Fog(0xeaf6f3, 30, 90);

    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 200);
    camera.position.set(0, -14, 22);
    camera.lookAt(0, 1.5, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.78));

    const hemi = new THREE.HemisphereLight(0xfff8e6, 0xb9e4d8, 0.55);
    scene.add(hemi);

    const key = new THREE.DirectionalLight(0xffffff, 1.05);
    key.position.set(8, -6, 14);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -15;
    key.shadow.camera.right = 15;
    key.shadow.camera.top = 18;
    key.shadow.camera.bottom = -18;
    key.shadow.bias = -0.0008;
    scene.add(key);

    const fill = new THREE.DirectionalLight(0x9fd9ff, 0.3);
    fill.position.set(-10, -4, 6);
    scene.add(fill);

    const seaGeo = new THREE.CircleGeometry(40, 64);
    const seaMat = new THREE.MeshStandardMaterial({
      color: SEA_COLOR,
      roughness: 1,
      metalness: 0,
      transparent: true,
      opacity: 0.55,
    });
    const sea = new THREE.Mesh(seaGeo, seaMat);
    sea.position.z = -0.02;
    sea.receiveShadow = true;
    scene.add(sea);

    const features = koreaData.features;
    let minLng = Infinity;
    let maxLng = -Infinity;
    let minLat = Infinity;
    let maxLat = -Infinity;

    for (const feature of features) {
      const polygons =
        feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates;

      for (const polygon of polygons) {
        for (const [lng, lat] of polygon[0]) {
          if (lng < minLng) minLng = lng;
          if (lng > maxLng) maxLng = lng;
          if (lat < minLat) minLat = lat;
          if (lat > maxLat) maxLat = lat;
        }
      }
    }

    const cx = (minLng + maxLng) / 2;
    const cy = (minLat + maxLat) / 2;
    const span = Math.max(maxLng - minLng, maxLat - minLat);
    const scale = 16 / span;

    const regions = [];
    const pickables = [];

    features.forEach((feature) => {
      const polygons =
        feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates;

      const mappedSkill = regionSkillMap.get(feature.properties.name);
      const isActive = Boolean(mappedSkill);
      const baseColor = new THREE.Color(isActive ? REGION_FILL : INACTIVE_FILL);
      const sideColor = new THREE.Color(isActive ? REGION_SIDE : INACTIVE_SIDE);
      const outlineColor = isActive ? OUTLINE_COLOR : INACTIVE_BORDER;
      const depth = isActive ? ACTIVE_DEPTH : INACTIVE_DEPTH;

      const group = new THREE.Group();
      let sumX = 0;
      let sumY = 0;
      let count = 0;

      polygons.forEach((polygon) => {
        const outer = polygon[0];
        const shape = ringToShape(outer, cx, cy, scale);

        for (let holeIndex = 1; holeIndex < polygon.length; holeIndex += 1) {
          shape.holes.push(ringToShape(polygon[holeIndex], cx, cy, scale));
        }

        outer.forEach(([lng, lat]) => {
          sumX += (lng - cx) * scale;
          sumY += (lat - cy) * scale;
          count += 1;
        });

        const geometry = new THREE.ExtrudeGeometry(shape, {
          depth,
          bevelEnabled: true,
          bevelThickness: 0.08,
          bevelSize: 0.06,
          bevelOffset: 0,
          bevelSegments: 3,
          curveSegments: 6,
        });
        geometry.computeVertexNormals();

        const topMaterial = new THREE.MeshStandardMaterial({
          color: baseColor.clone(),
          roughness: isActive ? 0.7 : 0.95,
          metalness: 0.02,
        });
        const sideMaterial = new THREE.MeshStandardMaterial({
          color: sideColor,
          roughness: 0.95,
          metalness: 0,
        });

        const mesh = new THREE.Mesh(geometry, [topMaterial, sideMaterial]);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        group.add(mesh);
        if (isActive) pickables.push(mesh);

        const edges = new THREE.EdgesGeometry(geometry, 25);
        const line = new THREE.LineSegments(
          edges,
          new THREE.LineBasicMaterial({
            color: new THREE.Color(outlineColor),
            transparent: true,
            opacity: isActive ? 0.4 : 0.22,
          })
        );
        line.position.z = 0.001;
        group.add(line);
      });

      scene.add(group);

      const region = {
        name: feature.properties.name,
        mappedSkill,
        isActive,
        baseColor,
        hoverT: mappedSkill?.id === selectedStateId ? 1 : 0,
        idlePhase: Math.random() * Math.PI * 2,
        group,
        depth,
        anchor: new THREE.Vector3(count ? sumX / count : 0, count ? sumY / count : 0, depth + 0.05),
      };

      const regionIndex = regions.length;
      group.traverse((object) => {
        if (object.isMesh) object.userData.regionIndex = regionIndex;
      });

      if (mappedSkill) {
        const label = document.createElement('div');
        label.className = 'korea-subject-label';
        label.textContent = mappedSkill.title;
        labelsLayer.appendChild(label);
        region.labelEl = label;
      }

      regions.push(region);
    });

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let hoveredIndex = -1;
    let pointerInside = false;

    const onMove = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      pointerInside = true;
    };

    const onLeave = () => {
      pointerInside = false;
      hoveredIndex = -1;
    };

    const onClick = () => {
      if (hoveredIndex < 0) return;
      const region = regions[hoveredIndex];
      if (region?.mappedSkill) onStateSelect(region.mappedSkill.id);
    };

    renderer.domElement.addEventListener('pointermove', onMove);
    renderer.domElement.addEventListener('pointerleave', onLeave);
    renderer.domElement.addEventListener('click', onClick);

    const onResize = () => {
      const nextWidth = mount.clientWidth || 920;
      const nextHeight = mount.clientHeight || 680;
      renderer.setSize(nextWidth, nextHeight);
      camera.aspect = nextWidth / nextHeight;
      camera.updateProjectionMatrix();
    };

    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(mount);

    const tmpColor = new THREE.Color();
    const hoverEmissive = new THREE.Color(HOVER_EMISSIVE);
    const black = new THREE.Color(0x000000);
    const projected = new THREE.Vector3();
    const clock = new THREE.Clock();

    let raf = 0;
    const tick = () => {
      const delta = clock.getDelta();
      const elapsed = clock.elapsedTime;

      if (pointerInside) {
        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObjects(pickables, false);
        hoveredIndex = hits.length ? hits[0].object.userData.regionIndex : -1;
      }

      renderer.domElement.style.cursor = hoveredIndex >= 0 ? 'pointer' : 'default';

      regions.forEach((region, index) => {
        const isSelected = region.mappedSkill?.id === selectedStateId;
        const targetHover = hoveredIndex === index || isSelected ? 1 : 0;

        if (region.isActive) {
          region.hoverT += (targetHover - region.hoverT) * Math.min(1, delta * 9);

          const breathe = Math.sin(elapsed * 0.9 + region.idlePhase) * 0.05;
          region.group.position.z = breathe + region.hoverT * HOVER_LIFT;

          const scaleAmount = 1 + region.hoverT * (HOVER_SCALE - 1);
          region.group.scale.set(scaleAmount, scaleAmount, 1 + region.hoverT * 0.18);

          region.group.traverse((object) => {
            if (!object.isMesh) return;
            const materials = Array.isArray(object.material) ? object.material : [object.material];
            const topMaterial = materials[0];
            if (!topMaterial || !('color' in topMaterial)) return;

            tmpColor.copy(region.baseColor);
            tmpColor.lerp(new THREE.Color(REGION_FILL), region.hoverT * 0.18);
            topMaterial.color.copy(tmpColor);
            if (topMaterial.emissive) {
              topMaterial.emissive.copy(black).lerp(hoverEmissive, region.hoverT * 0.5);
            }
          });
        } else {
          region.group.position.z = Math.sin(elapsed * 0.6 + region.idlePhase) * 0.02;
        }
      });

      scene.rotation.x = Math.sin(elapsed * 0.25) * 0.015;
      scene.rotation.y = Math.cos(elapsed * 0.2) * 0.02;
      renderer.render(scene, camera);

      const rect = renderer.domElement.getBoundingClientRect();
      regions.forEach((region, index) => {
        if (!region.labelEl) return;

        projected.copy(region.anchor);
        projected.z = region.depth + 0.05 + region.group.position.z;
        scene.updateMatrixWorld();
        projected.applyMatrix4(scene.matrixWorld);
        projected.project(camera);

        const x = (projected.x * 0.5 + 0.5) * rect.width;
        const y = (-projected.y * 0.5 + 0.5) * rect.height;
        const isVisible = projected.z > -1 && projected.z < 1;

        region.labelEl.style.transform = `translate(-50%, -100%) translate(${x}px, ${y}px)`;
        region.labelEl.style.opacity = isVisible ? '1' : '0';
        region.labelEl.classList.toggle('is-hovered', hoveredIndex === index || region.mappedSkill?.id === selectedStateId);
      });

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('pointermove', onMove);
      renderer.domElement.removeEventListener('pointerleave', onLeave);
      renderer.domElement.removeEventListener('click', onClick);

      regions.forEach((region) => {
        if (region.labelEl?.parentElement) {
          region.labelEl.parentElement.removeChild(region.labelEl);
        }
      });

      renderer.dispose();
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : object.material ? [object.material] : [];
        materials.forEach((material) => material?.dispose());
      });

      if (renderer.domElement.parentElement === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [onStateSelect, regionSkillMap, selectedStateId]);

  return (
    <div className="korea-3d-map-shell">
      <div className="korea-3d-map-stage">
        <div ref={mountRef} className="korea-3d-map-canvas" />
        <div ref={labelsRef} className="korea-3d-map-labels" />
        <div className="korea-3d-map-badge">
          <span>Korea 3D Skill Map</span>
          <small>Click highlighted regions to switch skills</small>
        </div>
      </div>
    </div>
  );
}
