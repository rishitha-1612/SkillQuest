import { useMemo } from 'react';
import { geoMercator, geoPath } from 'd3-geo';

const DEPTH_LAYERS = 8;
const DEPTH_STEP = 3;

function colorFor(index, active) {
  if (active) {
    return {
      top: '#e8ffc8',
      side: '#9ccc5a',
      stroke: '#4b8d1f',
    };
  }

  const palette = [
    ['#dff3e5', '#7ec78e'],
    ['#d9f0ff', '#78b0dd'],
    ['#efe6ff', '#9e8fdd'],
    ['#fff0d9', '#e0ac64'],
    ['#e2f9ef', '#77c0a0'],
  ];
  const [top, side] = palette[index % palette.length];
  return { top, side, stroke: '#4b83b3' };
}

export default function CountryMap3D({ mapData, selectedStateId }) {
  const projection = useMemo(() => {
    if (!mapData) return null;
    return geoMercator().fitSize([920, 640], mapData);
  }, [mapData]);

  const pathBuilder = useMemo(() => (projection ? geoPath(projection) : null), [projection]);
  const features = mapData?.features || [];

  if (!features.length || !pathBuilder) {
    return <div className="country-map-fallback">Map loading...</div>;
  }

  return (
    <div className="country-3d-map-shell">
      <svg className="country-live-map country-live-map-3d" viewBox="0 0 920 640">
        <defs>
          <linearGradient id="countrySea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f9fdff" />
            <stop offset="100%" stopColor="#dff2ff" />
          </linearGradient>
        </defs>
        <rect width="920" height="640" rx="24" fill="url(#countrySea)" />

        {Array.from({ length: DEPTH_LAYERS }).map((_, layer) => {
          const yOffset = (DEPTH_LAYERS - layer) * DEPTH_STEP;
          return (
            <g key={`layer-${layer}`} transform={`translate(0 ${yOffset})`} pointerEvents="none">
              {features.map((feature, index) => {
                const name = feature.properties?.shapeName || feature.properties?.name || '';
                const active = selectedStateId && name.toLowerCase().includes(selectedStateId.split('_')[0]);
                const tone = colorFor(index, active);
                return (
                  <path
                    key={`${layer}-${name}-${index}`}
                    d={pathBuilder(feature)}
                    fill={tone.side}
                    stroke={tone.side}
                    strokeWidth="1.2"
                  />
                );
              })}
            </g>
          );
        })}

        {features.map((feature, index) => {
          const name = feature.properties?.shapeName || feature.properties?.name || '';
          const active = false;
          const tone = colorFor(index, active);
          const [cx, cy] = pathBuilder.centroid(feature);
          return (
            <g key={`${name}-${index}`}>
              <path d={pathBuilder(feature)} fill={tone.top} stroke={tone.stroke} strokeWidth="1.5" />
              {Number.isFinite(cx) && Number.isFinite(cy) && (
                <circle cx={cx} cy={cy} r="2.8" className="country-state-anchor" />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
