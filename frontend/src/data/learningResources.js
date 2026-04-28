const STATE_VIDEO_HINTS = {
  ci_cd_pipelines: {
    channelHint: 'TechWorld with Nana',
    queryHint: 'CI CD beginner',
  },
  cloud_platforms: {
    channelHint: 'AWS or TechWorld with Nana',
    queryHint: 'cloud architecture beginner',
  },
  containers_orchestration: {
    channelHint: 'TechWorld with Nana',
    queryHint: 'Docker Kubernetes beginner',
  },
  data_visualization: {
    channelHint: 'freeCodeCamp or Alex The Analyst',
    queryHint: 'data visualization python',
  },
  deep_learning: {
    channelHint: 'StatQuest or freeCodeCamp',
    queryHint: 'deep learning explained',
  },
  machine_learning: {
    channelHint: 'StatQuest or freeCodeCamp',
    queryHint: 'machine learning explained',
  },
  mathematics_statistics: {
    channelHint: 'StatQuest or Khan Academy',
    queryHint: 'statistics for data science',
  },
  networking_fundamentals: {
    channelHint: 'PowerCert Animated Videos',
    queryHint: 'networking basics',
  },
  python_programming: {
    channelHint: 'Programming with Mosh or Corey Schafer',
    queryHint: 'python tutorial',
  },
  system_design: {
    channelHint: 'ByteByteGo',
    queryHint: 'system design interview',
  },
  blockchain_fundamentals: {
    channelHint: 'Whiteboard Crypto',
    queryHint: 'blockchain explained',
  },
  api_integration: {
    channelHint: 'Web Dev Simplified or freeCodeCamp',
    queryHint: 'REST API tutorial',
  },
  cybersecurity_fundamentals: {
    channelHint: 'NetworkChuck or Simplilearn',
    queryHint: 'cybersecurity basics',
  },
  devsecops_security: {
    channelHint: 'freeCodeCamp or TechWorld with Nana',
    queryHint: 'DevSecOps tutorial',
  },
  data_engineering: {
    channelHint: 'freeCodeCamp or Seattle Data Guy',
    queryHint: 'data engineering tutorial',
  },
  backend_development: {
    channelHint: 'Web Dev Simplified or freeCodeCamp',
    queryHint: 'backend development tutorial',
  },
  prompt_engineering: {
    channelHint: 'DeepLearningAI or IBM Technology',
    queryHint: 'prompt engineering tutorial',
  },
  frontend_development: {
    channelHint: 'Kevin Powell or Web Dev Simplified',
    queryHint: 'frontend development tutorial',
  },
  sql_databases: {
    channelHint: 'Alex The Analyst or freeCodeCamp',
    queryHint: 'SQL tutorial',
  },
};

const CONCEPT_VIDEO_OVERRIDES = {
  python_basics: {
    title: 'Python Variables - Python Tutorial for Beginners with Examples',
    channel: 'Programming with Mosh',
    duration: '6 min',
    url: 'https://www.youtube.com/watch?v=cQT33yu9pY8',
    provider: 'YouTube',
    videoId: 'cQT33yu9pY8',
  },
  data_structures: {
    title: 'Python Tutorial for Beginners 5: Dictionaries - Working with Key-Value Pairs',
    channel: 'Corey Schafer',
    duration: '10 min',
    url: 'https://www.youtube.com/watch?v=daefaLgNkw0',
    provider: 'YouTube',
    videoId: 'daefaLgNkw0',
  },
  functions_modules: {
    title: 'Python Tutorial for Beginners 8: Functions',
    channel: 'Corey Schafer',
    duration: '22 min',
    url: 'https://www.youtube.com/watch?v=9Os0o3wzS_I',
    provider: 'YouTube',
    videoId: '9Os0o3wzS_I',
  },
  oop_files: {
    title: 'Python OOP Tutorial 1: Classes and Instances',
    channel: 'Corey Schafer',
    duration: '19 min',
    url: 'https://www.youtube.com/watch?v=ZDa-Z5JzLYM',
    provider: 'YouTube',
    videoId: 'ZDa-Z5JzLYM',
  },
  backprop_optimization: {
    title: 'Gradient Descent, Step-by-Step',
    channel: 'StatQuest with Josh Starmer',
    duration: '12 min',
    url: 'https://www.youtube.com/watch?v=sDv4f4s2SB8',
    provider: 'YouTube',
    videoId: 'sDv4f4s2SB8',
  },
};

const STATE_PRACTICE_RESOURCES = {
  python_programming: [
    {
      title: 'CheckiO Python',
      type: 'Game',
      url: 'https://py.checkio.org/',
    },
    {
      title: 'Exercism Python Track',
      type: 'Practice',
      url: 'https://exercism.org/tracks/python',
    },
    {
      title: 'Python Tutor',
      type: 'Visualizer',
      url: 'https://pythontutor.com/',
    },
  ],
  mathematics_statistics: [
    {
      title: 'Seeing Theory',
      type: 'Interactive',
      url: 'https://seeing-theory.brown.edu/',
    },
    {
      title: 'Khan Academy Statistics',
      type: 'Practice',
      url: 'https://www.khanacademy.org/math/statistics-probability',
    },
  ],
  machine_learning: [
    {
      title: 'Kaggle Intro to Machine Learning',
      type: 'Hands-on',
      url: 'https://www.kaggle.com/learn/intro-to-machine-learning',
    },
    {
      title: 'Google ML Crash Course',
      type: 'Course',
      url: 'https://developers.google.com/machine-learning/crash-course',
    },
  ],
  deep_learning: [
    {
      title: 'TensorFlow Playground',
      type: 'Interactive',
      url: 'https://playground.tensorflow.org/',
    },
    {
      title: 'Teachable Machine',
      type: 'Experiment',
      url: 'https://teachablemachine.withgoogle.com/',
    },
  ],
  api_integration: [
    {
      title: 'Hoppscotch',
      type: 'Playground',
      url: 'https://hoppscotch.io/',
    },
    {
      title: 'Postman API Fundamentals',
      type: 'Practice',
      url: 'https://academy.postman.com/path/postman-api-fundamentals-student-expert',
    },
  ],
  sql_databases: [
    {
      title: 'SQLBolt',
      type: 'Interactive',
      url: 'https://sqlbolt.com/',
    },
    {
      title: 'Mode SQL Tutorial',
      type: 'Practice',
      url: 'https://mode.com/sql-tutorial/',
    },
  ],
  data_visualization: [
    {
      title: 'Kaggle Data Visualization',
      type: 'Hands-on',
      url: 'https://www.kaggle.com/learn/data-visualization',
    },
    {
      title: 'Tableau Public',
      type: 'Builder',
      url: 'https://public.tableau.com/',
    },
  ],
  prompt_engineering: [
    {
      title: 'Learn Prompting',
      type: 'Interactive',
      url: 'https://learnprompting.org/',
    },
    {
      title: 'Prompting Guide',
      type: 'Reference',
      url: 'https://www.promptingguide.ai/',
    },
  ],
  system_design: [
    {
      title: 'Excalidraw',
      type: 'Whiteboard',
      url: 'https://excalidraw.com/',
    },
    {
      title: 'ByteByteGo Blog',
      type: 'Reference',
      url: 'https://blog.bytebytego.com/',
    },
  ],
  cloud_platforms: [
    {
      title: 'AWS Skill Builder',
      type: 'Lab',
      url: 'https://skillbuilder.aws/',
    },
    {
      title: 'Microsoft Learn Azure',
      type: 'Lab',
      url: 'https://learn.microsoft.com/en-us/training/azure/',
    },
  ],
};

function sanitizeTitle(title) {
  return title.replace(/\uFFFD/g, '-');
}

function buildYouTubeSearchUrl(query) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

function buildConceptVideo(stateDetails, node) {
  if (CONCEPT_VIDEO_OVERRIDES[node.id]) {
    return {
      searchQuery: `${node.title} ${stateDetails.title}`,
      ...CONCEPT_VIDEO_OVERRIDES[node.id],
    };
  }

  const hint = STATE_VIDEO_HINTS[stateDetails?.state_id] || {};
  const query = `${node.title} ${stateDetails.title} ${hint.queryHint || 'tutorial'} ${hint.channelHint || ''} 5 to 15 minutes`;

  return {
    searchQuery: query.trim(),
    title: `${node.title} recommended lesson`,
    channel: hint.channelHint || 'Curated YouTube pick',
    duration: '5-15 min target',
    url: buildYouTubeSearchUrl(query),
    provider: 'YouTube',
    videoId: '',
  };
}

export function getConceptLearningPlan(stateDetails) {
  if (!stateDetails) return [];

  return (stateDetails.nodes || []).map((node) => {
    const video = buildConceptVideo(stateDetails, node);
    return {
      nodeId: node.id,
      stateId: stateDetails.state_id,
      title: node.title,
      description: sanitizeTitle(node.description),
      videoId: video.videoId,
      videoTitle: video.title,
      channel: video.channel,
      url: video.url,
      provider: video.provider,
      duration: video.duration,
      searchQuery: video.searchQuery,
    };
  });
}

export function getPracticeResources(stateDetails) {
  if (!stateDetails) return [];
  return STATE_PRACTICE_RESOURCES[stateDetails.state_id] || [];
}

export function getLearningProgress(progress, stateId) {
  return progress?.learning?.[stateId] || { concepts: {} };
}

export function getConceptProgress(progress, stateId, nodeId) {
  const learning = getLearningProgress(progress, stateId);
  return learning.concepts?.[nodeId] || {
    videoDone: false,
    notesDone: false,
  };
}

export function isConceptComplete(progress, stateId, nodeId) {
  const concept = getConceptProgress(progress, stateId, nodeId);
  return Boolean(concept.videoDone && concept.notesDone);
}

export function isLearningRequirementComplete(stateDetails, progress) {
  if (!stateDetails) return false;
  return (stateDetails.nodes || []).every((node) => isConceptComplete(progress, stateDetails.state_id, node.id));
}

export function buildConceptNotes(stateDetails, node, index) {
  if (!stateDetails || !node) return [];
  const previous = stateDetails.nodes?.[index - 1];
  const next = stateDetails.nodes?.[index + 1];

  return [
    {
      title: 'What to Learn',
      items: [
        `${node.title} is the focus concept for this step in ${stateDetails.title}.`,
        sanitizeTitle(node.description),
        `This concept is expected to prepare you for practical work worth ${node.xp_reward} XP.`,
      ],
    },
    {
      title: 'How it Fits',
      items: [
        previous ? `Build on the previous concept: ${previous.title}.` : `This is the entry concept for ${stateDetails.title}.`,
        next ? `You should be ready to apply this before moving to ${next.title}.` : `This concept prepares you for the final capstone in this skill.`,
      ],
    },
    {
      title: 'Assessment Focus',
      items: [
        `Be able to explain ${node.title} in simple words.`,
        `Be ready to identify a common mistake or bad practice related to ${node.title}.`,
        `Expect scenario-based questions that test when and why this concept should be used.`,
      ],
    },
  ];
}
