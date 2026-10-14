import { useEffect, useRef, useState } from 'react';
import type { Session } from '../shared/types';
import { askAssistant, type AiAnswer } from '../shared/aiApi';
import './AiAssistant.css';

const SUGGESTIONS = [
  'Quels candidats connaissent Spring Boot et React ?',
  "Qui a de l'expérience en analyse de crédit PME ?",
  'Trouve un profil avec des compétences en IA et LangChain',
];

interface Message {
  role: 'user' | 'bot';
  text: string;
  result?: AiAnswer;
  error?: boolean;
}

/**
 * Affiche le texte sans interpréter de HTML fourni par le modèle.
 * Gère le gras Markdown et les références comme [APP-001].
 */
function renderInline(text: string) {
  const pattern = /(\*\*[^*]+\*\*|\[[A-Za-z]+-\d+\])/g;

  return text.split(pattern).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }

    if (/^\[[A-Za-z]+-\d+\]$/.test(part)) {
      return (
        <span key={index} className="ai-ref">
          {part.slice(1, -1)}
        </span>
      );
    }

    return part;
  });
}

/**
 * Transforme les lignes en paragraphes et listes lisibles.
 */
function renderRich(text: string) {
  const blocks: React.ReactNode[] = [];
  let bullets: string[] = [];

  const flushBullets = () => {
    if (bullets.length === 0) return;

    blocks.push(
      <ul key={`ul-${blocks.length}`}>
        {bullets.map((bullet, index) => (
          <li key={index}>{renderInline(bullet)}</li>
        ))}
      </ul>,
    );

    bullets = [];
  };

  text.split(/\r?\n/).forEach((line) => {
    const bulletMatch = line.match(/^\s*[-*•]\s+(.+)$/);

    if (bulletMatch) {
      bullets.push(bulletMatch[1]);
      return;
    }

    flushBullets();

    const trimmedLine = line.trim();

    if (trimmedLine) {
      blocks.push(
        <p key={`p-${blocks.length}`}>
          {renderInline(trimmedLine)}
        </p>,
      );
    }
  });

  flushBullets();

  return blocks;
}

export function AiAssistantPanel({
  session,
}: {
  session: Session;
}) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    const element = textareaRef.current;
    if (!element) return;

    element.style.height = 'auto';
    element.style.height = `${Math.min(element.scrollHeight, 140)}px`;
  }, [input]);

  async function send(value: string) {
    const question = value.trim();

    if (!question || loading) return;

    setInput('');
    setMessages((current) => [
      ...current,
      { role: 'user', text: question },
    ]);
    setLoading(true);

    try {
      const result = await askAssistant(
        session.accessToken,
        question,
      );

      setMessages((current) => [
        ...current,
        { role: 'bot', text: result.answer, result },
      ]);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Une erreur inattendue est survenue.';

      setMessages((current) => [
        ...current,
        { role: 'bot', text: message, error: true },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const initials = `${session.firstName?.[0] ?? ''}${
    session.lastName?.[0] ?? ''
  }`;

  return (
    <div className="ai-chat">
      <div className="ai-chat__header">
        <div className="ai-chat__title">
          <div className="ai-avatar">✦</div>
          <div>
            <h1>BFPME AI Assistant</h1>
            <small>Candidate search by meaning · hybrid RAG</small>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            type="button"
            className="ai-chat__reset"
            onClick={() => setMessages([])}
          >
            New chat
          </button>
        )}
      </div>

      <div className="ai-chat__messages">
        {messages.length === 0 && (
          <div className="ai-welcome">
            <div className="ai-avatar">✦</div>
            <h2>
              Hello {session.firstName}, how can I help?
            </h2>
            <p>
              Ask about candidates in natural language. I answer
              from indexed applications and cite my sources.
            </p>

            <div className="ai-suggestions">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  type="button"
                  key={suggestion}
                  className="ai-suggestion"
                  onClick={() => send(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`ai-msg ai-msg--${message.role}${
              message.error ? ' ai-msg--error' : ''
            }`}
          >
            <div
              className={`ai-avatar${
                message.role === 'user' ? ' ai-avatar--user' : ''
              }`}
            >
              {message.role === 'user' ? initials : '✦'}
            </div>

            <div className="ai-bubble">
              {message.role === 'user' || message.error
                ? message.text
                : renderRich(message.text)}

              {message.result &&
                message.result.sources.length > 0 && (
                  <div className="ai-sources">
                    <span className="ai-sources__title">
                      Sources :
                    </span>

                    <div className="ai-sources__list">
                      {message.result.sources.map((source) => (
                        <span
                          key={source}
                          className="ai-ref"
                        >
                          {source}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              {message.result &&
                message.result.trace.length > 0 && (
                  <details className="ai-steps">
                    <summary>Agent steps</summary>
                    <ol>
                      {message.result.trace.map((step, stepIndex) => (
                        <li key={`${step}-${stepIndex}`}>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </details>
                )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="ai-msg ai-msg--bot">
            <div className="ai-avatar">✦</div>
            <div className="ai-bubble">
              <div className="ai-typing">
                <i />
                <i />
                <i />
              </div>
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      <form
        className="ai-chat__composer"
        onSubmit={(event) => {
          event.preventDefault();
          void send(input);
        }}
      >
        <div className="ai-composer__box">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            maxLength={1000}
            placeholder="Ask about candidates… (Enter to send, Shift+Enter for a new line)"
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                void send(input);
              }
            }}
          />

          <button
            type="submit"
            className="ai-send"
            disabled={loading || !input.trim()}
            aria-label="Send"
          >
            ➤
          </button>
        </div>

        <p className="ai-disclaimer">
          The assistant supports screening only. Hiring decisions
          remain human.
        </p>
      </form>
    </div>
  );
}
