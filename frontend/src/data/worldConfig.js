export const CLUSTER_THEMES = {
  ai_data: {
    accent: '#76e36f',
    glow: 'rgba(118, 227, 111, 0.34)',
    atmosphere: '#5de2ff',
    lore: 'Train intelligent systems, shape AI workflows, and master data-driven strategy.',
  },
  cloud_infrastructure: {
    accent: '#ffb347',
    glow: 'rgba(255, 179, 71, 0.34)',
    atmosphere: '#8bc4ff',
    lore: 'Build secure software worlds, resilient platforms, and large-scale engineering systems.',
  },
};

export const ACTIVE_REALMS = [
  {
    roleId: 'cloud_architect',
    iso3: 'RUS',
    countryName: 'Russia',
    realm: 'Skyforge Dominion',
    borderFile: '/maps/rus-adm0.json',
    stateMapFile: '/maps/rus-adm1.json',
  },
  {
    roleId: 'full_stack_engineer',
    iso3: 'CAN',
    countryName: 'Canada',
    realm: 'Northern Buildlands',
    borderFile: '/maps/can-adm0.json',
    stateMapFile: '/maps/can-adm1.json',
  },
  {
    roleId: 'cybersecurity_specialist',
    iso3: 'CHN',
    countryName: 'China',
    realm: 'Firewall Empire',
    borderFile: '/maps/chn-adm0.json',
    stateMapFile: '/maps/chn-adm1.json',
  },
  {
    roleId: 'data_engineer',
    iso3: 'USA',
    countryName: 'United States of America',
    realm: 'Pipeline Federation',
    borderFile: '/maps/usa-adm0.json',
    stateMapFile: '/maps/usa-adm1.json',
  },
  {
    roleId: 'ml_engineer',
    iso3: 'KOR',
    countryName: 'South Korea',
    realm: 'Model Peninsula',
    borderFile: '/maps/kor-adm0.json',
    stateMapFile: '/maps/kor-adm1.json',
  },
  {
    roleId: 'ai_engineer',
    iso3: 'IND',
    countryName: 'India',
    realm: 'Insight Republic',
    borderFile: '/maps/ind-adm0.json',
    stateMapFile: '/maps/ind-adm1.json',
  },
  {
    roleId: 'data_scientist',
    iso3: 'AUS',
    countryName: 'Australia',
    realm: 'Signal Outback',
    borderFile: '/maps/aus-adm0.json',
    stateMapFile: '/maps/aus-adm1.json',
  },
  {
    roleId: 'blockchain_developer',
    iso3: 'KAZ',
    countryName: 'Kazakhstan',
    realm: 'Ledger Steppe',
    borderFile: '/maps/kaz-adm0.json',
    stateMapFile: '/maps/kaz-adm1.json',
  },
  {
    roleId: 'prompt_engineer',
    iso3: 'SAU',
    countryName: 'Saudi Arabia',
    realm: 'Prompt Dunes',
    borderFile: '/maps/sau-adm0.json',
    stateMapFile: '/maps/sau-adm1.json',
  },
  {
    roleId: 'software_developer',
    iso3: 'ZAF',
    countryName: 'South Africa',
    realm: 'Code Cape',
    borderFile: '/maps/zaf-adm0.json',
    stateMapFile: '/maps/zaf-adm1.json',
  },
];

export const LOCKED_WORLD_REGIONS = ['Europe', 'Japan', 'Middle micro-realms'];

export const ROLE_WORLD_PROFILES = {
  cloud_architect: { iso3: 'RUS', countryName: 'Russia', realm: 'Skyforge Dominion', borderFile: '/maps/rus-adm0.json', stateMapFile: '/maps/rus-adm1.json' },
  full_stack_engineer: { iso3: 'CAN', countryName: 'Canada', realm: 'Northern Buildlands', borderFile: '/maps/can-adm0.json', stateMapFile: '/maps/can-adm1.json' },
  cybersecurity_specialist: { iso3: 'CHN', countryName: 'China', realm: 'Firewall Empire', borderFile: '/maps/chn-adm0.json', stateMapFile: '/maps/chn-adm1.json' },
  data_engineer: { iso3: 'USA', countryName: 'United States of America', realm: 'Pipeline Federation', borderFile: '/maps/usa-adm0.json', stateMapFile: '/maps/usa-adm1.json' },
  ml_engineer: { iso3: 'KOR', countryName: 'South Korea', realm: 'Model Peninsula', borderFile: '/maps/kor-adm0.json', stateMapFile: '/maps/kor-adm1.json' },
  ai_engineer: { iso3: 'IND', countryName: 'India', realm: 'Insight Republic', borderFile: '/maps/ind-adm0.json', stateMapFile: '/maps/ind-adm1.json' },
  data_scientist: { iso3: 'AUS', countryName: 'Australia', realm: 'Signal Outback', borderFile: '/maps/aus-adm0.json', stateMapFile: '/maps/aus-adm1.json' },
  blockchain_developer: { iso3: 'KAZ', countryName: 'Kazakhstan', realm: 'Ledger Steppe', borderFile: '/maps/kaz-adm0.json', stateMapFile: '/maps/kaz-adm1.json' },
  prompt_engineer: { iso3: 'SAU', countryName: 'Saudi Arabia', realm: 'Prompt Dunes', borderFile: '/maps/sau-adm0.json', stateMapFile: '/maps/sau-adm1.json' },
  software_developer: { iso3: 'ZAF', countryName: 'South Africa', realm: 'Code Cape', borderFile: '/maps/zaf-adm0.json', stateMapFile: '/maps/zaf-adm1.json' },
};

const ACTIVE_REALM_PROFILE_MAP = new Map(
  ACTIVE_REALMS.map((realm) => [realm.roleId, realm])
);

export function getClusterTheme(continentId) {
  return CLUSTER_THEMES[continentId] || CLUSTER_THEMES.ai_data;
}

export function isPlayableRealm(roleId) {
  return ACTIVE_REALM_PROFILE_MAP.has(roleId);
}

export function getRoleWorldProfile(roleId) {
  return ACTIVE_REALM_PROFILE_MAP.get(roleId) || ROLE_WORLD_PROFILES[roleId] || {
    iso3: 'IND',
    countryName: 'India',
    realm: 'Quest Realm',
    borderFile: '/maps/ind-adm0.json',
    stateMapFile: '/maps/ind-adm1.json',
  };
}
