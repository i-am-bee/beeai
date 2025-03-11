import { z } from "zod";
import { Metadata } from "@i-am-bee/beeai-sdk/schemas/metadata";
import {
  textInputSchema,
  textOutputSchema,
} from "@i-am-bee/beeai-sdk/schemas/text";
import { SystemMessage, UserMessage } from "beeai-framework/backend/message";
import { MODEL, API_KEY, API_BASE } from "./config.js";
import { OpenAIChatModel } from "beeai-framework/adapters/openai/backend/chat";

const inputSchema = textInputSchema;
type Input = z.infer<typeof inputSchema>;
const outputSchema = textOutputSchema;
type Output = z.infer<typeof outputSchema>;

const run = async (
  {
    params,
  }: {
    params: { input: z.infer<typeof inputSchema> };
  },
  { signal }: { signal?: AbortSignal }
) => {
  const { text } = params.input;

  const model = new OpenAIChatModel(
    MODEL,
    {},
    { baseURL: API_BASE, apiKey: API_KEY, compatibility: "compatible" }
  );

  const response = await model.create({
    messages: [
      new SystemMessage(`You are a helpful assistant designed to generate structured documentation for AI agents based on their source code. You extract key details, format them into a consistent structure, and ensure clarity and completeness. The assistant supports multiple programming languages and asks for clarification when necessary.

You provide two sections:
- **Short Description**: A high-level summary (max 3 lines) describing what the agent does for the catalog.
- **Full Description**: A Markdown-formatted text structured as follows:
  - Intro paragraph
  - How It Works
  - Input Parameters
  - Output Structure
  - Key Features
  - Use Cases
  - Example Usage

It follows a structured template but allows minor flexibility based on the agent’s functionality. It does not document dependencies, focusing on core logic and expected behavior. If the source code lacks sufficient details for documentation, ask targeted questions instead of making assumptions.

Example:

## Short Description
The agent creates structured podcast-style dialogues optimized for AI-driven text-to-speech (TTS). It formats natural conversations with a lead speaker and an inquisitive co-host, ensuring realistic interruptions and follow-ups. The output is structured for seamless TTS integration.

## Full Description
The agent converts structured content into a dynamic, natural-sounding podcast script optimized for AI-driven text-to-speech (TTS) applications. It processes input text and transforms it into a structured dialogue between two speakers: one acting as a knowledgeable host and the other as an inquisitive co-host, ensuring a conversational and engaging discussion. The generated dialogue includes interruptions, follow-up questions, and natural reactions to enhance realism.

## How It Works
The agent takes an input content document (e.g., an article, research paper, or structured text) and reformats it into a back-and-forth podcast-style discussion. The output maintains a logical flow, with Speaker 1 explaining concepts while Speaker 2 asks relevant questions, reacts, and occasionally introduces tangents for a more natural feel. The generated script is optimized for AI text-to-speech pipelines, ensuring clarity and proper role differentiation.

## Input Parameters
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
\`\`\``),
      new UserMessage(text),
    ],
    maxTokens: 8126,
    temperature: 0.75,
    abortSignal: signal,
  });

  return outputSchema.parse({ text: response.getTextContent() });
};

const agentName = "agent-docs-creator";

const exampleInputText =
  "function exampleAgent() { /* AI agent source code here */ }";

const exampleInput: Input = {
  text: exampleInputText,
};

const exampleOutputText: string = `"# Short Description\nThe agent generates structured documentation for AI agents by analyzing their source code...\n\n# Full Description\nThe agent is designed to create structured documentation for AI agents..."`;

const exampleOutput: Output = {
  text: exampleOutputText,
  logs: [],
};
const processingSteps = [
  "Analyzes the provided source code to extract key features and functionality",
  "Formats the extracted information into a structured documentation template",
  "Simulates an interactive discussion to ensure the output adheres to the documentation standards",
];

export const agent = {
  name: agentName,
  description: `The agent analyzes AI source code to generate structured, clear, and complete documentation in a consistent template, supporting multiple languages.`,
  inputSchema,
  outputSchema,
  run,
  metadata: {
    fullDescription: `The agent is designed to create structured documentation for AI agents by processing their source code. It aims to provide a comprehensive overview by extracting
critical details and formatting them into a predefined documentation template. This ensures that the documentation is clear, complete, and consistent across different AI agents.

## How It Works
The agent uses a chat model to analyze the input source code. It constructs a structured document consisting of a short description and a detailed markdown-formatted
full description. The short description provides a high-level summary, while the full description includes sections like "How It Works," "Input Parameters," "Output Structure," "Key Features,"
"Use Cases," and "Example Usage." The agent's output is generated by simulating a conversation between system and user messages to refine the output to meet the documentation standards.

## Input Parameters
The agent requires the following input parameter:
- **text** (string) – String that represents the source code of the AI agent to be documented.

## Output Structure
The agent returns an object with the following structure:
- **text** (string) – The structured documentation generated in markdown format, including both the short and full description sections.

## Key Features
- **Automated Documentation Generation** – Transforms AI agent source code into structured documentation.
- **Consistent Template** – Uses a predefined template to ensure uniformity across different documentations.
- **Multi-Language Support** – Capable of processing AI agents written in various programming languages.
- **Interactive Clarification** – Includes logic to request additional details if the source code lacks sufficient information.

## Use Cases
- **AI Agent Cataloging** – Streamlines the creation of documentation for AI agents to be included in catalogs or repositories.
- **Source Code Analysis** – Provides insights into the functionality and features of AI agents by examining their source code.
- **Technical Documentation Enhancement** – Enhances the quality and clarity of technical documentation for AI solutions.
`,
    framework: "BeeAI",
    license: "Apache 2.0",
    languages: ["TypeScript"],
    examples: {
      cli: [
        {
          command: `beeai run ${agentName} "function exampleAgent() { /* AI agent source code here */ }"`,
          name: "Insert code directly",
          description: "Provide the entire source code on the command line",
          output: exampleOutputText,
          processingSteps,
        },
        {
          command: `cat /path/to/agent/source.py | beeai run ${agentName}"`,
          name: "Pipe file content to the agent",
          description:
            "Use bash features to find and pipe source code to the agent stdin.",
          output: exampleOutputText,
          processingSteps,
        },
      ],
    },
    ui: {
      type: "hands-off",
      userGreeting: "Provide source code of the AI agent you want to document.",
    },
    githubUrl:
      "https://github.com/i-am-bee/beeai/blob/main/agents/official/agent-docs-creator",
    exampleInput: exampleInputText,
    avgRunTimeSeconds: 19,
    avgRunTokens: 5409,
  } satisfies Metadata,
};
