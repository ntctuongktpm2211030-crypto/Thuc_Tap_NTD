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
- [2026-07-29] Fixed AI itinerary multi-day generation truncation (increased OpenAI max_tokens to 4500) and added localStorage + instant state update for AI history panel.
- [2026-07-29] Enforced Rule Accommodation (fixed hotel per trip) and Rule Budget Limit (post-LLM budget cap validation & scaling) in `ai-planner.ts`.
- [2026-07-29] Updated System Prompt with Daily Schedule Framework (natural tourist timeline) and Diversity & Non-Duplication Rules (unique spots, varied themes, food diversity).
- [2026-07-29] Synchronized Backend (`ai-planner.ts`) and Frontend (`TripPlanner.tsx`) to strictly generate and render 6 distinct, sequential activity cards per day (Breakfast, Morning Attraction, Lunch & Coffee, Afternoon Sightseeing, Dinner, Night Walk & Hotel).
- [2026-07-29] Enforced Terraholic AI Strict Non-Duplication Rules: 100% unique attractions and restaurants across N days using programmatic tracking (`usedNames = new Set<string>()`), combined with Single Hotel Base and strict budget limit (`TotalEstimatedCost <= UserBudget`).
- [2026-07-29] Expanded real attraction dataset (20+ spots) and restaurant dataset (13+ places) for Ha Giang / destinations in `ai-planner.ts` and `TripPlanner.tsx`. Eliminated generic "Điểm tham quan đặc sắc" fallback strings completely in favor of smart unique selection (`getSmartUniqueItem`).
- [2026-07-29] Created 17-layer ParallaxHero 3D component (`frontend/src/components/ui/parallax-hero.tsx`) and integrated it into the Empty State section of Lập kế hoạch du lịch (`frontend/src/features/trips/TripPlanner.tsx`).
- [2026-07-29] Redesigned ParallaxHero component styling to light-themed Terraholic brand palette (`bg-sky-50`, blue vignette overlay, blue gradient typography `from-blue-700 via-sky-500 to-indigo-600`, and frosted glass subtitle badge).
- [2026-07-29] Scaled down ParallaxHero layers to fit 500px container bounds and set text container zIndex to `z-[10]` so the giant HERO/TERRAHOLIC title sits embedded behind foreground mountain layers.
- [2026-07-29] Restructured ParallaxHero 3D Depth text (`zIndex: 4`, `text-[5.5rem] md:text-[7.5rem] lg:text-[8.5rem] text-white/90 drop-shadow-[0_20px_40px_rgba(0,0,0,0.8)]`), updated `defaultLayers` scale and z-index hierarchy (layers 5-18 in front), and redesigned subtitle to a sleek frosted night badge (`bg-slate-950/60 backdrop-blur-md border-white/20`).
- [2026-07-29] Updated ParallaxHero Text block: elevated `zIndex` to `50` at `top: 38%` for 100% sharp visibility over mountain peaks, styled title with `text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-[0.25em]` and high-contrast frosted glass description card (`bg-slate-950/80 backdrop-blur-xl border-white/20`).
- [2026-07-29] Perfected ParallaxHero 3D Depth text (`zIndex: 4`, `text-5xl sm:text-6xl md:text-7xl lg:text-[5.2rem] tracking-[0.16em]`) with title edges (T and C) subtly tucked behind side mountain layers, paired with an ultra-thin glassmorphism Subtitle Badge (`bg-slate-900/40 backdrop-blur-md border-white/25`) featuring a pulsing sky-400 indicator.
- [2026-07-29] Adjusted ParallaxHero title `zIndex` to `14` (`text-[4.8rem]`, `tracking-[0.08em]`) so letter 'E' to 'I' are 100% visible with only the tip of 'T' subtly tucked, and separated Subtitle Badge into its own container at `zIndex: 30` (`top: 55%`) for 100% unobstructed readability over mountain peaks.
- [2026-07-29] Scaled down TERRAHOLIC title font size by ~0.25 to `lg:text-[5.75rem]` (`text-4xl sm:text-5xl md:text-6xl`) in `parallax-hero.tsx` for optimal visual balance.
- [2026-07-29] Redesigned Subtitle Badge in `parallax-hero.tsx` with premium Cyber Glassmorphism styling (`bg-slate-950/65 backdrop-blur-2xl`, glowing `border-sky-400/25`, gradient sky typography, and interactive hover glow effects).