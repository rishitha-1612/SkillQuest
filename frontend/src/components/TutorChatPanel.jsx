import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api/client';
import { getAssessmentLock } from '../data/assessmentLock';

const QUICK_PROMPTS = [
  'Explain this skill simply',
  'Give me an analogy for this topic',
  'What should I study next?',
  'Ask me an interview-style question',
];

export default function TutorChatPanel({ roleDetails, stateDetails }) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Tutor online. Ask about the current skill, a simpler explanation, an analogy, assessment prep, or what city to study next.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
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
          ? `Tutor online for ${stateDetails.title}. I can explain concepts simply, compare ideas, turn them into analogies, and guide your next city on the roadmap.`
          : 'Tutor online. Open a skill and I will guide the active subject.',
      },
    ]);
  }, [stateDetails?.state_id]);

  async function sendMessage(customText) {
    const trimmed = (customText ?? input).trim();
    if (!trimmed || assessmentLock.active || isSending) return;

    const userMessage = { id: `u-${Date.now()}`, role: 'user', text: trimmed };
    const nextHistory = [...messages, userMessage];
    setMessages(nextHistory);
    setInput('');
    setIsSending(true);

    try {
      const result = await api.tutorChat({
        role_id: roleDetails?.role_id || null,
        state_id: stateDetails?.state_id || null,
        message: trimmed,
        history: messages
          .slice(-6)
          .filter((item) => item.role === 'user' || item.role === 'assistant')
          .map((item) => ({ role: item.role, text: item.text })),
      });

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: result.reply,
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: `The tutor service could not answer right now. ${error.message}`,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  function startVoiceInput() {
    if (!voiceSupported || assessmentLock.active || isSending) return;
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
              disabled={assessmentLock.active || isSending}
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
            placeholder="Ask a doubt, request a simpler explanation, or ask for an analogy..."
            className="tutor-chat-input"
            disabled={assessmentLock.active || isSending}
            rows={3}
          />
          <div className="tutor-chat-actions">
            <button
              className="assessment-ghost-btn"
              onClick={startVoiceInput}
              disabled={assessmentLock.active || !voiceSupported || isSending}
            >
              Talk
            </button>
            <button
              className="assessment-submit-btn"
              onClick={() => sendMessage()}
              disabled={assessmentLock.active || !input.trim() || isSending}
            >
              {isSending ? 'Thinking...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
