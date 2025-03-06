import { z } from "zod";
import { SystemMessage, UserMessage } from "beeai-framework/backend/message";
import { CHAT_MODEL } from "../config.js";
import { ChatModel } from "beeai-framework/backend/chat";
import { Input, Output } from "./agent-info.js";
import { runFn } from "../helpers.js";

export const run: runFn<Input, Output> = async ({ input, signal }) => {
  const { text } = input;

  const model = await ChatModel.fromName(CHAT_MODEL);

  const podcastResponse = await model.create({
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

  return {
    text: JSON.stringify(finalReponse.object),
    logs: [],
  };
};
