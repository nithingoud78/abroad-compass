# Embedded AI Architecture

## Concept Overview

The Embedded AI architecture abandons the traditional "conversational chatbot" paradigm. Instead, AI is injected directly into specific UI components, acting as a highly contextual, data-aware reasoning engine. It operates invisibly on the server and presents results via clean, structured UI elements (such as summary cards or recommendation alerts) rather than a chat log.

## Core Architectural Pillars

### 1. Server-Side Execution (`createServerFn`)

All AI generation happens securely on the server using TanStack Start's `createServerFn`.
**Advantages:**

- **Security:** API keys and provider configurations never reach the client bundle.
- **Authentication:** All AI functions are protected by the `requireSupabaseAuth` middleware.
- **Data Integrity:** Inputs are strictly typed and sanitized using `zod` validators before reaching the AI model.

### 2. Context-First Prompts

AI is never asked generic questions. Instead, it is fed hard data (JSON serialized state) from the application and asked to perform a specific analysis.
**Example Workflow (Budget Analysis):**

1. User clicks "Analyze Budget".
2. Client sends current budget `entries`, `goals`, and `totals` as JSON to the server.
3. Server prompts the model: _"You are a financial advisor. Analyze this budget data. Provide 3 bullet points: Overspending warning, Saving suggestion, Monthly forecast."_
4. Client renders the 3 bullet points natively in the UI.

### 3. Provider Abstraction

The underlying AI provider is abstracted via `src/lib/ai/provider.server.ts`.

- It currently supports free-tier providers like **Google AI Studio (Gemini)** and **OpenRouter**.
- The `ai` SDK from Vercel is used under the hood to standardize the output format (via `generateText`), making it trivial to swap providers dynamically without changing the business logic.

## Technical Implementation Details

### Centralized Functions Hub

All AI-related server functions are housed in `src/lib/ai/ai.functions.ts`.
Key functions include:

- `getUniversityRecommendation`
- `getUniversityComparison`
- `getBudgetAnalysis`
- `getDashboardSummary`
- `getCheckinAnalysis`
- `getJourneyAnalysis`
- `getDocumentAnalysis`
- `getPortfolioAnalysis`

### Client Consumption

Client components consume these functions using the `useServerFn` hook from TanStack React-Start.

```tsx
import { useServerFn } from "@tanstack/react-start";
import { getBudgetAnalysis } from "@/lib/ai/ai.functions";

function BudgetPage() {
  const analyzeFn = useServerFn(getBudgetAnalysis);
  const [analysis, setAnalysis] = useState<string | null>(null);

  async function handleAnalyze() {
    const res = await analyzeFn({ data: { entries, totals, goals } });
    setAnalysis(res.analysis);
  }
}
```

## UI/UX Guidelines for Embedded AI

1. **Explicit Invocation:** AI should generally be triggered by a user action (e.g., clicking a "Sparkles" button) to conserve tokens and prevent jarring UI shifts, unless the data is small enough for background execution (like the dashboard summary).
2. **Clear Separation:** AI insights must be visually distinct from definitive database records (e.g., placed inside a slightly tinted, branded panel with an AI icon).
3. **Graceful Degradation:** If the AI provider is unavailable, the application must function flawlessly. The AI is an enhancement, not a dependency.
