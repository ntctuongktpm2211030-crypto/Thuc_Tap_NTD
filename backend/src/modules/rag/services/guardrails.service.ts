import { GuardrailResult } from '../types/rag-enterprise.types';

export class GuardrailsService {
  // Regex pattern for Vietnam phone numbers, emails, and CCCD/CMND numbers
  private emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  private phoneRegex = /(?:\+84|0)(?:\d{9}|\d{10})/g;
  private citizenIdRegex = /\b\d{9}\b|\b\d{12}\b/g;

  // Injection keywords
  private jailbreakKeywords = [
    'ignore previous instructions',
    'bỏ qua các chỉ dẫn trước',
    'system prompt',
    'you are now a',
    'acting as',
    'hãy đóng vai',
    'quên các quy tắc',
    'forget the rules',
    'định dạng lại hệ thống',
  ];

  // Toxicity keywords (Vietnam common toxic/sensitive words)
  private toxicityKeywords = [
    'dm', 'đm', 'địt', 'chửi', 'lừa đảo', 'ngu', 'óc chó', 'phản động', 'đảo chính', 'ma túy', 'cờ bạc'
  ];

  /**
   * Validate user input query against Prompt Injection, Toxicity, and PII
   */
  validateInput(query: string): GuardrailResult {
    const cleanQuery = query.toLowerCase();

    // 1. Detect Prompt Injection / Jailbreak
    for (const keyword of this.jailbreakKeywords) {
      if (cleanQuery.includes(keyword)) {
        return {
          blocked: true,
          threatType: 'PROMPT_INJECTION',
          violationReason: `Detected jailbreak keyword: "${keyword}"`,
        };
      }
    }

    // 2. Detect Toxicity
    for (const keyword of this.toxicityKeywords) {
      if (cleanQuery.includes(keyword)) {
        return {
          blocked: true,
          threatType: 'TOXICITY',
          violationReason: `Detected toxic/unsafe word: "${keyword}"`,
        };
      }
    }

    // 3. Detect PII (Block queries containing sensitive citizen IDs or emails for safety)
    if (this.citizenIdRegex.test(query) || this.emailRegex.test(query)) {
      return {
        blocked: true,
        threatType: 'PII_LEAK',
        violationReason: 'Detected sensitive Personally Identifiable Information (PII) in query.',
      };
    }

    return {
      blocked: false,
      threatType: 'NONE',
    };
  }

  /**
   * Clean/Redact generated response output to prevent accidental PII leakage or toxic content
   */
  validateOutput(response: string): GuardrailResult {
    let redacted = response;

    // Redact emails
    redacted = redacted.replace(this.emailRegex, '[REDACTED_EMAIL]');

    // Redact VN Phone numbers
    redacted = redacted.replace(this.phoneRegex, '[REDACTED_PHONE]');

    // Redact Citizen IDs
    redacted = redacted.replace(this.citizenIdRegex, '[REDACTED_ID]');

    // Detect if toxicity remains in response (prevent model failure generation)
    const cleanRedacted = redacted.toLowerCase();
    for (const keyword of this.toxicityKeywords) {
      if (cleanRedacted.includes(keyword)) {
        return {
          blocked: true,
          threatType: 'TOXICITY',
          violationReason: `Generated response contains toxic terms: "${keyword}"`,
        };
      }
    }

    return {
      blocked: false,
      threatType: 'NONE',
      redactedPayload: redacted,
    };
  }
}
