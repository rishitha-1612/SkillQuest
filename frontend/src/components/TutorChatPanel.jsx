import { useEffect, useMemo, useRef, useState } from 'react';
import { getAssessmentLock } from '../data/assessmentLock';

function buildTutorReply(input, roleDetails, stateDetails) {
  const text = input.toLowerCase();
  const roleName = roleDetails?.title || 'this job';
  const skillName = stateDetails?.title || 'this skill';
  const currentNode = stateDetails?.nodes?.[0];

  if (text.includes('project') || text.includes('skillquest')) {
    return `SkillQuest turns careers into country worlds. Right now you're in ${roleName}, and each state inside the country is a required skill path with levels and an assessment gate.`;
  }

  if (text.includes('assessment') || text.includes('exam') || text.includes('test')) {
    return `Assessments happen at the end of each skill route. You need 75% or above in the 25-question assessment to unlock the next skill.`;
  }

  if (text.includes('next') || text.includes('road') || text.includes('progress')) {
    return `Follow the rider road in order. Clear the current skill levels first, then use Take Assessment to unlock the next province.`;
  }

  if (text.includes('skill') || text.includes(skillName.toLowerCase())) {
    return `${skillName} is the active province. Focus on ${currentNode?.title || 'the opening level'} first, then move through the level route before attempting the assessment.`;
  }

  if (text.includes('help') || text.includes('how')) {
    return `I can help with the current job path, explain the active skill, suggest what to study next, or summarize the project structure. Try asking about ${roleName} or ${skillName}.`;
  }

  return `For ${roleName}, I’d focus on the active province first: ${skillName}. Work through the levels in order, then take the assessment once the route feels comfortable.`;
}

export default function TutorChatPanel({ roleDetails, stateDetails }) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Tutor online. Ask about the project, the current job path, or the active skill.',
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

  function sendMessage() {
    const trimmed = input.trim();
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
            placeholder="Ask about the project, this job path, or the active skill..."
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
            <button className="assessment-submit-btn" onClick={sendMessage} disabled={assessmentLock.active || !input.trim()}>
              Send
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
