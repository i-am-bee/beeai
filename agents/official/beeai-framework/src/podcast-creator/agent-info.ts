import {
  textInputSchema,
  textOutputSchema,
} from "@i-am-bee/beeai-sdk/schemas/text";
import { z } from "zod";
import { run } from "./run.js";
import { AgentInfo } from "../helpers.js";

const inputSchema = textInputSchema;
export type Input = z.output<typeof inputSchema>;
// TODO: type appropriately
const outputSchema = textOutputSchema;
export type Output = z.output<typeof outputSchema>;

const agentName = "podcast-creator";

const exampleInputText =
  "Artificial intelligence is revolutionizing industries by automating complex tasks, improving efficiency, and enabling data-driven decision-making. In healthcare, AI is helping doctors diagnose diseases earlier and personalize treatments...";

const exampleInput: Input = {
  text: exampleInputText,
};

const exampleOutput = `[
  {"speaker": 1, "text": "Artificial intelligence is changing how industries operate by automating complex tasks and improving efficiency."},
  {"speaker": 2, "text": "Whoa, that’s huge! Umm... but what exactly do you mean by automating complex tasks?"},
  {"speaker": 1, "text": "Good question! Take healthcare, for example. AI helps doctors diagnose diseases earlier and personalize treatments based on patient data."},
  {"speaker": 2, "text": "[laughs] That’s pretty wild! So, does that mean AI will replace doctors?"},
  {"speaker": 1, "text": "Not quite! AI is more like an assistant, helping doctors make better decisions rather than replacing them."}
]`;

export const agent: AgentInfo<Input, Output> = {
  name: agentName,
  description:
    "The agent creates structured podcast-style dialogues optimized for AI-driven text-to-speech (TTS). It formats natural conversations with a lead speaker and an inquisitive co-host, ensuring realistic interruptions and follow-ups. The output is structured for seamless TTS integration.",
  inputSchema,
  outputSchema,
  run,
  metadata: {
    framework: "BeeAI",
    license: "Apache 2.0",
    languages: ["TypeScript"],
    githubUrl:
      "https://github.com/i-am-bee/beeai/blob/main/agents/official/beeai-framework/src/podcast-creator",
    exampleInput: exampleInputText,
    avgRunTimeSeconds: 19,
    avgRunTokens: 5409,
    fullDescription: `The agent converts structured content into a dynamic, natural-sounding podcast script optimized for AI-driven text-to-speech (TTS) applications. It processes input text and transforms it into a structured dialogue between two speakers: one acting as a knowledgeable host and the other as an inquisitive co-host, ensuring a conversational and engaging discussion. The generated dialogue includes interruptions, follow-up questions, and natural reactions to enhance realism.
    
## How It Works
The agent takes an input content document (e.g., an article, research paper, or structured text) and reformats it into a back-and-forth podcast-style discussion. The output maintains a logical flow, with Speaker 1 explaining concepts while Speaker 2 asks relevant questions, reacts, and occasionally introduces tangents for a more natural feel. The generated script is optimized for AI text-to-speech pipelines, ensuring clarity and proper role differentiation.

## Input Parameters
The agent requires the following input parameters:
- **text** (string) – The full content or topic material to be converted into a podcast dialogue.

## Output Structure
The agent returns a structured JSON list representing the podcast conversation:

- **speaker** (number) – Identifies the speaker (1 or 2).
- **text** (string) – The spoken dialogue corresponding to each speaker.\

## Key Features
- **Content-to-Podcast Conversion** – Transforms structured text into a natural two-speaker conversation.
- **Optimized for AI TTS** – Ensures readability and coherence for AI voice synthesis.
- **Contextual Interruptions & Reactions** – Simulates realistic dialogue flow, including clarifications, excitement, and pauses.
- **Speaker Role Differentiation** – Ensures Speaker 1 leads the discussion while Speaker 2 maintains curiosity and engagement.

## Use Cases

- **Podcast Automation** – Converts written content into structured dialogue for AI-generated podcasts.
- **Text-to-Speech Enhancement** – Creates AI-friendly scripts with proper pacing and interruptions.
- **Conversational Content Adaptation** – Reformats structured information into engaging discussions.

## Example Usage

### Example 1: Converting an Article into a Podcast

#### CLI:
\`\`\`bash
beeai run ${agentName} "${exampleInputText}"
\`\`\`

#### Processing Steps:

1. Extracts key concepts from the content.
2. Reformats it into a structured conversation where Speaker 1 explains ideas and Speaker 2 reacts, asks questions, and introduces clarifications.
3. Dramatises the content and outputs a structured dialogue suitable for AI voice synthesis.

#### Output:

\`\`\`json
${exampleOutput}
\`\`\`
`,
  },
};
