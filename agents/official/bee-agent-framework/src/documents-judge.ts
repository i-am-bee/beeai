import { z } from "zod";
import { ChatModel } from "bee-agent-framework/backend/chat";
import {
  SystemMessage,
  UserMessage,
} from "bee-agent-framework/backend/message";
import { Metadata } from "@i-am-bee/beeai-sdk/schemas/metadata";
import {
  promptInputSchema,
  promptOutputSchema,
} from "@i-am-bee/beeai-sdk/schemas/prompt";

const inputSchema = promptInputSchema.extend({
  documents: z.array(z.string()).default([]),
});
const outputSchema = promptOutputSchema;

const criteria = [
  "correctness",
  "depth_and_coverage",
  "clarity_and_structure",
  "relevance",
] as const;
type Criteria = (typeof criteria)[number];

const structuredGenerationSchema = z.object(
  Object.fromEntries(criteria.map((c) => [c, z.number().min(0).max(1)])) as {
    [key in Criteria]: z.ZodNumber;
  }
);

// Define weighting for each evaluation criterion (using weighted average),
// make sure the sum of the weights equals 1
type Weights = { [key in Criteria]: number };
const weights: Weights = {
  correctness: 0.5,
  depth_and_coverage: 0.1,
  clarity_and_structure: 0.1,
  relevance: 0.3,
};

const EVALUATION_PROMPT = `Evaluate the quality of the generated document based on multiple criteria using a continuous scale from 0 (lowest quality) to 1 (highest quality). For each criterion, provide a numerical score (0-1):
- correctness: Assess whether the information is factually accurate based on reliable, authoritative sources. Penalize factual errors, misinterpretations, or unverified claims. Prioritize primary sources and well-established research when cross-checking.
- depth_and_coverage: Evaluate whether the document provides a comprehensive and well-rounded discussion of the topic. Consider whether key aspects are addressed, nuances are explored, and supporting evidence is provided. Compare the breadth and depth of the information against expectations for the topic.
- clarity_and_structure: Assess how well the document is organized. Check for logical flow, appropriate use of headings, bullet points, summaries, and coherence. Consider whether the language is clear, precise, and accessible to the intended audience.
- relevance: Measure the alignment between the document and the given research prompt or problem. Determine if the content remains focused on relevant aspects, avoiding tangents, unnecessary details, or off-topic discussions.`;

const calculateScore = (result: Weights) =>
  // Multiply by 100 and round to avoid floating precision problem when comparing
  Math.round(
    criteria.reduce((sum, key) => sum + result[key] * weights[key] * 100, 0)
  );

const run = async ({
  params,
}: {
  params: { input: z.infer<typeof inputSchema> };
}) => {
  const { prompt, documents } = params.input;
  if (documents.length === 0) return { text: "No documents provided." };

  const model = await ChatModel.fromName("ollama:llama3.1");

  const results = await Promise.all(
    documents.map((document) =>
      // TODO: add progress update
      model.createStructure({
        schema: structuredGenerationSchema,
        messages: [
          // REVIEW: this essentially adds second system message because of the internal implementation of `createStructure`
          new SystemMessage(EVALUATION_PROMPT),
          new UserMessage(
            `Research prompt: ${prompt}\n\n Document: ${document}`
          ),
        ],
      })
    )
  );

  const scores = results.map((result) => calculateScore(result.object));
  const highestValueIndex = scores.reduce(
    (maxIndex, score, index, arr) => (score > arr[maxIndex] ? index : maxIndex),
    0
  );

  return {
    text: documents[highestValueIndex],
  };
};

const exampleInput = `{
  "prompt": "Explain the impact of AI on modern software engineering.",
  "documents": [
    "Artificial Intelligence has transformed software engineering by automating code generation, improving debugging processes, and enabling intelligent software design patterns...",
    "AI plays a role in modern development, but traditional methods remain the most reliable...",
    "The impact of AI in software engineering is minimal, and automation is overestimated..."
  ]
}`;

const exampleOutput = `{
  "text": "Artificial Intelligence has transformed software engineering by automating code generation, improving debugging processes, and enabling intelligent software design patterns..."
}`;

export const agent = {
  name: "documents-judge",
  description:
    "Evaluates multiple documents based on correctness, depth, clarity, and relevance, selecting the highest-scoring one. It ensures optimal document quality for research, content validation, and knowledge refinement.",
  inputSchema,
  outputSchema,
  run,
  metadata: {
    title: "Documents Judge",
    fullDescription: `The Documents Judge agent evaluates multiple documents based on four key criteria — correctness, depth & coverage, clarity & structure, and relevance. It assigns a numerical score (0-1) to each document for each criterion, using a weighted average to determine the highest-scoring document. The agent is particularly useful for research, content validation, and knowledge refinement, ensuring that the most accurate, comprehensive, well-structured, and relevant document is selected.

## Evaluation Criteria:

1. **Correctness (50%)** – Assesses factual accuracy, penalizing misinformation.
2. **Depth & Coverage (10%)** – Measures how well the document explores key aspects of the topic.
3. **Clarity & Structure (10%)** – Evaluates logical organization and readability.
4. **Relevance (30%)** – Determines how well the document aligns with the given research prompt.

The agent uses Llama 3.1 8B model to perform structured evaluations and selects the best document based on the weighted scores.

## Example usage

### Input:
\`\`\`json
${exampleInput}
\`\`\`

### CLI:
\`\`\`bash
beeai agent run documents-judge '${exampleInput}'
\`\`\`


### Processing:\

1. The agent evaluates all three documents based on the four criteria.
2. Each document receives a score for correctness, depth, clarity, and relevance.
3. The agent selects the document with the highest weighted score.

### Output:

\`\`\`json
${exampleOutput}
\`\`\`

In this example, the first document is chosen because it is factually accurate, well-structured, and relevant to the research prompt.
`,
    framework: "BeeAI",
    licence: "Apache 2.0",
    avgRunTimeSeconds: 22,
    avgRunTokens: 1229,
  } satisfies Metadata,
};
