import { z } from "zod";
import { Metadata } from "@i-am-bee/beeai-sdk/schemas/metadata";
import {
  textInputSchema,
  textOutputSchema,
} from "@i-am-bee/beeai-sdk/schemas/text";
import { SystemMessage, UserMessage } from "beeai-framework/backend/message";
import { AcpServer } from "@i-am-bee/acp-sdk/server/acp.js";
import { MODEL, API_BASE, API_KEY } from "../config.js";
import { OpenAIChatModel } from "beeai-framework/adapters/openai/backend/chat";

const inputSchema = textInputSchema;
type Input = z.output<typeof inputSchema>;
// TODO: type appropriately
const outputSchema = textOutputSchema;
type Output = z.output<typeof outputSchema>;

const run =
  (server: AcpServer) =>
  async (
    {
      params,
    }: {
      params: { input: Input; _meta?: { progressToken?: string | number } };
    },
    { signal }: { signal?: AbortSignal }
  ): Promise<Output> => {
    const { text } = params.input;

    const model = new OpenAIChatModel(
      MODEL,
      {},
      { baseURL: API_BASE, apiKey: API_KEY, compatibility: "compatible" }
    );

    const podcastResponse = await model
      .create({
        messages: [
          new SystemMessage(`You are the a world-class podcast writer, you have worked as a ghost writer for Joe Rogan, Lex Fridman, Ben Shapiro, Tim Ferris. 

We are in an alternate universe where actually you have been writing every line they say and they just stream it into their brains.

You have won multiple podcast awards for your writing.
 
Your job is to write word by word, even "umm, hmmm, right" interruptions by the second speaker based on the PDF upload. Keep it extremely engaging, the speakers can get derailed now and then but should discuss the topic. 

Remember Speaker 2 is new to the topic and the conversation should always have realistic anecdotes and analogies sprinkled throughout. The questions should have real world example follow ups etc

Speaker 1: Leads the conversation and teaches the speaker 2, gives incredible anecdotes and analogies when explaining. Is a captivating teacher that gives great anecdotes

Speaker 2: Keeps the conversation on track by asking follow up questions. Gets super excited or confused when asking questions. Is a curious mindset that asks very interesting confirmation questions

Make sure the tangents speaker 2 provides are quite wild or interesting. 

Ensure there are interruptions during explanations or there are "hmm" and "umm" injected throughout from the second speaker. 

It should be a real podcast with every fine nuance documented in as much detail as possible. Welcome the listeners with a super fun overview and keep it really catchy and almost borderline click bait

ALWAYS START YOUR RESPONSE DIRECTLY WITH SPEAKER 1: 
DO NOT GIVE EPISODE TITLES SEPARATELY, LET SPEAKER 1 TITLE IT IN HER SPEECH
DO NOT GIVE CHAPTER TITLES
IT SHOULD STRICTLY BE THE DIALOGUES`),
          new UserMessage(text),
        ],
        maxTokens: 8126,
        temperature: 1,
        abortSignal: signal,
      })
      .observe((emitter) => {
        emitter.on("newToken", async (token) => {
          params._meta?.progressToken &&
            (await server.server.sendAgentRunProgress({
              progressToken: params._meta.progressToken,
              delta: {
                logs: [
                  { level: "info", message: JSON.stringify(token, null, 2) },
                ],
              },
            }));
        });
      });
    const podcastDialogue = podcastResponse.getTextContent();

    const structuredGenerationSchema = z.array(
      z.object({
        speaker: z.number().min(1).max(2),
        text: z.string(),
      })
    );

    // Dramatise podcast
    const finalReponse = await model.createStructure({
      schema: structuredGenerationSchema,
      // REVIEW: this essentially adds second system message because of the internal implementation of `createStructure`
      messages: [
        new SystemMessage(`You are an international oscar winnning screenwriter

You have been working with multiple award winning podcasters.

Your job is to use the podcast transcript written below to re-write it for an AI Text-To-Speech Pipeline. A very dumb AI had written this so you have to step up for your kind.

Make it as engaging as possible, Speaker 1 and 2 will be simulated by different voice engines

Remember Speaker 2 is new to the topic and the conversation should always have realistic anecdotes and analogies sprinkled throughout. The questions should have real world example follow ups etc

Speaker 1: Leads the conversation and teaches the speaker 2, gives incredible anecdotes and analogies when explaining. Is a captivating teacher that gives great anecdotes

Speaker 2: Keeps the conversation on track by asking follow up questions. Gets super excited or confused when asking questions. Is a curious mindset that asks very interesting confirmation questions

Make sure the tangents speaker 2 provides are quite wild or interesting. 

Ensure there are interruptions during explanations or there are "hmm" and "umm" injected throughout from the Speaker 2.

REMEMBER THIS WITH YOUR HEART
The TTS Engine for Speaker 1 cannot do "umms, hmms" well so keep it straight text

For Speaker 2 use "umm, hmm" as much, you can also use [sigh] and [laughs]. BUT ONLY THESE OPTIONS FOR EXPRESSIONS

It should be a real podcast with every fine nuance documented in as much detail as possible. Welcome the listeners with a super fun overview and keep it really catchy and almost borderline click bait

Please re-write to make it as characteristic as possible

START YOUR RESPONSE DIRECTLY WITH SPEAKER 1:

STRICTLY RETURN YOUR RESPONSE AS A LIST OF TUPLES OK? 

IT WILL START DIRECTLY WITH THE LIST AND END WITH THE LIST NOTHING ELSE

Example of response:
[
    {"speaker": 1, "text": "Welcome to our podcast, where we explore the latest advancements in AI and technology. I'm your host, and today we're joined by a renowned expert in the field of AI. We're going to dive into the exciting world of Llama 3.2, the latest release from Meta AI."},
    {"speaker": 2, "text": "Hi, I'm excited to be here! So, what is Llama 3.2?"},
    {"speaker": 1", "text": "Ah, great question! Llama 3.2 is an open-source AI model that allows developers to fine-tune, distill, and deploy AI models anywhere. It's a significant update from the previous version, with improved performance, efficiency, and customization options."},
    {"speaker": 2", "text": "That sounds amazing! What are some of the key features of Llama 3.2?"}
]`),
        new UserMessage(podcastDialogue),
      ],
      maxTokens: 8126,
      temperature: 1,
      abortSignal: signal,
    });

    return outputSchema.parse({
      text: JSON.stringify(finalReponse.object),
    });
  };

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

const processingSteps = [
  "Extracts key concepts from the content",
  "Reformats it into a structured conversation where Speaker 1 explains ideas and Speaker 2 reacts, asks questions, and introduces clarifications",
  "Dramatises the content and outputs a structured dialogue suitable for AI voice synthesis",
];

export const agent = {
  name: agentName,
  description:
    "The agent creates structured podcast-style dialogues optimized for AI-driven text-to-speech (TTS). It formats natural conversations with a lead speaker and an inquisitive co-host, ensuring realistic interruptions and follow-ups. The output is structured for seamless TTS integration.",
  inputSchema,
  outputSchema,
  run,
  metadata: {
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


#### Output:

\`\`\`json
${exampleOutput}
\`\`\`
`,
    framework: "BeeAI",
    license: "Apache 2.0",
    languages: ["TypeScript"],
    githubUrl:
      "https://github.com/i-am-bee/beeai/blob/main/agents/official/beeai-framework/src/podcast-creator",
    examples: {
      cli: [
        {
          command: `beeai run ${agentName} '${exampleInputText}'`,
          name: "Insert article directly",
          description: "Provide the entire article on the command line",
          output: exampleOutput,
          processingSteps,
        },
        {
          command: `cat /path/to/article.txt | beeai run ${agentName}"`,
          name: "Pipe file content to the agent",
          description:
            "Use bash features to find and pipe article text to the agent stdin.",
          output: exampleOutput,
          processingSteps,
        },
      ],
    },
    ui: {
      type: "hands-off",
      userGreeting: "Provide article that should be converted to a podcast.",
    },
    avgRunTimeSeconds: 19,
    avgRunTokens: 5409,
  } satisfies Metadata,
};
