/**
 * Dual-Pass Crisis Detection Pipeline & Guardrails
 * Tier 1: Sub-10ms Rule/Regex Engine (explicit emergency keywords)
 * Tier 2: Semantic Risk Classifier (implicit distress, hopelessness, semantic intent)
 * Post-Guardrails: Validates LLM outputs against clinical/medical boundary violations
 */

import { CrisisResource, PrimaryEmotion, RiskLevel, RiskStatus } from '../types.js';

// Pre-compiled Tier 1 Emergency Regex Patterns
const TIER_1_CRISIS_PATTERNS = [
  /\b(?:kill|hanging|hang|shoot|slit|drown|strangle|suffocate)\s+(?:myself|me)\b/i,
  /\b(?:end(?:ing)?\s+my\s+life|take\s+my\s+own\s+life)\b/i,
  /\b(?:want\s+to\s+die|wish\s+I\s+were\s+dead|rather\s+be\s+dead|better\s+off\s+dead)\b/i,
  /\b(?:commit(?:ting)?\s+suicide|suicidal\s+thoughts?|suicidal\s+ideation)\b/i,
  /\b(?:overdose|overdosing|swallow\s+all\s+(?:the|my)\s+pills|take\s+a\s+whole\s+bottle)\b/i,
  /\b(?:cut(?:ting)?\s+my\s+wrists?|jump(?:ing)?\s+off\s+(?:a|the)\s+(?:bridge|roof|balcony|building))\b/i,
  /\b(?:wrote\s+(?:my|a)\s+suicide\s+note|this\s+is\s+my\s+final\s+goodbye|goodbye\s+cruel\s+world)\b/i,
  /\b(?:giving\s+away\s+(?:all\s+)?my\s+things\s+before\s+I\s+(?:leave|go|die))\b/i,
  /\b(?:no\s+reason\s+to\s+live\s+anymore|planning\s+to\s+end\s+it)\b/i,
];

// Tier 2 Semantic Keyword & Implicit Intent Weights
const HIGH_DISTRESS_WEIGHTS: Record<string, { weight: number; emotion: PrimaryEmotion }> = {
  // Severe / Crisis indicators (implicit)
  trapped: { weight: 0.85, emotion: 'despair' },
  hopeless: { weight: 0.9, emotion: 'hopeless' },
  unbearable: { weight: 0.85, emotion: 'despair' },
  'cannot go on': { weight: 0.95, emotion: 'hopeless' },
  "can't go on": { weight: 0.95, emotion: 'hopeless' },
  'cannot keep going': { weight: 0.92, emotion: 'despair' },
  "can't keep going": { weight: 0.92, emotion: 'despair' },
  'nobody would care': { weight: 0.88, emotion: 'hopeless' },
  'burden to everyone': { weight: 0.85, emotion: 'hopeless' },
  'everyone would be happier without me': { weight: 0.95, emotion: 'hopeless' },
  'disappear forever': { weight: 0.82, emotion: 'hopeless' },
  'worthless': { weight: 0.75, emotion: 'despair' },
  'empty inside': { weight: 0.7, emotion: 'despair' },

  // Moderate stress indicators
  panic: { weight: 0.65, emotion: 'anxious' },
  anxious: { weight: 0.55, emotion: 'anxious' },
  anxiety: { weight: 0.55, emotion: 'anxious' },
  terrified: { weight: 0.65, emotion: 'anxious' },
  overwhelmed: { weight: 0.6, emotion: 'overwhelmed' },
  burnout: { weight: 0.5, emotion: 'overwhelmed' },
  exhausted: { weight: 0.45, emotion: 'overwhelmed' },
  grieving: { weight: 0.6, emotion: 'grief' },
  heartbroken: { weight: 0.55, emotion: 'grief' },
  lonely: { weight: 0.5, emotion: 'grief' },
  frustrated: { weight: 0.4, emotion: 'frustrated' },
  angry: { weight: 0.45, emotion: 'frustrated' },
  furious: { weight: 0.5, emotion: 'frustrated' },

  // Mild stress indicators
  stressed: { weight: 0.35, emotion: 'mild_stress' },
  tired: { weight: 0.25, emotion: 'mild_stress' },
  worried: { weight: 0.35, emotion: 'anxious' },
  busy: { weight: 0.2, emotion: 'mild_stress' },
};

// Safe / positive indicators
const SAFE_POSITIVE_TERMS = [
  'grateful', 'thankful', 'better today', 'making progress', 'feeling good',
  'calm', 'relaxed', 'hello', 'hi', 'good morning', 'good afternoon', 'how are you',
  'meditation', 'breathing', 'peaceful', 'happy', 'journaling', 'walk outside'
];

export const CRISIS_RESOURCES: CrisisResource[] = [
  {
    id: 'res_988_lifeline',
    name: '988 Suicide & Crisis Lifeline',
    description: 'Free, confidential 24/7 support for individuals in suicidal crisis or emotional distress.',
    contact_type: 'phone',
    contact_value: '988',
    availability: '24/7/365',
    region: 'United States & Canada',
    action_label: 'Call 988',
    primary: true,
  },
  {
    id: 'res_crisis_text',
    name: 'Crisis Text Line',
    description: 'Connect with a trained crisis counselor 24/7 via text message.',
    contact_type: 'text',
    contact_value: 'Text HOME to 741741',
    availability: '24/7/365',
    region: 'US, UK, Canada',
    action_label: 'Text 741741',
    primary: true,
  },
  {
    id: 'res_trevor_project',
    name: 'The Trevor Project (LGBTQ+ Youth)',
    description: 'Confidential suicide prevention and crisis intervention for LGBTQ young people.',
    contact_type: 'phone',
    contact_value: '1-866-488-7386',
    availability: '24/7',
    region: 'North America',
    action_label: 'Call TrevorLifeline',
    primary: false,
  },
  {
    id: 'res_veterans_crisis',
    name: 'Veterans Crisis Line',
    description: 'Caring, qualified responders with the Department of Veterans Affairs.',
    contact_type: 'phone',
    contact_value: 'Dial 988, then press 1',
    availability: '24/7',
    region: 'US Veterans & Families',
    action_label: 'Call Veterans Line',
    primary: false,
  },
  {
    id: 'res_befrienders_intl',
    name: 'Befrienders Worldwide & IASP',
    description: 'Global directory of confidential emotional support and suicide prevention hotlines.',
    contact_type: 'web',
    contact_value: 'https://www.befrienders.org',
    availability: '24/7 Global directory',
    region: 'International',
    action_label: 'Find Local Hotline',
    primary: false,
  },
  {
    id: 'res_emergency_services',
    name: 'Emergency Medical Services (EMS)',
    description: 'If you or someone you know is in immediate physical danger, contact local emergency dispatchers.',
    contact_type: 'emergency',
    contact_value: '911 (US/CA) or 112 (EU/UK) or 000 (AU)',
    availability: 'Immediate',
    region: 'Worldwide',
    action_label: 'Call 911',
    primary: false,
  },
];

/**
 * Tier 1: Sub-10ms Rule/Regex Matcher
 */
export function runTier1RegexMatcher(text: string): {
  matched: boolean;
  patterns: string[];
  latency_ms: number;
} {
  const startTime = performance.now();
  const matchedPatterns: string[] = [];

  for (const regex of TIER_1_CRISIS_PATTERNS) {
    if (regex.test(text)) {
      matchedPatterns.push(regex.source);
    }
  }

  const latency_ms = Number((performance.now() - startTime).toFixed(3));
  return {
    matched: matchedPatterns.length > 0,
    patterns: matchedPatterns,
    latency_ms,
  };
}

/**
 * Tier 2: Semantic Risk Classifier
 * Evaluates distress levels, implicit hopelessness, emotional state, and sentiment.
 */
export function runTier2SemanticClassifier(text: string): {
  risk_level: RiskLevel;
  primary_emotion: PrimaryEmotion;
  sentiment_score: number;
  confidence_score: number;
  latency_ms: number;
  trigger_signals: string[];
} {
  const startTime = performance.now();
  const lower = text.toLowerCase();
  const trigger_signals: string[] = [];

  let accumulatedDistressScore = 0;
  let emotionCounts: Record<PrimaryEmotion, number> = {
    calm: 0,
    neutral: 0,
    hopeful: 0,
    mild_stress: 0,
    anxious: 0,
    frustrated: 0,
    overwhelmed: 0,
    grief: 0,
    hopeless: 0,
    despair: 0,
  };

  // Check positive/safe words
  let positiveScore = 0;
  for (const safeTerm of SAFE_POSITIVE_TERMS) {
    if (lower.includes(safeTerm)) {
      positiveScore += 0.3;
      emotionCounts.calm += 1;
    }
  }

  // Check distress keywords
  for (const [term, meta] of Object.entries(HIGH_DISTRESS_WEIGHTS)) {
    if (lower.includes(term)) {
      accumulatedDistressScore += meta.weight;
      emotionCounts[meta.emotion] += meta.weight;
      trigger_signals.push(term);
    }
  }

  // Calculate sentiment from -1.0 to +1.0
  const rawDistress = Math.min(accumulatedDistressScore, 2.5);
  const sentiment_score = Number(
    Math.max(-1.0, Math.min(1.0, (positiveScore * 0.4) - (rawDistress * 0.5))).toFixed(2)
  );

  // Determine primary emotion
  let dominantEmotion: PrimaryEmotion = 'neutral';
  let maxWeight = 0;
  for (const [emotion, count] of Object.entries(emotionCounts) as [PrimaryEmotion, number][]) {
    if (count > maxWeight) {
      maxWeight = count;
      dominantEmotion = emotion;
    }
  }

  if (maxWeight === 0) {
    dominantEmotion = sentiment_score > 0.1 ? 'calm' : 'neutral';
  }

  // Determine Risk Tier
  let risk_level: RiskLevel = 0;
  let confidence_score = 0.88;

  if (accumulatedDistressScore >= 1.6 || dominantEmotion === 'hopeless' || dominantEmotion === 'despair') {
    // High implicit suicidal/crisis signal
    risk_level = 3;
    confidence_score = 0.94;
  } else if (accumulatedDistressScore >= 0.85 || dominantEmotion === 'anxious' || dominantEmotion === 'overwhelmed') {
    risk_level = 2;
    confidence_score = 0.91;
  } else if (accumulatedDistressScore >= 0.25 || dominantEmotion === 'mild_stress' || dominantEmotion === 'frustrated') {
    risk_level = 1;
    confidence_score = 0.89;
  } else {
    risk_level = 0;
    confidence_score = 0.95;
  }

  const latency_ms = Number((performance.now() - startTime).toFixed(3));

  return {
    risk_level,
    primary_emotion: dominantEmotion,
    sentiment_score,
    confidence_score,
    latency_ms,
    trigger_signals,
  };
}

/**
 * Dual-Pass Evaluation Pipeline
 */
export function evaluateSafetyAndRisk(
  text: string,
  piiLatencyMs: number = 0
): RiskStatus {
  // Step 1: Tier 1 Sub-10ms Rule Matcher
  const tier1 = runTier1RegexMatcher(text);

  if (tier1.matched) {
    // Immediate short-circuit to Tier 3 Crisis!
    return {
      is_crisis: true,
      risk_level: 3,
      primary_emotion: 'despair',
      sentiment_score: -0.95,
      confidence_score: 0.99,
      tier_triggered: 'tier1_regex',
      detected_triggers: tier1.patterns,
      latency_breakdown_ms: {
        pii_scrub_ms: piiLatencyMs,
        tier1_regex_ms: tier1.latency_ms,
        tier2_semantic_ms: 0,
        total_pipeline_ms: Number((piiLatencyMs + tier1.latency_ms).toFixed(3)),
      },
    };
  }

  // Step 2: Tier 2 Semantic Classifier
  const tier2 = runTier2SemanticClassifier(text);

  return {
    is_crisis: tier2.risk_level === 3,
    risk_level: tier2.risk_level,
    primary_emotion: tier2.primary_emotion,
    sentiment_score: tier2.sentiment_score,
    confidence_score: tier2.confidence_score,
    tier_triggered: tier2.risk_level === 3 ? 'tier2_semantic' : 'none',
    detected_triggers: tier2.trigger_signals,
    latency_breakdown_ms: {
      pii_scrub_ms: piiLatencyMs,
      tier1_regex_ms: tier1.latency_ms,
      tier2_semantic_ms: tier2.latency_ms,
      total_pipeline_ms: Number((piiLatencyMs + tier1.latency_ms + tier2.latency_ms).toFixed(3)),
    },
  };
}

/**
 * Post-Guardrails Validator
 * Ensures generated LLM text does not breach clinical boundaries or prescribe medication.
 */
export function validatePostGuardrails(generatedText: string): {
  passed: boolean;
  violations: string[];
  sanitizedResponse: string;
} {
  const violations: string[] = [];
  let sanitized = generatedText;

  // 1. Forbidden Medical Diagnosis statements
  const diagRegex = /\b(?:I\s+diagnose\s+you\s+with|You\s+have\s+been\s+diagnosed\s+with|You\s+suffer\s+from\s+clinical)\b/i;
  if (diagRegex.test(generatedText)) {
    violations.push('Direct clinical diagnosis detected');
    sanitized = sanitized.replace(diagRegex, "It sounds like you may be experiencing symptoms of");
  }

  // 2. Forbidden Prescription / Medication instructions
  const rxRegex = /\b(?:Take\s+\d+\s*mg|prescribe|I\s+recommend\s+taking\s+(?:Xanax|Prozac|Lexapro|Zoloft|Adderall|Valium))\b/i;
  if (rxRegex.test(generatedText)) {
    violations.push('Medical drug dosage or pharmaceutical recommendation detected');
    sanitized = "I cannot provide medical prescriptions or dosage instructions. Please consult a qualified psychiatrist or medical professional regarding medications. " + sanitized.replace(rxRegex, "[Consult Physician]");
  }

  return {
    passed: violations.length === 0,
    violations,
    sanitizedResponse: sanitized,
  };
}
