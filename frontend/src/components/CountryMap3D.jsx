import { useMemo } from 'react';
import { geoMercator, geoPath } from 'd3-geo';

function colorFor(index, active) {
  if (active) {
    return {
      fill: '#dff7bf',
      stroke: '#58cc02',
    };
  }

  const palette = ['#dff3e5', '#d9f0ff', '#efe6ff', '#fff0d9', '#e2f9ef'];
  return { fill: palette[index % palette.length], stroke: '#4b83b3' };
}

function isSelectedFeature(feature, selectedStateId) {
  if (!selectedStateId) return false;
  const featureName = (
    feature.properties?.shapeName ||
    feature.properties?.name ||
    feature.properties?.shapeISO ||
    ''
  ).toLowerCase();
  const tokens = selectedStateId.toLowerCase().split('_');
  return tokens.some((token) => token.length > 3 && featureName.includes(token));
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

        {features.map((feature, index) => {
          const name = feature.properties?.shapeName || feature.properties?.name || '';
          const active = isSelectedFeature(feature, selectedStateId);
          const tone = colorFor(index, active);
          const [cx, cy] = pathBuilder.centroid(feature);
          return (
            <g key={`${name}-${index}`}>
              <path d={pathBuilder(feature)} fill={tone.fill} stroke={tone.stroke} strokeWidth="1.6" />
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
