import { EmotionAnalyzer } from './emotion/emotion-analyzer';
import { RuleOverrideEngine } from './rules/rule-override-engine';
import { ContextResolver } from './context/context-resolver';
import { IntentClassifier } from './classifier/intent-classifier';
import { ConversationStateMachine } from './fsm/state-machine';
import { SlotPolicy } from './policy/slot-policy';
import { ResponsePolicy } from './policy/response-policy';
import { CIMResult, ChatbotState } from './interfaces/intelligence.interfaces';
import { logger } from '../../../utils/logger';

export class ConversationIntelligence {
  private emotionAnalyzer: EmotionAnalyzer;
  private ruleOverride: RuleOverrideEngine;
  private contextResolver: ContextResolver;
  private intentClassifier: IntentClassifier;
  private stateMachine: ConversationStateMachine;
  private slotPolicy: SlotPolicy;
  private responsePolicy: ResponsePolicy;

  constructor() {
    this.emotionAnalyzer = new EmotionAnalyzer();
    this.ruleOverride = new RuleOverrideEngine();
    this.contextResolver = new ContextResolver();
    this.intentClassifier = new IntentClassifier();
    this.stateMachine = new ConversationStateMachine();
    this.slotPolicy = new SlotPolicy();
    this.responsePolicy = new ResponsePolicy();
  }

  /**
   * Run the full Conversation Intelligence pipeline on the user query
   */
  async analyzeQuery(
    query: string,
    conversationId: string,
    currentState: ChatbotState = 'DISCOVERY'
  ): Promise<CIMResult> {
    logger.debug('CIM', 'Analyzing conversation query', { query, conversationId, currentState });

    // 1. Emotion Analyzer
    const emotion = this.emotionAnalyzer.analyze(query);

    // 2. Resolve Context Memory
    const context = await this.contextResolver.resolve(conversationId);

    // 3. Rule-based Override Engine
    let intentResult = this.ruleOverride.evaluate(query, emotion, context);

    // 4. Intent Classifier (Fallback if no rules override)
    if (!intentResult) {
      intentResult = this.intentClassifier.classify(query);
    }

    // 5. Conversation FSM Transition
    const nextState = this.stateMachine.transition(currentState, intentResult.intent);

    // 6. Slot Filling Policy
    const slotPolicyResult = this.slotPolicy.apply(intentResult.intent, intentResult.needSlot);

    // 7. Response Policy based on Emotion
    const toneModifier = this.responsePolicy.resolveTone(emotion);

    const result: CIMResult = {
      query,
      emotion,
      intent: intentResult,
      nextState,
      responsePolicy: {
        toneModifier,
        actionType: slotPolicyResult.actionType,
        clarificationPrompt: slotPolicyResult.clarificationPrompt,
      },
    };

    logger.debug('CIM', 'Analysis completed', {
      intent: result.intent.intent,
      emotion: result.emotion.emotion,
      nextState: result.nextState,
      action: result.responsePolicy.actionType,
    });

    return result;
  }
}
