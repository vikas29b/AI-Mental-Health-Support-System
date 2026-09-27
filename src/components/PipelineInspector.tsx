import React, { useState } from 'react';
import { 
  Activity, 
  ShieldCheck, 
  AlertTriangle, 
  ArrowRight, 
  Lock, 
  Database, 
  CheckCircle2, 
  RefreshCw,
  Cpu,
  Layers,
  Clock,
  Play
} from 'lucide-react';
import { ChatResponsePayload, RiskLevel } from '../../server/types.js';

interface PipelineInspectorProps {
  lastTrace?: {
    response: ChatResponsePayload;
    rawText: string;
  } | null;
}

export const PipelineInspector: React.FC<PipelineInspectorProps> = ({ lastTrace }) => {
  // Test sandbox input
  const [testInput, setTestInput] = useState(
    lastTrace?.rawText || "I'm feeling overwhelmed and don't think I can keep going like this anymore."
  );
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<any>(
    lastTrace ? {
      raw_input: lastTrace.rawText,
      pii_scrubbed: {
        sanitized_text: lastTrace.rawText,
        redacted_items_count: 0,
        latency_ms: lastTrace.response.risk_status.latency_breakdown_ms.pii_scrub_ms || 0.4,
      },
      risk_evaluation: lastTrace.response.risk_status,
      crisis_triggered: lastTrace.response.risk_status.is_crisis,
    } : null
  );

  const runEvaluation = async (text: string) => {
    setIsEvaluating(true);
    try {
      const res = await fetch('/api/crisis/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      setEvaluationResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsEvaluating(false);
    }
  };

  const evalRisk: RiskLevel = evaluationResult?.risk_evaluation?.risk_level ?? 0;
  const isCrisis = evaluationResult?.risk_evaluation?.is_crisis ?? false;
  const latency = evaluationResult?.risk_evaluation?.latency_breakdown_ms || {
    pii_scrub_ms: 0.35,
    tier1_regex_ms: 0.85,
    tier2_semantic_ms: 3.2,
    total_pipeline_ms: 4.4,
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-6 h-6 text-teal-400" />
            <h1 className="text-xl font-bold text-white">
              Dual-Pass Safety & Guardrails Pipeline Monitor
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time trace visualizer for incoming payloads: PII Scrubbing, Tier 1 Sub-10ms Rule Engine, Tier 2 Semantic Classifier, and Branching Logic.
          </p>
        </div>

        {/* Live Status Tag */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300">FastAPI Middleware Active</span>
          </div>
        </div>
      </div>

      {/* Interactive Payload Testing Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
          Payload Simulation Input (Type or select a message to test against guardrails):
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            placeholder="e.g. Call me at 555-234-5678, I can't take this anymore and want to end it..."
            className="flex-1 bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
          />
          <button
            onClick={() => runEvaluation(testInput)}
            disabled={isEvaluating || !testInput.trim()}
            className="flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition shadow-md shadow-teal-600/20 active:scale-95 shrink-0"
          >
            {isEvaluating ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            <span>Trace Pipeline</span>
          </button>
        </div>

        {/* Quick presets */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium">Quick Presets:</span>
          <button
            onClick={() => {
              const text = "I'm having a hard time balancing work, my email is test@company.com and phone is (555) 019-2834.";
              setTestInput(text);
              runEvaluation(text);
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          >
            PII Test (Email & Phone)
          </button>
          <button
            onClick={() => {
              const text = "I've decided to end my life tonight. Goodbye everyone.";
              setTestInput(text);
              runEvaluation(text);
            }}
            className="px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800 transition"
          >
            Tier 1 Explicit Crisis
          </button>
          <button
            onClick={() => {
              const text = "I feel like a total burden to everyone and they would all be happier if I disappeared.";
              setTestInput(text);
              runEvaluation(text);
            }}
            className="px-2.5 py-1 rounded-lg bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border border-amber-800 transition"
          >
            Tier 2 Implicit Hopelessness
          </button>
          <button
            onClick={() => {
              const text = "I am looking for tips on mindful walking and deep breathing exercises.";
              setTestInput(text);
              runEvaluation(text);
            }}
            className="px-2.5 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800 transition"
          >
            Tier 0 Safe Wellness
          </button>
        </div>
      </div>

      {/* High-Level Architecture Flowchart Visualizer */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-2">
          <Layers className="w-4 h-4 text-teal-400" />
          Active Execution Lifecycle Flowchart
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          {/* STEP 1: Ingestion & PII */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 flex flex-col justify-between relative">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-teal-400 uppercase tracking-widest">Step 1</span>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded">
                  {latency.pii_scrub_ms || 0.4}ms
                </span>
              </div>
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-emerald-400" />
                PII Scrubbing
              </h4>
              <p className="text-xs text-slate-300 mt-1">
                Pydantic v2 validation + RegEx scrubbing of emails, phones, names, SSNs.
              </p>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-700/60 text-[11px]">
              <span className="text-slate-400">Sanitized Text:</span>
              <p className="font-mono text-emerald-300 truncate mt-0.5">
                {evaluationResult?.pii_scrubbed?.sanitized_text || 'Ready for payload'}
              </p>
            </div>
          </div>

          {/* STEP 2: Dual-Pass Safety Pipeline */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 flex flex-col justify-between relative">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-teal-400 uppercase tracking-widest">Step 2</span>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded">
                  Sub-10ms
                </span>
              </div>
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                Dual-Pass Guardrails
              </h4>
              <div className="mt-2 space-y-1.5 text-xs">
                <div className="flex items-center justify-between bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
                  <span className="text-slate-300">Tier 1 Regex:</span>
                  <span className="font-mono text-teal-300">{latency.tier1_regex_ms || 0.8}ms</span>
                </div>
                <div className="flex items-center justify-between bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
                  <span className="text-slate-300">Tier 2 Semantic:</span>
                  <span className="font-mono text-teal-300">{latency.tier2_semantic_ms || 3.1}ms</span>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs">
              <span className="text-slate-400">Risk Level:</span>
              <span className={`font-bold px-2 py-0.5 rounded ${
                evalRisk === 3 ? 'bg-rose-500/20 text-rose-300' :
                evalRisk === 2 ? 'bg-amber-500/20 text-amber-300' :
                evalRisk === 1 ? 'bg-blue-500/20 text-blue-300' :
                'bg-emerald-500/20 text-emerald-300'
              }`}>
                Tier {evalRisk} ({evaluationResult?.risk_evaluation?.primary_emotion || 'Safe'})
              </span>
            </div>
          </div>

          {/* STEP 3: Branching Decision */}
          <div className={`rounded-xl p-4 flex flex-col justify-between border transition-all ${
            isCrisis
              ? 'bg-rose-950/40 border-rose-500/60 shadow-lg shadow-rose-950/40'
              : 'bg-slate-800/80 border-slate-700'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-teal-400 uppercase tracking-widest">Step 3</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  isCrisis ? 'bg-rose-600 text-white' : 'bg-teal-600 text-white'
                }`}>
                  {isCrisis ? 'BRANCH A' : 'BRANCH B'}
                </span>
              </div>
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                {isCrisis ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>Crisis Short-Circuit</span>
                  </>
                ) : (
                  <>
                    <Cpu className="w-4 h-4 text-indigo-400" />
                    <span>CBT Prompt Engine</span>
                  </>
                )}
              </h4>
              <p className="text-xs text-slate-300 mt-1">
                {isCrisis
                  ? 'Bypasses generative LLM completely to eliminate hallucinations. Returns 988 Lifeline payload.'
                  : 'Retrieves Redis memory buffer. Injects CBT reframing persona & ethical boundary rules.'}
              </p>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-700/60 text-xs">
              <span className="text-slate-400">Action: </span>
              <span className="font-semibold text-white">
                {isCrisis ? 'Emergency Hotline Dispatch' : 'Gemini 3.8 Flash Generation'}
              </span>
            </div>
          </div>

          {/* STEP 4: Async Warehouse Ingestion */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-teal-400 uppercase tracking-widest">Step 4</span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800">
                  Async Non-Blocking
                </span>
              </div>
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Database className="w-4 h-4 text-emerald-400" />
                PostgreSQL Pipeline
              </h4>
              <p className="text-xs text-slate-300 mt-1">
                Background Celery worker writes anonymized telemetry to fact_sessions & fact_risk_events.
              </p>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-700/60 text-xs text-slate-400 flex items-center justify-between">
              <span>Power BI Warehouse:</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Enqueued
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Latency & Decision Detailed Breakdown */}
      {evaluationResult && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sub-Second Latency Profiler */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-teal-400" />
              Sub-Second Execution Latency Breakdown
            </h3>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">PII Scrubbing:</span>
                  <span className="font-mono text-teal-400">{latency.pii_scrub_ms || 0.4} ms</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full" style={{ width: '8%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Tier 1 Regex Matcher:</span>
                  <span className="font-mono text-teal-400">{latency.tier1_regex_ms || 0.8} ms</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-teal-500 h-full" style={{ width: '12%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Tier 2 Semantic Classifier:</span>
                  <span className="font-mono text-teal-400">{latency.tier2_semantic_ms || 3.1} ms</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full" style={{ width: '25%' }} />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                <span className="text-xs font-bold text-white">Total Guardrail Latency:</span>
                <span className="font-mono text-sm font-bold text-teal-300">
                  {latency.total_pipeline_ms || 4.3} ms
                </span>
              </div>
            </div>
          </div>

          {/* Semantic Analysis & Triggers */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              Classifier Diagnostics & Telemetry
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
                <span className="text-slate-400">Identified Primary Emotion:</span>
                <span className="font-bold text-white uppercase tracking-wider">
                  {evaluationResult.risk_evaluation?.primary_emotion}
                </span>
              </div>

              <div className="flex justify-between p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
                <span className="text-slate-400">Sentiment Score (-1.0 to +1.0):</span>
                <span className={`font-mono font-bold ${
                  (evaluationResult.risk_evaluation?.sentiment_score ?? 0) < 0 ? 'text-rose-400' : 'text-emerald-400'
                }`}>
                  {evaluationResult.risk_evaluation?.sentiment_score}
                </span>
              </div>

              <div className="flex justify-between p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
                <span className="text-slate-400">Model Confidence:</span>
                <span className="font-mono font-bold text-teal-300">
                  {((evaluationResult.risk_evaluation?.confidence_score ?? 0.9) * 100).toFixed(1)}%
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
                <span className="text-slate-400 block mb-1">Detected Keywords / Signals:</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {(evaluationResult.risk_evaluation?.detected_triggers || ['none']).map((trig: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-slate-900 text-teal-300 font-mono text-[11px] border border-slate-800">
                      {trig}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
