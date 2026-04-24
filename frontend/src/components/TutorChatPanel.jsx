import { useEffect, useMemo, useRef, useState } from 'react';
import { getAssessmentLock } from '../data/assessmentLock';
import { getSkillQuestionBankConfig } from '../data/assessmentQuestionBank';

const QUICK_PROMPTS = [
  'Explain this skill simply',
  'Give me an analogy',
  'What should I study next?',
  'Ask me an interview question',
];

function tokenize(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function buildKeywordSet(...chunks) {
  const words = chunks
    .filter(Boolean)
    .flatMap((chunk) => tokenize(Array.isArray(chunk) ? chunk.join(' ') : chunk));
  return new Set(words);
}

function analogyForTerm(term) {
  const normalized = term.toLowerCase();
  const library = [
    { keys: ['cache'], value: 'Think of a cache like keeping the answer on a sticky note at your desk instead of walking back to the archive every time.' },
    { keys: ['transaction'], value: 'Think of a transaction like a sealed package deal: either every item goes through together, or the whole package is canceled.' },
    { keys: ['index'], value: 'Think of an index like the index page in a book. You can jump to the right page quickly instead of scanning every line.' },
    { keys: ['routing', 'route'], value: 'Think of routing like road signs that decide which lane each request should take to reach the right destination.' },
    { keys: ['authentication'], value: 'Think of authentication like showing your ID at the gate before anyone lets you inside.' },
    { keys: ['authorization'], value: 'Think of authorization like the colored badge that decides which rooms you may enter after you are inside.' },
    { keys: ['gradient'], value: 'Think of a gradient like the slope on a hill. It tells you which direction is uphill and which direction helps you move down fastest.' },
    { keys: ['embedding'], value: 'Think of embeddings like placing similar books on nearby shelves so related ideas sit close together.' },
    { keys: ['pipeline'], value: 'Think of a pipeline like an assembly line. Each station does one clear job before passing the work forward.' },
    { keys: ['orchestration', 'kubernetes'], value: 'Think of orchestration like an airport control tower coordinating many planes so traffic keeps moving safely.' },
    { keys: ['prompt'], value: 'Think of a prompt like briefing a smart assistant before a task. The clearer the brief, the better the result.' },
    { keys: ['feature'], value: 'Think of features like clues in a detective case. Good clues make the final decision much easier.' },
    { keys: ['probability'], value: 'Think of probability like a weather forecast. It does not promise the future, but it tells you how likely an outcome is.' },
    { keys: ['distribution'], value: 'Think of a distribution like a crowd photo that shows where most people are standing and who is far from the center.' },
    { keys: ['dns'], value: 'Think of DNS like a phone contacts list that converts a person’s name into the number you actually dial.' },
    { keys: ['serverless'], value: 'Think of serverless like renting a kitchen only when you need to cook, instead of owning the building all day.' },
  ];

  const match = library.find((item) => item.keys.some((key) => normalized.includes(key)));
  return match?.value || `Think of ${term} like one key station on a journey map. If that station is weak, every later stop becomes harder.`;
}

function summarizeSkill(stateDetails, config) {
  if (!stateDetails) return 'Open a skill and I will help break it down.';
  const firstThree = (config?.fundamentals || [])
    .slice(0, 3)
    .map((item) => item.term)
    .join(', ');
  return `${stateDetails.title} is about learning the core ideas, using them in realistic situations, and then proving you can apply them under pressure. The first big themes here are ${firstThree || 'the main foundations of the subject'}.`;
}

function findBestConcept(config, input) {
  if (!config) return null;
  const tokens = tokenize(input);
  let best = null;

  for (const concept of config.fundamentals || []) {
    const keywords = buildKeywordSet(concept.term, concept.meaning, concept.use, concept.impact, concept.risk);
    let score = 0;
    for (const token of tokens) {
      if (keywords.has(token)) score += 1;
    }
    if (!best || score > best.score) {
      best = { score, concept };
    }
  }

  return best?.score > 0 ? best.concept : null;
}

function findBestPractice(config, input) {
  if (!config) return null;
  const tokens = tokenize(input);
  let best = null;

  for (const practice of config.practices || []) {
    const keywords = buildKeywordSet(practice.scenario, practice.best, practice.reason, practice.metric, practice.antiPattern, practice.nextStep);
    let score = 0;
    for (const token of tokens) {
      if (keywords.has(token)) score += 1;
    }
    if (!best || score > best.score) {
      best = { score, practice };
    }
  }

  return best?.score > 0 ? best.practice : null;
}

function buildTutorReply(input, roleDetails, stateDetails) {
  const lower = (input || '').toLowerCase();
  const config = getSkillQuestionBankConfig(stateDetails?.state_id);
  const concept = findBestConcept(config, input);
  const practice = findBestPractice(config, input);
  const currentNode = stateDetails?.nodes?.[0];
  const nextNode = stateDetails?.nodes?.[1];
  const roleName = roleDetails?.title || 'this job path';
  const skillName = stateDetails?.title || 'this skill';

  if (lower.includes('project') || lower.includes('skillquest')) {
    return `${roleName} is the country, ${skillName} is the active state, and each level is one learning mission. The idea is to move from learning to practice to assessment instead of just reading theory.\n\nAnalogy: Think of the project like a world map RPG where each province trains one important ability before you unlock the next road.\n\nNext step: Stay on ${skillName} and focus on ${currentNode?.title || 'the current level'} before worrying about the whole map.`;
  }

  if (lower.includes('assessment') || lower.includes('exam') || lower.includes('test')) {
    return `Each skill assessment now pulls 25 questions from a 100-question bank built for ${skillName}. The set is mixed across easy, medium, and hard so the user is tested on foundations, application, and tougher judgment calls.\n\nAnalogy: It works like a boss gate. The early questions check your footing, the middle ones test your battle sense, and the harder ones check whether you can stay calm under pressure.\n\nNext step: Review ${currentNode?.title || 'the opening lesson'} and make sure you can explain the main ideas in your own words before taking the assessment.`;
  }

  if (lower.includes('interview')) {
    if (practice) {
      return `A strong interview-style answer here would be: ${practice.best}. That matters because ${practice.reason.toLowerCase()}.\n\nAnalogy: ${analogyForTerm(skillName)}\n\nWatch out for this mistake: ${practice.antiPattern}.\n\nNext step: Practice saying the answer out loud, then explain which signal you would watch first: ${practice.metric}.`;
    }
    return `Interview questions in ${skillName} usually test whether you can explain a core idea simply, apply it to a realistic situation, and avoid the most common mistake.\n\nAnalogy: It is less like reciting a dictionary and more like showing you can drive the vehicle safely on a real road.\n\nNext step: Pick one concept from ${skillName} and explain what it is, why it matters, and what goes wrong when it is ignored.`;
  }

  if (concept && (lower.includes('analogy') || lower.includes('simple') || lower.includes('explain') || lower.includes('what is') || lower.includes(concept.term.toLowerCase()))) {
    return `${concept.term} means ${concept.meaning.toLowerCase()}.\n\nWhy it matters: ${concept.impact}.\n\nAnalogy: ${analogyForTerm(concept.term)}\n\nSimple way to remember it: ${concept.use}.\n\nCommon mistake: ${concept.risk}.`;
  }

  if (practice && (lower.includes('how') || lower.includes('when') || lower.includes('should') || lower.includes('problem') || lower.includes('stuck'))) {
    return `In that kind of situation, the strongest move is: ${practice.best}.\n\nWhy: ${practice.reason}.\n\nThe first thing I would check: ${practice.metric}.\n\nAvoid this trap: ${practice.antiPattern}.\n\nNext step: ${practice.nextStep}.`;
  }

  if (lower.includes('next') || lower.includes('road') || lower.includes('progress') || lower.includes('study')) {
    return `Right now, your best next step is ${currentNode?.title || 'the current lesson'} inside ${skillName}. After that, move into ${nextNode?.title || 'the next level'} so you keep the learning order intact.\n\nAnalogy: Think of it like climbing stairs. You do not skip three steps and still expect a steady climb.\n\nGuide: Learn one idea, practice it once, then explain it simply before moving on.`;
  }

  if (lower.includes('doubt') || lower.includes('confused') || lower.includes('understand') || lower.includes('help')) {
    return `${summarizeSkill(stateDetails, config)}\n\nAnalogy: ${analogyForTerm(skillName)}\n\nGuide: Start with ${currentNode?.title || 'the first lesson'}, ask what real problem it solves, then connect it to ${nextNode?.title || 'the next step'}.\n\nIf you want, ask me about one specific idea and I will break it down more simply.`;
  }

  if (config) {
    const fallbackConcept = concept || config.fundamentals?.[0];
    return `${summarizeSkill(stateDetails, config)}\n\nA useful anchor concept here is ${fallbackConcept?.term || skillName}. ${fallbackConcept ? `It means ${fallbackConcept.meaning.toLowerCase()}.` : ''}\n\nAnalogy: ${analogyForTerm(fallbackConcept?.term || skillName)}\n\nNext step: Ask me something like "Explain ${fallbackConcept?.term || skillName} simply" or "Give me an interview question on ${skillName}."`;
  }

  return `I can help you understand ${skillName}, explain ideas in simpler words, give you an analogy, or guide you on what to study next.\n\nTry asking: "Explain this skill simply" or "Give me an analogy for this topic."`;
}

export default function TutorChatPanel({ roleDetails, stateDetails }) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Tutor online. Ask me about the current skill, an interview question, a simple explanation, or an analogy, and I will guide you from the actual subject content.',
    },
  ]);
  const [input, setInput] = useState('');
  const [assessmentLock, setAssessmentLockState] = useState(() => getAssessmentLock());
  const listRef = useRef(null);
  const recognitionRef = useRef(null);
  const voiceSupported = useMemo(
    () => typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window),
    []
  );

  useEffect(() => {
    function syncLock() {
      setAssessmentLockState(getAssessmentLock());
    }
    window.addEventListener('storage', syncLock);
    return () => window.removeEventListener('storage', syncLock);
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => () => {
    recognitionRef.current?.stop?.();
  }, []);

  useEffect(() => {
    setMessages([
      {
        id: `welcome-${stateDetails?.state_id || 'base'}`,
        role: 'assistant',
        text: stateDetails
          ? `Tutor online for ${stateDetails.title}. Ask for a simple explanation, a real-world analogy, what to study next, or an interview-style question.`
          : 'Tutor online. Open a skill and I will help explain the active subject.',
      },
    ]);
  }, [stateDetails?.state_id]);

  function sendMessage(customText) {
    const trimmed = (customText ?? input).trim();
    if (!trimmed || assessmentLock.active) return;

    const userMessage = { id: `u-${Date.now()}`, role: 'user', text: trimmed };
    const assistantMessage = {
      id: `a-${Date.now()}`,
      role: 'assistant',
      text: buildTutorReply(trimmed, roleDetails, stateDetails),
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput('');
  }

  function startVoiceInput() {
    if (!voiceSupported || assessmentLock.active) return;
    const SpeechCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechCtor();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    recognitionRef.current = recognition;
    recognition.start();
  }

  return (
    <section className="game-window">
      <div className="window-bar">
        <span className="dot green" />
        <span className="dot yellow" />
        <span className="dot blue" />
        <strong>Quest Tutor</strong>
      </div>
      <div className="window-body tutor-chat-body">
        {assessmentLock.active && (
          <div className="assessment-chat-lock">
            Chat is locked while an assessment window is open.
          </div>
        )}

        <div className="tutor-quick-prompts">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              className="tutor-prompt-chip"
              onClick={() => sendMessage(prompt)}
              disabled={assessmentLock.active}
            >
              {prompt}
            </button>
          ))}
        </div>

        <div className="tutor-chat-list" ref={listRef}>
          {messages.map((message) => (
            <article
              key={message.id}
              className={message.role === 'assistant' ? 'tutor-bubble assistant' : 'tutor-bubble user'}
            >
              {message.text}
            </article>
          ))}
        </div>

        <div className="tutor-chat-input-row">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask a doubt, request a simple explanation, or ask for an analogy..."
            className="tutor-chat-input"
            disabled={assessmentLock.active}
            rows={3}
          />
          <div className="tutor-chat-actions">
            <button
              className="assessment-ghost-btn"
              onClick={startVoiceInput}
              disabled={assessmentLock.active || !voiceSupported}
            >
              Talk
            </button>
            <button
              className="assessment-submit-btn"
              onClick={() => sendMessage()}
              disabled={assessmentLock.active || !input.trim()}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
