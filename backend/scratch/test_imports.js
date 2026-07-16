try {
  console.log("Loading AgentExecutorService...");
  const { AgentExecutorService } = require('../src/modules/ai-agents/services/agent-executor.service');
  console.log("Successfully loaded AgentExecutorService!");
  
  console.log("Loading ConversationIntelligence...");
  const { ConversationIntelligence } = require('../src/modules/chatbot/intelligence/conversation-intelligence');
  console.log("Successfully loaded ConversationIntelligence!");
} catch (err) {
  console.error("Load Error:", err);
}
