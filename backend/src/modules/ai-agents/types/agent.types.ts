export interface Citation {
  id: string;
  title: string;
  content: string;
  category: string;
  score: number;
  similarity?: number;
  index: number;
  /** Human-readable source attribution */
  source?: string;
  /** Optional URL for the source */
  url?: string;
  /** Display name of the source organization (e.g. "Sở Du lịch Thái Nguyên") */
  sourceName?: string;
  /** URL for the source reference */
  sourceUrl?: string;
}

export interface AgentResponse {
  response: string;
  citations: Citation[];
  /** Structured place information for frontend rendering */
  places?: Array<{
    name: string;
    shortDescription: string;
    highlights: string[];
    activities: string[];
    suitableFor: string[];
    visitDuration: string;
    bestSeason: string;
    distance: string;
    category: string;
    citationIndex: number;
  }>;
  /** Follow-up suggestion buttons */
  suggestions?: string[];
  /** If the assistant needs more info before answering */
  followUpQuestion?: string | null;
  /** Response metadata */
  metadata?: {
    intent: string | null;
    destination: string | null;
    hasRagData: boolean;
    agentUsed: string;
    latencyMs: number;
    planGenerated: boolean;
  };
}

export interface AgentTool {
  name: string;
  description: string;
  execute(input: any): Promise<any>;
}

/** Preferences stored in AIMemory for injection into agent prompts */
export interface UserMemory {
  travelPreferences?: string[];
  favoriteFoods?: string[];
  budget?: string | null;
  transportation?: string[];
  favoriteLocations?: string[];
}

export interface AgentStrategy {
  name: string;
  description: string;
  execute(
    userId: string,
    input: string,
    messageId?: string,
    extractedDestination?: string,
    history?: { role: string; content: string }[],
    memory?: UserMemory
  ): Promise<AgentResponse>;
}

export type AgentType = 'travel' | 'food' | 'culture' | 'recommendation' | 'unknown';

export interface IntentResult {
  intent: AgentType;
  destination: string | null;
  confidence: number;
  /** Human-readable explanation of why this intent was chosen */
  reasoning?: string;
}

export interface RunAgentDto {
  agentType?: AgentType;
  input: string;
  messageId?: string;
}
