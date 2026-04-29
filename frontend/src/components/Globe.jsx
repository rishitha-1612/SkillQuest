import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import {
  CanvasTexture,
  ClampToEdgeWrapping,
  MathUtils,
  SRGBColorSpace,
  TextureLoader,
} from 'three';

import earthCloudsUrl from '../assets/earth-clouds.jpg';
import earthTextureUrl from '../assets/earth-pastel.jpg';

const LAND_COLOR = { r: 105, g: 225, b: 71 };
const LAND_EMISSIVE = '#69e147';
const WATER_COLOR = { r: 11, g: 181, b: 255 };

function clampChannel(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function buildPaletteTexture(texture) {
  const image = texture.image;
  if (!image) {
    return null;
  }

  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;

  const context = canvas.getContext('2d');
  if (!context) {
    return null;
  }

  context.drawImage(image, 0, 0);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = imageData;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const brightness = (r + g + b) / 3;
    const isWhiteIce = brightness > 240;
    const isWater = b > g + 8 && b > r + 12;

    if (isWhiteIce) {
      data[i] = 248;
      data[i + 1] = 252;
      data[i + 2] = 255;
      continue;
    }

    if (isWater) {
      const shade = MathUtils.clamp((brightness - 110) / 105, -0.08, 0.42);
      data[i] = clampChannel(WATER_COLOR.r * (1 + shade));
      data[i + 1] = clampChannel(WATER_COLOR.g * (1 + shade));
      data[i + 2] = clampChannel(WATER_COLOR.b * (1 + shade));
      continue;
    }

    const shade = MathUtils.clamp((brightness - 168) / 115, -0.04, 0.32);
    data[i] = clampChannel(LAND_COLOR.r * (1 + shade));
    data[i + 1] = clampChannel(LAND_COLOR.g * (1 + shade));
    data[i + 2] = clampChannel(LAND_COLOR.b * (1 + shade));
  }

  context.putImageData(imageData, 0, 0);
  const paletteTexture = new CanvasTexture(canvas);
  paletteTexture.colorSpace = SRGBColorSpace;
  paletteTexture.wrapS = ClampToEdgeWrapping;
  paletteTexture.wrapT = ClampToEdgeWrapping;
  paletteTexture.needsUpdate = true;
  return paletteTexture;
}

function EarthMesh({ hovered }) {
  const groupRef = useRef(null);
  const earthMap = useLoader(TextureLoader, earthTextureUrl);
  useLoader(TextureLoader, earthCloudsUrl);
  const paletteMap = useMemo(() => buildPaletteTexture(earthMap), [earthMap]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) {
      return;
    }

    const target = hovered.current ? 0.18 : 0.06;
    group.rotation.y += delta * target;
  });

  return (
    <group ref={groupRef}>
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[1, 96, 96]} />
        <meshStandardMaterial
          map={paletteMap ?? earthMap}
          roughness={0.82}
          metalness={0.04}
          emissive="#111111"
          emissiveIntensity={0.1}
        />
      </mesh>

      <mesh scale={1.016}>
        <sphereGeometry args={[1, 96, 96]} />
        <meshStandardMaterial
          color={LAND_EMISSIVE}
          transparent
          opacity={0.07}
          depthWrite={false}
        />
      </mesh>

      <mesh scale={1.065}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshBasicMaterial
          color="#9be7ff"
          transparent
          opacity={0.08}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

export function Globe() {
  const hovered = useRef(false);

  return (
    <div className="relative w-[20rem] h-[20rem] md:w-[38rem] md:h-[38rem] mx-auto">
      <div className="absolute inset-[10%] rounded-full bg-[#0BB5FF]/32 blur-[92px]" />
      <div className="absolute inset-[16%] rounded-full bg-brand-lime/20 blur-[64px]" />
      <div className="absolute inset-[24%] rounded-full bg-[#e9faff]/28 blur-[30px]" />

      <div
        className="absolute inset-0"
        onPointerEnter={() => {
          hovered.current = true;
        }}
        onPointerLeave={() => {
          hovered.current = false;
        }}
      >
        <Canvas
          camera={{ position: [0, 0, 3.2], fov: 38 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true }}
        >
          <ambientLight intensity={0.94} color="#f2fbff" />
          <directionalLight position={[5, 3, 5]} intensity={1.2} color="#f7fdff" />
          <directionalLight position={[-4, -2, -3]} intensity={0.46} color="#6fd6ff" />

          <Suspense fallback={null}>
            <EarthMesh hovered={hovered} />
          </Suspense>

          <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
        </Canvas>
      </div>
    </div>
  );
}
