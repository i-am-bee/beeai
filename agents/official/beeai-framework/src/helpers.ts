import { Metadata } from "@i-am-bee/beeai-sdk/schemas/metadata";
import { z } from "zod";

export type runFn<TInput, TOutput> = ({
  input,
  _meta,
  signal,
}: {
  input: TInput;
  _meta: any;
  signal?: AbortSignal;
}) => Promise<TOutput>;

export interface AgentInfo<TInput, TOutput> {
  name: string;
  description: string;
  inputSchema: z.AnyZodObject;
  outputSchema: z.AnyZodObject;
  run: runFn<TInput, TOutput>;
  metadata: Metadata;
}

export const runShim =
  (fn: runFn<any, any>) =>
  (
    {
      params,
    }: {
      params: { input: any; _meta?: any };
    },
    { signal }: { signal?: AbortSignal }
  ) => {
    const { input, _meta } = params;
    return fn({ input, _meta, signal });
  };
