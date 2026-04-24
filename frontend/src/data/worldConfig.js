export const CLUSTER_THEMES = {
  ai_data: {
    accent: '#76e36f',
    glow: 'rgba(118, 227, 111, 0.34)',
    atmosphere: '#5de2ff',
    lore: 'Forge intelligent systems, decode data, and unlock model-powered civilizations.',
  },
  cloud_infrastructure: {
    accent: '#ffb347',
    glow: 'rgba(255, 179, 71, 0.34)',
    atmosphere: '#8bc4ff',
    lore: 'Construct resilient platforms, automate fleets, and defend distributed kingdoms.',
  },
};

export const ASIA_CAMPAIGN_REALMS = [
  {
    roleId: 'platform_engineer',
    iso3: 'RUS',
    countryName: 'Russia',
    realm: 'Iron Frontier',
    borderFile: '/maps/rus-adm0.json',
    stateMapFile: '/maps/rus-adm1.json',
  },
  {
    roleId: 'ai_researcher',
    iso3: 'CHN',
    countryName: 'China',
    realm: 'Dragon Lab',
    borderFile: '/maps/chn-adm0.json',
    stateMapFile: '/maps/chn-adm1.json',
  },
  {
    roleId: 'machine_learning_engineer',
    iso3: 'IND',
    countryName: 'India',
    realm: 'Insight Republic',
    borderFile: '/maps/ind-adm0.json',
    stateMapFile: '/maps/ind-adm1.json',
  },
  {
    roleId: 'cloud_architect',
    iso3: 'KAZ',
    countryName: 'Kazakhstan',
    realm: 'Sky Route Steppe',
    borderFile: '/maps/kaz-adm0.json',
    stateMapFile: '/maps/kaz-adm1.json',
  },
  {
    roleId: 'site_reliability_engineer',
    iso3: 'SAU',
    countryName: 'Saudi Arabia',
    realm: 'Reliability Dunes',
    borderFile: '/maps/sau-adm0.json',
    stateMapFile: '/maps/sau-adm1.json',
  },
];

export const LOCKED_WORLD_REGIONS = ['Europe', 'Africa', 'Americas', 'Oceania'];

export const ROLE_WORLD_PROFILES = {
  ai_engineer: { iso3: 'USA', countryName: 'United States of America', realm: 'Silicon Frontier', borderFile: '/maps/usa-adm0.json', stateMapFile: '/maps/usa-adm1.json' },
  machine_learning_engineer: { iso3: 'CAN', countryName: 'Canada', realm: 'Vector Dominion', borderFile: '/maps/can-adm0.json', stateMapFile: '/maps/can-adm1.json' },
  data_scientist: { iso3: 'IND', countryName: 'India', realm: 'Insight Republic', borderFile: '/maps/ind-adm0.json', stateMapFile: '/maps/ind-adm1.json' },
  data_analyst: { iso3: 'GBR', countryName: 'United Kingdom', realm: 'Signal Isles', borderFile: '/maps/gbr-adm0.json', stateMapFile: '/maps/gbr-adm1.json' },
  ai_researcher: { iso3: 'DEU', countryName: 'Germany', realm: 'Theory Forge', borderFile: '/maps/deu-adm0.json', stateMapFile: '/maps/deu-adm1.json' },
  nlp_engineer: { iso3: 'SGP', countryName: 'Singapore', realm: 'Language Nexus', borderFile: '/maps/sgp-adm0.json', stateMapFile: '/maps/sgp-adm1.json' },
  mlops_engineer: { iso3: 'KOR', countryName: 'South Korea', realm: 'Automation Arc', borderFile: '/maps/kor-adm0.json', stateMapFile: '/maps/kor-adm1.json' },
  cloud_architect: { iso3: 'JPN', countryName: 'Japan', realm: 'SkyGrid Shogunate', borderFile: '/maps/jpn-adm0.json', stateMapFile: '/maps/jpn-adm1.json' },
  devops_engineer: { iso3: 'AUS', countryName: 'Australia', realm: 'Pipeline Outback', borderFile: '/maps/aus-adm0.json', stateMapFile: '/maps/aus-adm1.json' },
  site_reliability_engineer: { iso3: 'NLD', countryName: 'Netherlands', realm: 'Reliability Delta', borderFile: '/maps/nld-adm0.json', stateMapFile: '/maps/nld-adm1.json' },
  cloud_engineer: { iso3: 'ARE', countryName: 'United Arab Emirates', realm: 'Cloud Citadel', borderFile: '/maps/are-adm0.json', stateMapFile: '/maps/are-adm1.json' },
  platform_engineer: { iso3: 'SWE', countryName: 'Sweden', realm: 'Platform Fjords', borderFile: '/maps/swe-adm0.json', stateMapFile: '/maps/swe-adm1.json' },
  cloud_security_engineer: { iso3: 'BRA', countryName: 'Brazil', realm: 'Shield Rainforest', borderFile: '/maps/bra-adm0.json', stateMapFile: '/maps/bra-adm1.json' },
  infrastructure_automation_engineer: { iso3: 'ZAF', countryName: 'South Africa', realm: 'Automation Cape', borderFile: '/maps/zaf-adm0.json', stateMapFile: '/maps/zaf-adm1.json' },
};

const ASIA_CAMPAIGN_PROFILE_MAP = new Map(
  ASIA_CAMPAIGN_REALMS.map((realm) => [realm.roleId, realm])
);

export function getClusterTheme(continentId) {
  return CLUSTER_THEMES[continentId] || CLUSTER_THEMES.ai_data;
}

export function isPlayableRealm(roleId) {
  return ASIA_CAMPAIGN_PROFILE_MAP.has(roleId);
}

export function getRoleWorldProfile(roleId) {
  return ASIA_CAMPAIGN_PROFILE_MAP.get(roleId) || ROLE_WORLD_PROFILES[roleId] || {
    iso3: 'IND',
    countryName: 'India',
    realm: 'Quest Realm',
    borderFile: '/maps/ind-adm0.json',
    stateMapFile: '/maps/ind-adm1.json',
    imageMapFile: '/maps/india.avif',
  };
}
