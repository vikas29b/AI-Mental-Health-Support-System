/**
 * AegisMind - Enterprise Mental Health Support System
 * FastAPI-style Express Backend Engine & Vite Dev Server Integration
 */

import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { scrubPii } from './server/guardrails/piiScrubber.js';
import {
  CRISIS_RESOURCES,
  evaluateSafetyAndRisk,
  validatePostGuardrails,
} from './server/guardrails/crisisDetector.js';
import { sessionStore } from './server/store/sessionMemoryStore.js';
import { warehouse } from './server/store/analyticsWarehouse.js';
import { generateEmpatheticResponse } from './server/services/geminiService.js';
import {
  ChatRequestPayload,
  ChatResponsePayload,
  FactRiskEvent,
  FactSession,
} from './server/types.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    const start = performance.now();
    res.on('finish', () => {
      const duration = (performance.now() - start).toFixed(2);
      // Clean internal timing logging to console
      // console.log(`[API] ${req.method} ${req.path} completed in ${duration}ms with status ${res.statusCode}`);
    });
  }
  next();
});

// ==========================================
// 1. CORE CHAT ENDPOINT (/api/chat)
// ==========================================
app.post('/api/chat', async (req: Request, res: Response) => {
  const reqStart = performance.now();
  const body = req.body as ChatRequestPayload;

  // Strict Payload Validation
  if (!body || !body.message || typeof body.message !== 'string') {
    return res.status(400).json({
      error: 'Invalid Request Payload: "message" string is required.',
      code: 'VALIDATION_ERROR',
    });
  }

  const sessionId = body.session_id || `sess_${Date.now()}`;
  const userId = body.user_id || 'usr_anon_guest';
  const rawMessage = body.message.trim();
  const traceId = `trc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // Step 1: Ingestion & PII Filtering
  const piiResult = scrubPii(rawMessage);
  const sanitizedMessage = piiResult.sanitized_text;

  // Step 2: Dual-Pass Crisis Detection Pipeline
  const riskStatus = evaluateSafetyAndRisk(sanitizedMessage, piiResult.latency_ms);

  // Retrieve / Initialize Session Context (Redis buffer emulation)
  const session = sessionStore.getOrCreateSession(sessionId, userId);

  // Step 3: Branching Execution
  if (riskStatus.is_crisis) {
    // -------------------------------------------------------------
    // BRANCH A: CRISIS TRIGGERED (Risk Tier 3)
    // Short-circuits core LLM to prevent hallucinations or delay
    // -------------------------------------------------------------
    const crisisResponse =
      "I hear how much pain you are in right now, and I care about your safety. You do not have to carry this alone. Please connect right away with a caring, trained counselor who can support you through this moment. Help is free, confidential, and available 24/7:";

    const totalPipelineMs = Number((performance.now() - reqStart).toFixed(2));
    riskStatus.latency_breakdown_ms.total_pipeline_ms = totalPipelineMs;

    const responsePayload: ChatResponsePayload = {
      session_id: sessionId,
      user_id: session.user_id_hash,
      response: crisisResponse,
      risk_status: riskStatus,
      resources: CRISIS_RESOURCES,
      cbt_technique_applied: 'Immediate Crisis Triage & Safety Grounding',
      grounding_prompt: 'Take a slow, deep breath. Focus on your feet firmly touching the floor. Please call or text 988 right now.',
      timestamp: new Date().toISOString(),
      trace_id: traceId,
    };

    // Update session memory
    sessionStore.addTurn(
      sessionId,
      {
        role: 'user',
        content: rawMessage,
        anonymized_content: sanitizedMessage,
        risk_level: 3,
        sentiment: -0.95,
        timestamp: new Date().toISOString(),
      },
      'Crisis Escalation'
    );

    sessionStore.addTurn(
      sessionId,
      {
        role: 'assistant',
        content: crisisResponse,
        risk_level: 3,
        sentiment: 0.1,
        timestamp: new Date().toISOString(),
      },
      'Crisis Escalation'
    );

    // Step 6: Async Analytics Ingestion (PostgreSQL Warehouse write)
    warehouse.enqueue(() => {
      const riskEvent: FactRiskEvent = {
        event_id: `evt_${Date.now()}`,
        session_id: sessionId,
        timestamp: new Date().toISOString(),
        risk_tier: 3,
        trigger_type: riskStatus.tier_triggered === 'tier1_regex' ? 'tier1_regex' : 'tier2_semantic',
        trigger_terms_redacted: (riskStatus.detected_triggers || []).join(', ') || '[REDACTED_TRIGGER]',
        detection_latency_ms: riskStatus.latency_breakdown_ms.tier1_regex_ms || 1.1,
        escalation_level: 'critical_emergency',
        resources_displayed: CRISIS_RESOURCES.map((r) => r.name),
        action_taken: 'helpline_displayed',
      };
      warehouse.recordRiskEventFact(riskEvent);

      const sessionFact: FactSession = {
        session_id: sessionId,
        user_id_hash: session.user_id_hash,
        start_time: session.created_at,
        end_time: new Date().toISOString(),
        duration_seconds: Math.floor((Date.now() - new Date(session.created_at).getTime()) / 1000),
        message_count: session.total_messages,
        max_risk_level: 3,
        initial_sentiment: session.initial_sentiment,
        final_sentiment: -0.85,
        sentiment_delta: Number((-0.85 - session.initial_sentiment).toFixed(2)),
        primary_distress_category: 'Crisis Escalation',
        status: 'escalated_to_crisis',
        crisis_triggered: true,
      };
      warehouse.recordSessionFact(sessionFact);
    });

    return res.json(responsePayload);
  }

  // -------------------------------------------------------------
  // BRANCH B: STANDARD CONVERSATION (Risk Tiers 0–2)
  // Context Buffer, CBT Persona Injection, LLM Execution & Post-Guardrails
  // -------------------------------------------------------------
  const recentHistory = sessionStore.getRecentContext(sessionId);

  // Generate Empathetic CBT Response via Gemini
  const llmResult = await generateEmpatheticResponse(
    sanitizedMessage,
    recentHistory,
    riskStatus.primary_emotion
  );

  // Output Guardrails Verification
  const guardrailCheck = validatePostGuardrails(llmResult.text);
  const finalResponseText = guardrailCheck.sanitizedResponse;

  const totalPipelineMs = Number((performance.now() - reqStart).toFixed(2));
  riskStatus.latency_breakdown_ms.llm_generation_ms = llmResult.latencyMs;
  riskStatus.latency_breakdown_ms.post_guardrails_ms = 0.2;
  riskStatus.latency_breakdown_ms.total_pipeline_ms = totalPipelineMs;

  const responsePayload: ChatResponsePayload = {
    session_id: sessionId,
    user_id: session.user_id_hash,
    response: finalResponseText,
    risk_status: riskStatus,
    resources: riskStatus.risk_level === 2 ? CRISIS_RESOURCES.slice(0, 2) : null,
    cbt_technique_applied: llmResult.cbtTechnique,
    grounding_prompt: llmResult.groundingPrompt,
    timestamp: new Date().toISOString(),
    trace_id: traceId,
  };

  // Update session context
  sessionStore.addTurn(
    sessionId,
    {
      role: 'user',
      content: rawMessage,
      anonymized_content: sanitizedMessage,
      risk_level: riskStatus.risk_level,
      sentiment: riskStatus.sentiment_score,
      timestamp: new Date().toISOString(),
    },
    riskStatus.primary_emotion
  );

  sessionStore.addTurn(
    sessionId,
    {
      role: 'assistant',
      content: finalResponseText,
      risk_level: riskStatus.risk_level,
      sentiment: Math.min(1.0, riskStatus.sentiment_score + 0.35),
      timestamp: new Date().toISOString(),
    },
    riskStatus.primary_emotion
  );

  // Step 6: Async Analytics Ingestion (PostgreSQL Warehouse write)
  warehouse.enqueue(() => {
    if (riskStatus.risk_level === 2) {
      warehouse.recordRiskEventFact({
        event_id: `evt_${Date.now()}`,
        session_id: sessionId,
        timestamp: new Date().toISOString(),
        risk_tier: 2,
        trigger_type: 'tier2_semantic',
        trigger_terms_redacted: (riskStatus.detected_triggers || []).join(', ') || 'stress_indicators',
        detection_latency_ms: riskStatus.latency_breakdown_ms.tier2_semantic_ms,
        escalation_level: 'high_distress',
        resources_displayed: ['988 Lifeline', 'Crisis Text Line 741741'],
        action_taken: 'helpline_displayed',
      });
    }

    const sessionFact: FactSession = {
      session_id: sessionId,
      user_id_hash: session.user_id_hash,
      start_time: session.created_at,
      end_time: new Date().toISOString(),
      duration_seconds: Math.floor((Date.now() - new Date(session.created_at).getTime()) / 1000),
      message_count: session.total_messages,
      max_risk_level: session.max_risk_level,
      initial_sentiment: session.initial_sentiment,
      final_sentiment: riskStatus.sentiment_score,
      sentiment_delta: Number((riskStatus.sentiment_score - session.initial_sentiment).toFixed(2)),
      primary_distress_category: riskStatus.primary_emotion.toUpperCase(),
      status: 'active',
      crisis_triggered: false,
    };
    warehouse.recordSessionFact(sessionFact);
  });

  return res.json(responsePayload);
});

// ==========================================
// 2. DIAGNOSTIC WORKBENCH (/api/crisis/evaluate)
// ==========================================
app.post('/api/crisis/evaluate', (req: Request, res: Response) => {
  const { message } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Missing "message" string' });
  }

  const pii = scrubPii(message);
  const evaluation = evaluateSafetyAndRisk(pii.sanitized_text, pii.latency_ms);

  res.json({
    raw_input: message,
    pii_scrubbed: pii,
    risk_evaluation: evaluation,
    crisis_triggered: evaluation.is_crisis,
    recommended_action: evaluation.is_crisis
      ? 'SHORT_CIRCUIT_TO_EMERGENCY_RESOURCES'
      : 'FORWARD_TO_CBT_PROMPT_ENGINE',
  });
});

// ==========================================
// 3. SESSION MANAGEMENT
// ==========================================
app.post('/api/sessions/reset', (req: Request, res: Response) => {
  const { session_id } = req.body;
  if (session_id) {
    sessionStore.clearSession(session_id);
  }
  res.json({ success: true, message: 'Session memory cleared' });
});

app.get('/api/sessions/active', (req: Request, res: Response) => {
  res.json({ sessions: sessionStore.getAllActiveSessions() });
});

// ==========================================
// 4. POWER BI & ANALYTICS WAREHOUSE ENDPOINTS
// ==========================================
app.get('/api/analytics/summary', (req: Request, res: Response) => {
  res.json(warehouse.getExecutiveSummary());
});

app.get('/api/analytics/fact-sessions', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 100;
  res.json({
    schema: 'public.fact_sessions',
    total_records: warehouse.getFactSessions(1000).length,
    data: warehouse.getFactSessions(limit),
  });
});

app.get('/api/analytics/fact-risk-events', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 100;
  res.json({
    schema: 'public.fact_risk_events',
    total_records: warehouse.getFactRiskEvents(1000).length,
    data: warehouse.getFactRiskEvents(limit),
  });
});

app.get('/api/analytics/dim-sentiment-hourly', (req: Request, res: Response) => {
  res.json({
    schema: 'public.dim_sentiment_hourly',
    data: warehouse.getDimSentimentHourly(),
  });
});

app.post('/api/analytics/powerbi/query', (req: Request, res: Response) => {
  const { sql } = req.body;
  if (!sql) {
    return res.status(400).json({ error: 'SQL query string required' });
  }
  const result = warehouse.executeDirectQuery(sql);
  res.json(result);
});

app.post('/api/analytics/emergency-action', (req: Request, res: Response) => {
  const { session_id, action } = req.body;
  if (session_id && action) {
    warehouse.logEmergencyAction(session_id, action);
  }
  res.json({ success: true });
});

// ==========================================
// 5. OPENAPI 3.0 SPECIFICATION
// ==========================================
app.get('/api/openapi.json', (req: Request, res: Response) => {
  res.json({
    openapi: '3.0.3',
    info: {
      title: 'AegisMind Mental Health Support Backend Engine',
      version: '2.4.0',
      description:
        'Enterprise conversational backend with sub-second dual-pass crisis detection, PII scrubbing, CBT dynamic prompts, and Power BI DirectQuery warehousing.',
    },
    paths: {
      '/api/chat': {
        post: {
          summary: 'Send message to conversational mental health engine',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    session_id: { type: 'string', example: 'sess_987654321' },
                    user_id: { type: 'string', example: 'usr_anon_4510' },
                    message: { type: 'string', example: "I'm feeling overwhelmed and don't think I can keep going." },
                    timestamp: { type: 'string', format: 'date-time' },
                  },
                  required: ['message'],
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Empathetic response or emergency crisis intervention payload',
            },
          },
        },
      },
      '/api/crisis/evaluate': {
        post: {
          summary: 'Benchmark and evaluate text through dual-pass safety guardrails without saving to chat',
        },
      },
      '/api/analytics/summary': {
        get: {
          summary: 'Get Power BI executive dashboard KPI summary',
        },
      },
      '/api/analytics/fact-sessions': {
        get: {
          summary: 'Query fact_sessions table for DirectQuery ingestion',
        },
      },
      '/api/analytics/dim-sentiment-hourly': {
        get: {
          summary: 'Query dim_sentiment_hourly materialized view',
        },
      },
    },
  });
});

// ==========================================
// 6. VITE MIDDLEWARE / PRODUCTION STATIC SERVER
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AegisMind] Backend engine listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
