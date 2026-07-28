# SYSTEM ARCHITECTURE & MEMORY BANK

## 🛠 Tech Stack Overview
- **Backend**: Node.js, Express, TypeScript, Prisma ORM, PostgreSQL (pgvector).
- **AI Engine**: Python FastAPI AI Service, LangChain/Gemini, Hybrid RAG.
- **AI Agent Strategies**: Multi-Agent Architecture (`travel.agent.ts`, `food.agent.ts`, `culture.agent.ts`).

## 🗺 Module Map
1. `backend/src/modules/ai-agents/`: Điều phối luồng làm việc của Multi-Agent.
2. `backend/src/modules/rag/`: Tìm kiếm ngữ nghĩa, vector store, Fact Verifier & Guardrails[cite: 1, 2].
3. `backend/src/modules/dialogue/`: Quản lý Intent, Dialogue State & Slot Filling[cite: 1, 2].
4. `backend/src/modules/map/` & `optimizer/`: Tính toán lộ trình và dữ liệu địa lý (GIS)[cite: 1, 2].

## 📝 Change Log
- [2026-07-29] Integrated AgentCircuitBreaker and Guardrails system to restrict token loops.