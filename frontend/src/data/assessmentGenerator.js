function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))];
}

function seededRandom(seed) {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function shuffleWithSeed(values, seed) {
  const next = [...values];
  const random = seededRandom(seed);
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function buildOptions(correct, distractors, offset = 0, seed = 1) {
  const pool = uniqueValues(distractors).filter((item) => item !== correct);
  const rotated = pool.slice(offset).concat(pool.slice(0, offset));
  const options = uniqueValues([correct, ...rotated.slice(0, 3)]);
  return shuffleWithSeed(options, seed + offset);
}

function addQuestion(questions, prompt, correctAnswer, options) {
  if (!prompt || !correctAnswer || !options?.length) return;
  const finalOptions = options.includes(correctAnswer) ? options : [correctAnswer, ...options.slice(0, 3)];
  if (uniqueValues(finalOptions).length < 4) return;
  questions.push({
    prompt,
    correctAnswer,
    options: finalOptions.slice(0, 4),
  });
}

export function buildAssessmentQuestions(stateDetails, seed = 1) {
  if (!stateDetails?.nodes?.length) return [];

  const nodes = stateDetails.nodes;
  const titles = nodes.map((node) => node.title);
  const types = uniqueValues(nodes.map((node) => node.type));
  const xpValues = uniqueValues(nodes.map((node) => `${node.xp_reward} XP`));
  const minuteValues = uniqueValues(nodes.map((node) => `${node.estimated_time_minutes} min`));
  const questions = [];

  addQuestion(
    questions,
    `Which skill province are you being assessed on right now?`,
    stateDetails.title,
    buildOptions(stateDetails.title, titles, 1, seed)
  );

  addQuestion(
    questions,
    `Which level is the entry point for ${stateDetails.title}?`,
    nodes[0].title,
    buildOptions(nodes[0].title, titles, 2, seed)
  );

  addQuestion(
    questions,
    `Which level is the final assessment route for ${stateDetails.title}?`,
    nodes[nodes.length - 1].title,
    buildOptions(nodes[nodes.length - 1].title, titles, 3, seed)
  );

  addQuestion(
    questions,
    `How many levels are in the ${stateDetails.title} journey?`,
    `${nodes.length}`,
    buildOptions(`${nodes.length}`, ['4', '5', '6', '7', '8'], 1, seed)
  );

  addQuestion(
    questions,
    `How much total XP is available across the ${stateDetails.title} route?`,
    `${nodes.reduce((sum, node) => sum + node.xp_reward, 0)} XP`,
    buildOptions(
      `${nodes.reduce((sum, node) => sum + node.xp_reward, 0)} XP`,
      ['120 XP', '140 XP', '150 XP', '160 XP', '170 XP', '180 XP'],
      2,
      seed
    )
  );

  nodes.forEach((node, index) => {
    addQuestion(
      questions,
      `Which level focuses on this objective: "${node.description}"?`,
      node.title,
      buildOptions(node.title, titles, index, seed)
    );

    addQuestion(
      questions,
      `What type of level is "${node.title}"?`,
      node.type,
      buildOptions(node.type, types, index, seed)
    );

    addQuestion(
      questions,
      `How much XP does "${node.title}" reward?`,
      `${node.xp_reward} XP`,
      buildOptions(`${node.xp_reward} XP`, xpValues, index, seed)
    );

    addQuestion(
      questions,
      `How long is "${node.title}" expected to take?`,
      `${node.estimated_time_minutes} min`,
      buildOptions(`${node.estimated_time_minutes} min`, minuteValues, index, seed)
    );

    addQuestion(
      questions,
      `Which level number is "${node.title}" in the ${stateDetails.title} route?`,
      `${index + 1}`,
      buildOptions(`${index + 1}`, ['1', '2', '3', '4', '5', '6'], index, seed)
    );
  });

  if (questions.length < 25) {
    nodes.forEach((node, index) => {
      addQuestion(
        questions,
        `How many quiz questions are attached to "${node.title}"?`,
        `${node.question_refs?.count || 0}`,
        buildOptions(`${node.question_refs?.count || 0}`, ['6', '8', '10', '12', '14'], index, seed)
      );
    });
  }

  return shuffleWithSeed(questions, seed).slice(0, 25).map((question, index) => ({
    id: `${stateDetails.state_id}-${index + 1}`,
    index: index + 1,
    ...question,
  }));
}
