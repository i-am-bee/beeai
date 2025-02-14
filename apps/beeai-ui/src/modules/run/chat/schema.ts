export const CHAT_REQUIRED_SCHEMA = {
  inputSchema: {
    type: 'object',
    properties: {
      prompt: {
        type: 'string',
      },
    },
    required: ['prompt'],
    additionalProperties: false,
  },
  outputSchema: {
    type: 'object',
    properties: {
      text: {
        type: 'string',
      },
    },
    required: ['text'],
  },
};
