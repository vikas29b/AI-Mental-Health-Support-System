/**
 * Enterprise Mental Health Support System - Core Types
 */

export interface ChatRequestPayload {
  session_id: string;
  user_id: string;
  message: string;
  timestamp: string;
  client_metadata?: {
    platform?: string;
    locale?: string;
    client_version?: string;
  };
}

export type RiskLevel = 0 | 1 | 2 | 3;
// 0: Safe (General conversation, wellness, neutral reflection)
// 1: Mild Distress (Everyday stress, minor frustration, routine fatigue)
// 2: Moderate Stress (Burnout, panic feelings, persistent anxiety, grief)
// 3: Severe Crisis (Self-harm ideation, acute suicidal intent, imminent danger)

export type PrimaryEmotion =
  | 'calm'
  | 'neutral'
  | 'hopeful'
  | 'mild_stress'
  | 'anxious'
  | 'frustrated'
  | 'overwhelmed'
  | 'grief'
  | 'hopeless'
  | 'despair';

export interface CrisisResource {
  id: string;
  name: string;
  description: string;
  contact_type: 'phone' | 'text' | 'web' | 'emergency';
  contact_value: string;
  availability: string;
  region: string;
  action_label: string;
  primary?: boolean;
}

export interface RiskStatus {
  is_crisis: boolean;
  risk_level: RiskLevel;
  primary_emotion: PrimaryEmotion;
  sentiment_score: number; // -1.0 to 1.0
  confidence_score: number; // 0.0 to 1.0
  tier_triggered?: 'tier1_regex' | 'tier2_semantic' | 'none';
  detected_triggers?: string[];
  latency_breakdown_ms: {
    pii_scrub_ms: number;
    tier1_regex_ms: number;
    tier2_semantic_ms: number;
    llm_generation_ms?: number;
    post_guardrails_ms?: number;
    total_pipeline_ms: number;
  };
}

export interface ChatResponsePayload {
  session_id: string;
  user_id: string;
  response: string;
  risk_status: RiskStatus;
  resources: CrisisResource[] | null;
  cbt_technique_applied?: string;
  grounding_prompt?: string;
  timestamp: string;
  trace_id: string;
}

export interface SessionTurn {
  role: 'user' | 'assistant' | 'system';
  content: string;
  anonymized_content?: string;
  risk_level: RiskLevel;
  sentiment: number;
  timestamp: string;
}

export interface SessionContext {
  session_id: string;
  user_id_hash: string;
  created_at: string;
  last_activity: string;
  turns: SessionTurn[];
  total_messages: number;
  max_risk_level: RiskLevel;
  initial_sentiment: number;
  current_sentiment: number;
  primary_distress_category: string;
  status: 'active' | 'escalated_to_crisis' | 'resolved' | 'ended';
}

export interface FactSession {
  session_id: string;
  user_id_hash: string;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  message_count: number;
  max_risk_level: RiskLevel;
  initial_sentiment: number;
  final_sentiment: number;
  sentiment_delta: number;
  primary_distress_category: string;
  status: string;
  crisis_triggered: boolean;
}

export interface FactRiskEvent {
  event_id: string;
  session_id: string;
  timestamp: string;
  risk_tier: RiskLevel;
  trigger_type: 'tier1_regex' | 'tier2_semantic';
  trigger_terms_redacted: string;
  detection_latency_ms: number;
  escalation_level: 'critical_emergency' | 'high_distress' | 'standard';
  resources_displayed: string[];
  action_taken: 'helpline_displayed' | 'call_clicked' | 'text_clicked' | 'de_escalated';
}

export interface DimSentimentHourly {
  hour_bucket: string; // ISO hour string e.g. "2026-09-27T10:00:00Z"
  display_time: string; // "10:00 AM"
  total_sessions: number;
  avg_sentiment: number;
  crisis_count: number;
  high_stress_count: number;
  safe_count: number;
  avg_response_latency_ms: number;
  top_emotion: PrimaryEmotion;
}

export interface PiiScrubResult {
  sanitized_text: string;
  redacted_items_count: number;
  redactions_found: {
    type: 'phone' | 'email' | 'ssn' | 'credit_card' | 'name';
    original_placeholder: string;
  }[];
  latency_ms: number;
}
