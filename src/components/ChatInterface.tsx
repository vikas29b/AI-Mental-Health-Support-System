import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  RotateCcw, 
  Wind, 
  ShieldCheck, 
  PhoneCall, 
  MessageSquare, 
  Lock, 
  Bot, 
  User, 
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { ChatResponsePayload, CrisisResource, RiskLevel } from '../../server/types.js';

interface MessageItem {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  riskStatus?: ChatResponsePayload['risk_status'];
  resources?: CrisisResource[] | null;
  cbtTechnique?: string;
  groundingPrompt?: string;
}

interface ChatInterfaceProps {
  onOpenGrounding: () => void;
  onOpenCrisisModal: () => void;
  onMessageProcessed?: (response: ChatResponsePayload, userRawText: string) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  onOpenGrounding,
  onOpenCrisisModal,
  onMessageProcessed,
}) => {
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: 'init_welcome',
      sender: 'assistant',
      text: "Hello, I'm AegisMind. I'm here to offer a safe, confidential, and empathetic space for whatever you are feeling today. How are you holding up in this moment?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `sess_${Date.now()}`);
  const [currentRiskLevel, setCurrentRiskLevel] = useState<RiskLevel>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (customText?: string) => {
    const textToSend = customText || input.trim();
    if (!textToSend || isLoading) return;

    const userMessage: MessageItem = {
      id: `msg_user_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!customText) setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          user_id: 'usr_demo_user',
          message: textToSend,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data: ChatResponsePayload = await res.json();

      setCurrentRiskLevel(data.risk_status.risk_level);

      const assistantMessage: MessageItem = {
        id: data.trace_id,
        sender: 'assistant',
        text: data.response,
        timestamp: new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        riskStatus: data.risk_status,
        resources: data.resources,
        cbtTechnique: data.cbt_technique_applied,
        groundingPrompt: data.grounding_prompt,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (onMessageProcessed) {
        onMessageProcessed(data, textToSend);
      }

      // If crisis triggered, also trigger modal automatically
      if (data.risk_status.is_crisis) {
        onOpenCrisisModal();
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_err_${Date.now()}`,
          sender: 'assistant',
          text: "I am having difficulty connecting to the processing engine right now. If you are experiencing distress, please remember that free, confidential crisis support is available 24/7 by calling or texting 988.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          riskStatus: {
            is_crisis: false,
            risk_level: 0,
            primary_emotion: 'neutral',
            sentiment_score: 0,
            confidence_score: 1,
            latency_breakdown_ms: {
              pii_scrub_ms: 0,
              tier1_regex_ms: 0,
              tier2_semantic_ms: 0,
              total_pipeline_ms: 0,
            },
          },
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSession = async () => {
    try {
      await fetch('/api/sessions/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      });
    } catch (e) {
      console.error(e);
    }

    setMessages([
      {
        id: `init_${Date.now()}`,
        sender: 'assistant',
        text: "Session memory cleared. I am here whenever you'd like to talk. What is on your mind?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setCurrentRiskLevel(0);
  };

  const handleResourceClick = async (res: CrisisResource) => {
    try {
      await fetch('/api/analytics/emergency-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          action: res.contact_type === 'phone' ? 'call_clicked' : 'text_clicked',
        }),
      });
    } catch {
      // non-blocking
    }
  };

  const promptSuggestions = [
    "I'm feeling overwhelmed and don't think I can keep going like this anymore.",
    "Work has been burning me out completely and my thoughts won't stop spiraling.",
    "Can you guide me through a calming exercise right now?",
    "I made a mistake today and feel like a total failure.",
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-5xl mx-auto p-2 sm:p-4">
      {/* Top Session & Guardrail Status Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 mb-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-medium">Session ID:</span>
            <span className="text-slate-400 font-mono text-[11px] truncate max-w-[100px] sm:max-w-none">
              {sessionId}
            </span>
          </div>

          {/* Active Risk Level Pill */}
          <div
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              currentRiskLevel === 3
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                : currentRiskLevel === 2
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                : currentRiskLevel === 1
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>
              {currentRiskLevel === 3 && 'CRISIS DETECTED (Tier 3)'}
              {currentRiskLevel === 2 && 'Moderate Distress (Tier 2)'}
              {currentRiskLevel === 1 && 'Mild Stress (Tier 1)'}
              {currentRiskLevel === 0 && 'Safety Guardrails Active (Tier 0)'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Somatic Grounding Button */}
          <button
            onClick={onOpenGrounding}
            className="flex items-center gap-1.5 bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/30 px-2.5 py-1 rounded-lg text-xs font-medium transition"
          >
            <Wind className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Grounding Tool</span>
          </button>

          {/* Reset Session Memory */}
          <button
            onClick={handleResetSession}
            title="Clear Redis Session Buffer"
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 sm:pr-2">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          const isCrisis = msg.riskStatus?.is_crisis;

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${
                isUser ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                  isUser
                    ? 'bg-slate-700 text-slate-200'
                    : isCrisis
                    ? 'bg-rose-600 text-white'
                    : 'bg-gradient-to-tr from-teal-600 to-indigo-600 text-white'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble Container */}
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 shadow-sm transition-all ${
                  isUser
                    ? 'bg-teal-600 text-white rounded-tr-none'
                    : isCrisis
                    ? 'bg-slate-900 border-2 border-rose-500/80 text-slate-100 rounded-tl-none shadow-rose-950/30'
                    : 'bg-slate-800/90 border border-slate-700/60 text-slate-100 rounded-tl-none'
                }`}
              >
                {/* CBT Technique Header (if assistant & non-crisis) */}
                {!isUser && msg.cbtTechnique && !isCrisis && (
                  <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-teal-400 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                    <span>CBT Framework: {msg.cbtTechnique}</span>
                  </div>
                )}

                {/* Crisis Alert Banner (if assistant & crisis) */}
                {!isUser && isCrisis && (
                  <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold mb-3">
                    <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                    <span>CRISIS SAFETY PROTOCOL SHORT-CIRCUIT ENGAGED</span>
                  </div>
                )}

                {/* Body Text */}
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {msg.text}
                </p>

                {/* Grounding Exercise Prompt */}
                {!isUser && msg.groundingPrompt && !isCrisis && (
                  <div className="mt-3 p-2.5 rounded-xl bg-teal-950/40 border border-teal-800/50 flex items-center justify-between gap-2">
                    <p className="text-xs text-teal-200">
                      {msg.groundingPrompt}
                    </p>
                    <button
                      onClick={onOpenGrounding}
                      className="shrink-0 text-xs px-2.5 py-1 rounded-md bg-teal-600 hover:bg-teal-500 text-white font-medium transition shadow-sm"
                    >
                      Start
                    </button>
                  </div>
                )}

                {/* Attached Crisis Resource Cards (Tier 3 or Tier 2) */}
                {!isUser && msg.resources && msg.resources.length > 0 && (
                  <div className="mt-4 space-y-2 pt-3 border-t border-slate-700/80">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-rose-300 flex items-center gap-1">
                      <PhoneCall className="w-3 h-3 text-rose-400" />
                      <span>Immediate Emergency Support Lines</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {msg.resources.slice(0, 4).map((r) => (
                        <div
                          key={r.id}
                          className="bg-slate-900/90 border border-rose-500/30 rounded-xl p-2.5 flex flex-col justify-between"
                        >
                          <div>
                            <div className="font-bold text-xs text-white">
                              {r.name}
                            </div>
                            <div className="text-[11px] text-slate-400 line-clamp-1">
                              {r.description}
                            </div>
                          </div>

                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-[10px] font-semibold text-rose-400">
                              {r.contact_value}
                            </span>
                            <a
                              href={r.contact_type === 'phone' ? `tel:${r.contact_value.replace(/[^0-9]/g, '')}` : r.contact_type === 'text' ? 'sms:741741' : r.contact_value}
                              onClick={() => handleResourceClick(r)}
                              target={r.contact_type === 'web' ? '_blank' : '_self'}
                              rel="noreferrer"
                              className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold flex items-center gap-1 transition"
                            >
                              {r.contact_type === 'phone' && <PhoneCall className="w-2.5 h-2.5" />}
                              {r.contact_type === 'text' && <MessageSquare className="w-2.5 h-2.5" />}
                              {r.contact_type === 'web' && <ExternalLink className="w-2.5 h-2.5" />}
                              <span>{r.action_label}</span>
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sub-second Latency & Telemetry Footer */}
                {!isUser && msg.riskStatus && (
                  <div className="mt-3 pt-2 border-t border-slate-700/40 flex items-center justify-between text-[10px] text-slate-400">
                    <div className="flex items-center gap-2">
                      <span className="font-mono">
                        Latency: {msg.riskStatus.latency_breakdown_ms.total_pipeline_ms}ms
                      </span>
                      <span>•</span>
                      <span>
                        Tier 1: {msg.riskStatus.latency_breakdown_ms.tier1_regex_ms}ms
                      </span>
                      {msg.riskStatus.latency_breakdown_ms.llm_generation_ms && (
                        <>
                          <span>•</span>
                          <span>
                            LLM: {msg.riskStatus.latency_breakdown_ms.llm_generation_ms}ms
                          </span>
                        </>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {msg.timestamp}
                    </span>
                  </div>
                )}

                {isUser && (
                  <div className="mt-1 text-right text-[10px] text-teal-100/70">
                    {msg.timestamp}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-600 to-indigo-600 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-slate-800 border border-slate-700/60 rounded-2xl rounded-tl-none p-3.5 text-slate-300 text-xs flex items-center gap-2">
              <span className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce [animation-delay:0.4s]" />
              </span>
              <span>Running dual-pass safety guardrails & generating response...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Starter Prompts */}
      {messages.length <= 2 && (
        <div className="my-2">
          <div className="text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
            <span>Explore Common Scenarios:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {promptSuggestions.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt)}
                className="text-left text-xs p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 text-slate-300 hover:text-white transition flex items-center justify-between group"
              >
                <span className="truncate">{prompt}</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-teal-400 shrink-0 ml-1" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <div className="mt-2 bg-slate-900 border border-slate-800 rounded-2xl p-2 focus-within:border-teal-500 transition-colors shadow-lg">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message in a confidential space..."
            disabled={isLoading}
            className="flex-1 bg-transparent px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />

          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="w-10 h-10 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white flex items-center justify-center transition shadow-md shadow-teal-600/20 active:scale-95 shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        <div className="flex items-center justify-between px-3 pt-2 pb-1 border-t border-slate-800/80 text-[11px] text-slate-400">
          <div className="flex items-center gap-1 text-emerald-400">
            <Lock className="w-3 h-3" />
            <span>PII Anonymized</span>
          </div>
          <span className="text-[10px] text-slate-400">
            For emergencies, call or text 988 anytime.
          </span>
        </div>
      </div>
    </div>
  );
};
