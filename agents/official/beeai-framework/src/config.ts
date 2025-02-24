import { parseModel } from "beeai-framework/backend/utils";

function parseChatModel(chatModel: string) {
  const { providerId, modelId } = parseModel(chatModel);
  return `${providerId}:${modelId}` as const;
}

export const CHAT_MODEL = process.env.CHAT_MODEL
  ? parseChatModel(process.env.CHAT_MODEL)
  : "ollama:llama3.1";
