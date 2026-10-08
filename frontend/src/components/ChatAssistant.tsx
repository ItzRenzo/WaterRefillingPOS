import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import "./ChatAssistant.css";

type Message = { role: "user" | "assistant"; content: string };
const SUGGESTIONS = ["Which products need restocking?", "Summarize today's sales", "How do I use the POS?"];

function ChatIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l-2 2V11.5A8.5 8.5 0 0 1 10.5 3h2a8.5 8.5 0 0 1 8.5 8.5Z" />
    <path d="M7 10h10M7 14h6" />
  </svg>;
}

export default function ChatAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const request = useRef<AbortController | null>(null);
  const launcher = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => () => request.current?.abort(), []);
  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        launcher.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [messages, busy, error, open]);

  function clearChat() {
    request.current?.abort();
    request.current = null;
    setMessages([]);
    setDraft("");
    setError("");
    setBusy(false);
    input.current?.focus();
  }

  async function send(text = draft, retry = false) {
    const content = text.trim();
    if (!content || content.length > 2000 || request.current) return;
    const previous = error ? messages.slice(0, -1) : messages;
    const next: Message[] = [...previous, { role: "user", content }];
    const controller = new AbortController();
    request.current = controller;
    setMessages(next);
    if (!retry) setDraft("");
    setBusy(true);
    setError("");
    const timer = window.setTimeout(() => controller.abort(), 40_000);
    try {
      const result = await api<{ reply: string }>("/chat", {
        method: "POST",
        signal: controller.signal,
        body: JSON.stringify({ message: content, history: previous.slice(-12) }),
      });
      if (request.current !== controller) return;
      setMessages([...next, { role: "assistant", content: result.reply }]);
    } catch (failure) {
      if (request.current !== controller) return;
      setError(controller.signal.aborted
        ? "The assistant took too long to respond. Please try again."
        : failure instanceof TypeError ? "Could not connect. Check your connection and try again."
        : failure instanceof Error ? failure.message : "Unable to send your message. Please try again.");
    } finally {
      window.clearTimeout(timer);
      if (request.current === controller) {
        request.current = null;
        setBusy(false);
      }
    }
  }

  return <div className="chat-assistant">
    <button ref={launcher} className="chat-launcher" onClick={() => setOpen(!open)}
      aria-expanded={open} aria-controls="rjane-chat" aria-label={open ? "Close AI assistant" : "Open AI assistant"}>
      <ChatIcon /><span>Ask AI</span>
    </button>
    {open && <section id="rjane-chat" className="chat-panel" role="dialog" aria-labelledby="chat-title">
      <header className="chat-header">
        <div className="chat-avatar"><ChatIcon /></div>
        <div className="chat-heading"><h2 id="chat-title">RJane Assistant</h2><p>Inventory, sales & POS help</p></div>
        <button className="chat-icon-button" type="button" onClick={() => { setOpen(false); launcher.current?.focus(); }} aria-label="Close chat">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
        </button>
      </header>
      <div className="chat-toolbar"><span>Powered by Gemini</span><button onClick={clearChat} disabled={!messages.length && !draft}>New chat</button></div>
      <div className="chat-messages" role="log" aria-live="polite" aria-relevant="additions" aria-label="Conversation">
        <div className="chat-welcome">
          <div className="chat-welcome-icon"><ChatIcon /></div>
          <h3>How can I help today?</h3>
          <p>Ask about current stock, today's sales, or how to use your POS.</p>
          {!messages.length && <div className="chat-suggestions">{SUGGESTIONS.map(question =>
            <button key={question} onClick={() => void send(question)} disabled={busy}>{question}<span aria-hidden="true">↗</span></button>
          )}</div>}
        </div>
        {messages.map((message, index) => <div key={index} className={`chat-message chat-message-${message.role}`}>
          <span className="chat-message-label">{message.role === "user" ? "You" : "RJane Assistant"}</span>
          <div className="chat-bubble">{message.content}</div>
        </div>)}
        {busy && <div className="chat-thinking" role="status"><span />Thinking…</div>}
        {error && <div className="chat-error" role="alert"><p>{error}</p><button onClick={() => void send(messages[messages.length - 1].content, true)}>Try again</button></div>}
        <div ref={bottom} />
      </div>
      <form className="chat-composer" onSubmit={event => { event.preventDefault(); void send(); }}>
        <div className="chat-input-row">
          <textarea ref={input} aria-label="Message the assistant" placeholder="Ask a question…" rows={2} maxLength={2000}
            value={draft} onChange={event => setDraft(event.target.value)}
            onKeyDown={event => {
              if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault(); void send();
              }
            }} />
          <button className="chat-send" type="submit" disabled={busy || !draft.trim()} aria-label="Send message">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m5 12 7-7 7 7M12 5v15" /></svg>
          </button>
        </div>
        <p className="chat-privacy">Messages and a current inventory/sales summary are sent to Google Gemini. AI can make mistakes; verify figures in the POS.</p>
      </form>
    </section>}
  </div>;
}
