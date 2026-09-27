import React, { useState } from 'react';
import { Terminal, Send, Check, Copy, Code, Layers, FileJson } from 'lucide-react';

interface EndpointSpec {
  method: 'GET' | 'POST';
  path: string;
  summary: string;
  description: string;
  sampleBody?: any;
}

const ENDPOINTS: EndpointSpec[] = [
  {
    method: 'POST',
    path: '/api/chat',
    summary: 'Conversational Mental Health Support & Crisis Triage',
    description: 'Main ingress endpoint. Scrubs PII, runs Dual-Pass Crisis Detection. If Tier 3, short-circuits to 988 emergency resources. If Tier 0-2, retrieves Redis context buffer and generates CBT reframing response via Gemini 3.8 Flash.',
    sampleBody: {
      session_id: 'sess_987654321',
      user_id: 'usr_anon_4510',
      message: "I'm feeling overwhelmed and don't think I can keep going like this anymore.",
      timestamp: new Date().toISOString(),
    },
  },
  {
    method: 'POST',
    path: '/api/crisis/evaluate',
    summary: 'Direct Dual-Pass Guardrails Diagnostic Evaluation',
    description: 'Evaluates any input text through Tier 1 Regex (<10ms) and Tier 2 Semantic Classifier without advancing chat conversation history.',
    sampleBody: {
      message: "I don't know what to do, I feel completely hopeless.",
    },
  },
  {
    method: 'GET',
    path: '/api/analytics/summary',
    summary: 'Power BI Executive KPI Summary',
    description: 'Retrieves aggregated KPIs including total sessions, crisis short-circuits, detection SLA latency, and sentiment shift.',
  },
  {
    method: 'GET',
    path: '/api/analytics/fact-sessions',
    summary: 'Power BI DirectQuery: fact_sessions table',
    description: 'Returns structured anonymized session fact records (duration, message counts, initial/final sentiment, risk tier).',
  },
  {
    method: 'GET',
    path: '/api/analytics/dim-sentiment-hourly',
    summary: 'Power BI DirectQuery: dim_sentiment_hourly dimension',
    description: 'Returns aggregated hourly sentiment, crisis counts, and peak usage hours.',
  },
  {
    method: 'GET',
    path: '/api/openapi.json',
    summary: 'OpenAPI 3.0 System Specification',
    description: 'Returns the raw OpenAPI 3.0 specification for automated Swagger UI generation and enterprise API gateways.',
  },
];

export const ApiDocs: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointSpec>(ENDPOINTS[0]);
  const [requestBodyText, setRequestBodyText] = useState<string>(
    JSON.stringify(ENDPOINTS[0].sampleBody || {}, null, 2)
  );
  const [responseOutput, setResponseOutput] = useState<any>(null);
  const [isSending, setIsSending] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);

  const handleSelectEndpoint = (ep: EndpointSpec) => {
    setSelectedEndpoint(ep);
    setRequestBodyText(JSON.stringify(ep.sampleBody || {}, null, 2));
    setResponseOutput(null);
  };

  const executeRequest = async () => {
    setIsSending(true);
    try {
      let res;
      if (selectedEndpoint.method === 'POST') {
        const bodyObj = JSON.parse(requestBodyText);
        res = await fetch(selectedEndpoint.path, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyObj),
        });
      } else {
        res = await fetch(selectedEndpoint.path);
      }
      const data = await res.json();
      setResponseOutput(data);
    } catch (e: any) {
      setResponseOutput({ error: e.message || 'Execution error' });
    } finally {
      setIsSending(false);
    }
  };

  const curlCommand =
    selectedEndpoint.method === 'POST'
      ? `curl -X POST "${window.location.origin}${selectedEndpoint.path}" \\
  -H "Content-Type: application/json" \\
  -d '${requestBodyText.replace(/\n/g, '')}'`
      : `curl -X GET "${window.location.origin}${selectedEndpoint.path}"`;

  const copyCurl = () => {
    navigator.clipboard.writeText(curlCommand);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Terminal className="w-6 h-6 text-teal-400" />
            <h1 className="text-xl font-bold text-white">
              FastAPI / OpenAPI REST API Interactive Explorer
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Enterprise backend endpoints with strict Pydantic JSON schemas, sub-second latency headers, and OpenAPI 3.0 support.
          </p>
        </div>

        <a
          href="/api/openapi.json"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-teal-400 text-xs font-semibold border border-slate-800 transition"
        >
          <FileJson className="w-3.5 h-3.5" />
          <span>Raw OpenAPI JSON</span>
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Endpoint List */}
        <div className="lg:col-span-4 space-y-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Available Endpoints:
          </span>
          {ENDPOINTS.map((ep, idx) => {
            const isSelected = selectedEndpoint.path === ep.path && selectedEndpoint.method === ep.method;
            return (
              <button
                key={idx}
                onClick={() => handleSelectEndpoint(ep)}
                className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-slate-800 border-teal-500/80 shadow-md shadow-teal-500/10'
                    : 'bg-slate-900 border-slate-800 hover:bg-slate-850 text-slate-300'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded font-mono ${
                        ep.method === 'POST' ? 'bg-teal-500/20 text-teal-300' : 'bg-blue-500/20 text-blue-300'
                      }`}
                    >
                      {ep.method}
                    </span>
                    <span className="font-mono text-xs font-bold text-white">{ep.path}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1">{ep.summary}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right: Endpoint Detail & Testing */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded font-mono ${
                  selectedEndpoint.method === 'POST'
                    ? 'bg-teal-500/20 text-teal-300'
                    : 'bg-blue-500/20 text-blue-300'
                }`}
              >
                {selectedEndpoint.method}
              </span>
              <span className="font-mono text-sm font-bold text-white">
                {selectedEndpoint.path}
              </span>
            </div>

            <button
              onClick={executeRequest}
              disabled={isSending}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white text-xs font-bold transition shadow-md shadow-teal-600/20 active:scale-95"
            >
              <Send className={`w-3.5 h-3.5 ${isSending ? 'animate-spin' : ''}`} />
              <span>{isSending ? 'Executing...' : 'Try It Out'}</span>
            </button>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {selectedEndpoint.description}
          </p>

          {/* cURL Snippet */}
          <div className="relative bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-300">
            <div className="flex items-center justify-between mb-1 text-[10px] text-slate-400 uppercase tracking-wider">
              <span>cURL Command</span>
              <button
                onClick={copyCurl}
                className="flex items-center gap-1 text-slate-400 hover:text-white transition"
              >
                {copiedCurl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCurl ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="overflow-x-auto whitespace-pre">{curlCommand}</pre>
          </div>

          {/* Request Body (for POST) */}
          {selectedEndpoint.method === 'POST' && (
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                JSON Request Body:
              </span>
              <textarea
                value={requestBodyText}
                onChange={(e) => setRequestBodyText(e.target.value)}
                rows={5}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-teal-300 focus:outline-none focus:border-teal-500"
              />
            </div>
          )}

          {/* Live Response Box */}
          {responseOutput && (
            <div className="pt-3 border-t border-slate-800">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Live Response (200 OK):
              </span>
              <div className="max-h-72 overflow-y-auto bg-slate-950 rounded-xl border border-slate-800 p-3 font-mono text-xs text-emerald-300">
                <pre className="whitespace-pre">{JSON.stringify(responseOutput, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
