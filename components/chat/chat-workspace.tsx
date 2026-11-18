"use client";
import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Sparkles,
  Send,
  Mic,
  Plus,
  Trash2,
  Pencil,
  Copy,
  Volume2,
  ThumbsUp,
  ThumbsDown,
  Square,
  RefreshCw,
  ArrowUpRight,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { useApp, api } from "@/components/providers";
import { useRecords } from "@/components/records";
import { EvidenceCard } from "@/components/ui";
import type { ChatAnswer } from "@/types";
type Message = {
  role: "user" | "assistant";
  content: string;
  response?: ChatAnswer;
};
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { results: { transcript: string }[][] }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
export function ChatWorkspace() {
  const { location, language } = useApp();
  const params = useSearchParams();
  const [input, setInput] = useState(params.get("q") || "");
  const [messages, setMessages] = useState<Message[]>([]);
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [id, setId] = useState<string>();
  const controller = useRef<AbortController | null>(null);
  const recognition = useRef<Recognition | null>(null);
  const end = useRef<HTMLDivElement>(null);
  const history = useRecords("conversations");
  const feedback = useRecords("feedback");
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);
  useEffect(
    () => () => {
      controller.current?.abort();
      recognition.current?.stop();
    },
    [],
  );
  async function send(query = input) {
    if (query.trim().length < 2 || busy) return;
    const next: Message[] = [...messages, { role: "user", content: query }];
    setMessages(next);
    setInput("");
    setBusy(true);
    controller.current = new AbortController();
    try {
      const response = await api<ChatAnswer>(
        "/api/chat",
        { query, location },
        undefined,
        controller.current.signal,
      );
      const all: Message[] = [
        ...next,
        { role: "assistant", content: response.answer, response },
      ];
      const saved = await history.save.mutateAsync({
        id,
        payload: {
          title: query.slice(0, 60),
          messages: all,
          location: location.name,
        },
      });
      setId(saved.id);
      setMessages(all);
    } catch (e) {
      if ((e as Error).name === "AbortError") toast.info("Generation stopped.");
      else toast.error((e as Error).message);
      setInput(query);
    } finally {
      setBusy(false);
    }
  }
  function voice() {
    const w = window as unknown as {
      SpeechRecognition?: new () => Recognition;
      webkitSpeechRecognition?: new () => Recognition;
    };
    const C = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!C) {
      toast.info(
        "Voice input is unavailable in this browser. You can type your question.",
      );
      return;
    }
    if (listening) {
      recognition.current?.stop();
      return;
    }
    const r = new C();
    recognition.current = r;
    r.lang = language === "hi" ? "hi-IN" : "en-IN";
    r.continuous = false;
    r.interimResults = false;
    r.onresult = (e) => setInput(e.results[0][0].transcript);
    r.onerror = () =>
      toast.error(
        "Microphone unavailable. Check permission or type your question.",
      );
    r.onend = () => setListening(false);
    setListening(true);
    r.start();
  }
  function speak(text: string) {
    if (!("speechSynthesis" in window)) {
      toast.info("Text-to-speech is unavailable in this browser.");
      return;
    }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = language === "hi" ? "hi-IN" : "en-IN";
    speechSynthesis.speak(u);
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">A CONVERSATION WITH THE FORECAST</p>
          <h1>Ask WeatherGPT</h1>
          <p>Your weather questions, answered with evidence.</p>
        </div>
      </div>
      <div className="chat-layout">
        <aside className="card chat-history">
          <button
            className="btn secondary wide"
            onClick={() => {
              setMessages([]);
              setId(undefined);
              setInput("");
            }}
          >
            <Plus size={16} /> New conversation
          </button>
          <p className="eyebrow">RECENT CONVERSATIONS</p>
          {history.data?.map((r) => (
            <div
              className={`conversation-row ${id === r.id ? "active" : ""}`}
              key={r.id}
            >
              <button
                onClick={() => {
                  setId(r.id);
                  setMessages((r.payload.messages || []) as Message[]);
                }}
              >
                {String(r.payload.title)}
              </button>
              <button
                className="icon-button"
                aria-label="Rename conversation"
                onClick={() => {
                  const title = prompt(
                    "Conversation title",
                    String(r.payload.title),
                  );
                  if (title?.trim())
                    history.save.mutate({
                      id: r.id,
                      payload: { ...r.payload, title: title.slice(0, 80) },
                    });
                }}
              >
                <Pencil size={12} />
              </button>
              <button
                className="icon-button"
                aria-label="Delete conversation"
                onClick={() => {
                  if (confirm("Delete this conversation and its messages?")) {
                    history.remove.mutate(r.id);
                    if (id === r.id) {
                      setId(undefined);
                      setMessages([]);
                    }
                  }
                }}
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </aside>
        <section className="chat-main">
          {!messages.length ? (
            <div className="chat-welcome">
              <span className="ai-icon">
                <Sparkles size={30} />
              </span>
              <h2>
                What does the weather
                <br />
                mean for your day?
              </h2>
              <p>
                Ask about the rain, plan a journey, or find a better time to
                work in the field.
              </p>
              <div className="chat-suggestions">
                {[
                  "Will it rain this evening?",
                  "Can I spray pesticide on my tomato farm tomorrow morning?",
                  "Explain today’s warning simply.",
                  "Best time for outdoor work?",
                ].map((q) => (
                  <button key={q} onClick={() => void send(q)}>
                    {q}
                    <ArrowUpRight size={15} />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="chat-messages" aria-live="polite">
              {messages.map((m, i) => (
                <article key={i} className={`message ${m.role}`}>
                  {m.role === "assistant" && (
                    <div className="message-label">
                      <Sparkles size={15} /> WEATHERGPT BHARAT
                    </div>
                  )}
                  <p>{m.content}</p>
                  {m.response && (
                    <>
                      <p className="answer-detail">
                        <strong>Risk to consider</strong>
                        <br />
                        {m.response.risk}
                      </p>
                      <p className="answer-detail">
                        <strong>Your next step</strong>
                        <br />
                        {m.response.action}
                      </p>
                      <p className="answer-detail">{m.response.limitation}</p>
                      <EvidenceCard evidence={m.response.evidence} />
                      <div className="message-tools">
                        <button
                          className="icon-button"
                          aria-label="Copy answer"
                          onClick={() =>
                            navigator.clipboard
                              .writeText(m.content)
                              .then(() => toast.success("Answer copied."))
                              .catch(() =>
                                toast.error(
                                  "Copy is unavailable in this browser.",
                                ),
                              )
                          }
                        >
                          <Copy size={15} />
                        </button>
                        <button
                          className="icon-button"
                          aria-label="Read answer aloud"
                          onClick={() => speak(m.content)}
                        >
                          <Volume2 size={15} />
                        </button>
                        {[true, false].map((up) => (
                          <button
                            key={String(up)}
                            className="icon-button"
                            aria-label={
                              up ? "Helpful answer" : "Unhelpful answer"
                            }
                            onClick={() =>
                              feedback.save.mutate(
                                {
                                  payload: {
                                    conversation_id: id,
                                    message_index: i,
                                    rating: up ? "helpful" : "unhelpful",
                                  },
                                },
                                {
                                  onSuccess: () =>
                                    toast.success(
                                      "Thank you for the feedback.",
                                    ),
                                },
                              )
                            }
                          >
                            {up ? (
                              <ThumbsUp size={15} />
                            ) : (
                              <ThumbsDown size={15} />
                            )}
                          </button>
                        ))}
                        <small>{m.response.mode}</small>
                      </div>
                    </>
                  )}
                </article>
              ))}
              {busy && (
                <div className="message-label">
                  <RefreshCw className="spin" size={16} /> Checking the forecast
                  and safety rules…
                </div>
              )}
              <div ref={end} />
            </div>
          )}
          <form
            className="chat-composer"
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
          >
            <textarea
              aria-label="Ask a weather question"
              placeholder="Ask anything about your weather…"
              maxLength={2000}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
            />
            <div className="composer-bottom">
              <span>
                <MapPin size={11} style={{ display: "inline" }} />{" "}
                {location.name} · Evidence-grounded answers
              </span>
              <button
                type="button"
                className={`icon-button ${listening ? "notice red" : ""}`}
                aria-label={listening ? "Stop microphone" : "Use voice input"}
                onClick={voice}
              >
                <Mic size={20} />
              </button>
              {busy ? (
                <button
                  className="btn"
                  type="button"
                  onClick={() => controller.current?.abort()}
                >
                  <Square size={15} /> Stop
                </button>
              ) : (
                <button
                  className="btn"
                  disabled={input.trim().length < 2}
                  aria-label="Send question"
                >
                  <Send size={17} />
                </button>
              )}
            </div>
          </form>
          <p className="composer-note">
            WeatherGPT may be uncertain. Check sources and follow official
            emergency instructions.
          </p>
        </section>
      </div>
    </>
  );
}
