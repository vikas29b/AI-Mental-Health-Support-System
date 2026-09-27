/**
 * PII Scrubbing Middleware
 * Scrubs Personally Identifiable Information (PII) before storage and downstream LLM processing.
 */

import { PiiScrubResult } from '../types.js';

export function scrubPii(text: string): PiiScrubResult {
  const startTime = performance.now();
  let sanitized = text;
  const redactions: PiiScrubResult['redactions_found'] = [];

  // 1. Email pattern
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
  sanitized = sanitized.replace(emailRegex, (match) => {
    redactions.push({ type: 'email', original_placeholder: match });
    return '[REDACTED_EMAIL]';
  });

  // 2. SSN pattern (###-##-####)
  const ssnRegex = /\b\d{3}-\d{2}-\d{4}\b/g;
  sanitized = sanitized.replace(ssnRegex, (match) => {
    redactions.push({ type: 'ssn', original_placeholder: match });
    return '[REDACTED_SSN]';
  });

  // 3. Credit Card pattern
  const ccRegex = /\b(?:\d{4}[ -]?){3}\d{4}\b/g;
  sanitized = sanitized.replace(ccRegex, (match) => {
    redactions.push({ type: 'credit_card', original_placeholder: match });
    return '[REDACTED_PAYMENT]';
  });

  // 4. Phone numbers (standard US & international formats)
  const phoneRegex = /(?:\+?(\d{1,3}))?[-. (]*(\d{3})[-. )]*(\d{3})[-. ]*(\d{4})\b/g;
  sanitized = sanitized.replace(phoneRegex, (match) => {
    // Avoid redacting short hotline numbers like 988 or 741741
    if (match.trim() === '988' || match.trim() === '741741') return match;
    redactions.push({ type: 'phone', original_placeholder: match });
    return '[REDACTED_PHONE]';
  });

  // 5. Explicit Name Declarations ("My name is [Name]", "I am [Name]")
  const nameIntroRegex = /\b(?:my name is|i am|call me)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/gi;
  sanitized = sanitized.replace(nameIntroRegex, (full, name) => {
    redactions.push({ type: 'name', original_placeholder: name });
    return full.replace(name, '[REDACTED_NAME]');
  });

  const latency_ms = Number((performance.now() - startTime).toFixed(3));

  return {
    sanitized_text: sanitized,
    redacted_items_count: redactions.length,
    redactions_found: redactions,
    latency_ms,
  };
}
