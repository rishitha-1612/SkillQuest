import { useEffect, useMemo, useRef, useState } from 'react';
import { getAssessmentLock } from '../data/assessmentLock';

const QUICK_PROMPTS = [
  'Explain this skill simply',
  'Give me an analogy',
  'What should I study next?',
  'How does this help in the project?',
];

function makeFriendlyReply({ overview, analogy, nextStep, tip }) {
  return `${overview}\n\nAnalogy: ${analogy}\n\nNext step: ${nextStep}\n\nTip: ${tip}`;
}

function buildTutorReply(input, roleDetails, stateDetails) {
  const text = input.toLowerCase();
  const roleName = roleDetails?.title || 'this job';
  const skillName = stateDetails?.title || 'this skill';
  const currentNode = stateDetails?.nodes?.[0];
  const nextNode = stateDetails?.nodes?.[1];

  if (text.includes('project') || text.includes('skillquest')) {
    return makeFriendlyReply({
      overview: `SkillQuest turns learning into a world game. ${roleName} is the country, ${skillName} is the active state, and each level is a small mission that builds you toward the full job.`,
      analogy: 'Think of the project like a game map: the country is your destination, each state is a major skill zone, and each city is a practice checkpoint.',
      nextStep: `Stay inside ${skillName} for now and clear ${currentNode?.title || 'the first level'} before worrying about the later provinces.`,
      tip: 'When something feels large, break it into one state, one level, one question at a time.',
    });
  }

  if (text.includes('assessment') || text.includes('exam') || text.includes('test')) {
    return makeFriendlyReply({
      overview: `The assessment is the checkpoint at the end of the skill route. You answer 25 multiple-choice questions and need 75% or higher to unlock the next skill.`,
      analogy: 'It works like a bridge guard in a game. You do not fight it first; you train in the area, then prove you are ready to cross.',
      nextStep: `Finish the ${skillName} levels first, then open Take Assessment when the route feels familiar.`,
      tip: 'Use the level titles as memory anchors. If you can explain each one in your own words, you are usually close to assessment-ready.',
    });
  }

  if (text.includes('analogy')) {
    return makeFriendlyReply({
      overview: `${skillName} is one major part of becoming a ${roleName}. It teaches a chunk of the thinking the full job depends on.`,
      analogy: `${skillName} is like one engine inside a larger machine. The full job works only when this engine, along with the others, is tuned and running properly.`,
      nextStep: `Start with ${currentNode?.title || 'the opening level'} and try to understand why it comes before ${nextNode?.title || 'the next level'}.`,
      tip: 'If a topic feels abstract, ask yourself: “What real problem would this help me solve?”',
    });
  }

  if (text.includes('next') || text.includes('road') || text.includes('progress')) {
    return makeFriendlyReply({
      overview: `Your rider road shows where you are in the learning journey. Complete the current skill route, pass its assessment, and the next province unlocks.`,
      analogy: 'It is like a road trip. You do not teleport to the last city; you drive through the stops in order, and each stop prepares you for the next one.',
      nextStep: `Your best next move is ${currentNode?.title || 'the opening level'} in ${skillName}.`,
      tip: 'Do not try to master the whole country in one go. Clear the road one stop at a time.',
    });
  }

  if (text.includes('doubt') || text.includes('confused') || text.includes('understand') || text.includes('explain')) {
    return makeFriendlyReply({
      overview: `${skillName} matters because it supports the bigger goal of becoming a ${roleName}. Right now, you only need to understand the current layer, not the entire field.`,
      analogy: 'Learning a skill is like building a staircase. You do not jump to the top; you make one strong step, then stand on it to build the next.',
      nextStep: `Focus on ${currentNode?.title || 'the first level'} and ask what single idea it is trying to teach.`,
      tip: 'When you feel stuck, say the topic in simpler words. If you can explain it simply, your understanding is getting stronger.',
    });
  }

  if (text.includes('help') || text.includes('how')) {
    return makeFriendlyReply({
      overview: `I can help you understand the project, the current job path, the active skill, what to learn next, and how the assessment works.`,
      analogy: 'Think of me like a side guide in a game. I am here to explain the map, not just repeat the labels on it.',
      nextStep: `Ask me something specific like “Explain ${skillName} simply” or “Why does ${roleName} need ${skillName}?”`,
      tip: 'Specific questions usually get the clearest answers.',
    });
  }

  if (text.includes('skill') || text.includes(skillName.toLowerCase())) {
    return makeFriendlyReply({
      overview: `${skillName} is the active province in your ${roleName} journey. It is training one important part of the overall job.`,
      analogy: `${skillName} is like one chapter in a long adventure book. You need this chapter to understand the chapters that come after it.`,
      nextStep: `Start with ${currentNode?.title || 'the opening level'} and then move to ${nextNode?.title || 'the next one'} after that.`,
      tip: 'Try to connect each level title to one real outcome or task. That makes the path easier to remember.',
    });
  }

  return makeFriendlyReply({
    overview: `For ${roleName}, I would keep your attention on ${skillName} first. That is the current state that is moving your journey forward.`,
    analogy: `${skillName} is like one training ground in a larger kingdom. Mastering this ground makes the next area feel much less intimidating.`,
    nextStep: `Work through ${currentNode?.title || 'the opening level'} before taking the assessment.`,
    tip: 'Slow, clear progress beats rushing. Understanding a smaller piece well is better than skimming the whole path.',
  });
}

export default function TutorChatPanel({ roleDetails, stateDetails }) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Tutor online. I can explain the project, simplify the active skill, suggest what to study next, and give analogies to make topics easier.',
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
