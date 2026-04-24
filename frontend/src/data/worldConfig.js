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

export const ROLE_WORLD_PROFILES = {
  ai_engineer: { iso3: 'USA', countryName: 'United States of America', realm: 'Silicon Frontier', mapFile: '/maps/usa-adm1.json' },
  machine_learning_engineer: { iso3: 'CAN', countryName: 'Canada', realm: 'Vector Dominion', mapFile: '/maps/can-adm1.json' },
  data_scientist: { iso3: 'IND', countryName: 'India', realm: 'Insight Republic', mapFile: '/maps/ind-adm1.json' },
  data_analyst: { iso3: 'GBR', countryName: 'United Kingdom', realm: 'Signal Isles', mapFile: '/maps/gbr-adm1.json' },
  ai_researcher: { iso3: 'DEU', countryName: 'Germany', realm: 'Theory Forge', mapFile: '/maps/deu-adm1.json' },
  nlp_engineer: { iso3: 'SGP', countryName: 'Singapore', realm: 'Language Nexus', mapFile: '/maps/sgp-adm1.json' },
  mlops_engineer: { iso3: 'KOR', countryName: 'South Korea', realm: 'Automation Arc', mapFile: '/maps/kor-adm1.json' },
  cloud_architect: { iso3: 'JPN', countryName: 'Japan', realm: 'SkyGrid Shogunate', mapFile: '/maps/jpn-adm1.json' },
  devops_engineer: { iso3: 'AUS', countryName: 'Australia', realm: 'Pipeline Outback', mapFile: '/maps/aus-adm1.json' },
  site_reliability_engineer: { iso3: 'NLD', countryName: 'Netherlands', realm: 'Reliability Delta', mapFile: '/maps/nld-adm1.json' },
  cloud_engineer: { iso3: 'ARE', countryName: 'United Arab Emirates', realm: 'Cloud Citadel', mapFile: '/maps/are-adm1.json' },
  platform_engineer: { iso3: 'SWE', countryName: 'Sweden', realm: 'Platform Fjords', mapFile: '/maps/swe-adm1.json' },
  cloud_security_engineer: { iso3: 'BRA', countryName: 'Brazil', realm: 'Shield Rainforest', mapFile: '/maps/bra-adm1.json' },
  infrastructure_automation_engineer: { iso3: 'ZAF', countryName: 'South Africa', realm: 'Automation Cape', mapFile: '/maps/zaf-adm1.json' },
};

export function getClusterTheme(continentId) {
  return CLUSTER_THEMES[continentId] || CLUSTER_THEMES.ai_data;
}

export function getRoleWorldProfile(roleId) {
  return ROLE_WORLD_PROFILES[roleId] || {
    iso3: 'IND',
    countryName: 'India',
    realm: 'Quest Realm',
    mapFile: '/maps/ind-adm1.json',
  };
}
