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

export const agent = {
  name: "document-judge",
  description: "TBD Description",
  inputSchema,
  outputSchema,
  run,
  metadata: {
    title: "Document Judge",
    framework: "BeeAI",
    licence: "Apache 2.0",
    fullDescription: `TBD Full Description`,
    // avgRunTimeSeconds: 10,
    // avgRunTokens: 48,
    // ui: "chat",
  } satisfies Metadata,
};
