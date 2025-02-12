import http from "node:http";
import express from "express";
import { createTerminus } from "@godaddy/terminus";
import { McpServer } from "@agentcommunicationprotocol/sdk/server/mcp";
import { SSEServerTransport } from "@agentcommunicationprotocol/sdk/server/sse";
import { Implementation } from "@agentcommunicationprotocol/sdk/types";
import { NodeSDK, resources } from "@opentelemetry/sdk-node";
import { trace, SpanStatusCode } from "@opentelemetry/api";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";

export async function runAgentProvider(
  server: McpServer,
  opentelemetrySdk?: NodeSDK
): Promise<void> {
  const { name, version } = (server.server as any)
    ._serverInfo as Implementation;
  const sdk =
    opentelemetrySdk ??
    new NodeSDK({
      resource: new resources.Resource({
        [ATTR_SERVICE_NAME]: name,
        [ATTR_SERVICE_VERSION]: version,
      }),
    });
  sdk.start();
  try {
    await trace
      .getTracer("beeai-sdk")
      .startActiveSpan("agent-provider", async (span) => {
        try {
          const app = express();

          let connected = false;
          app.get("/sse", async (req, res) => {
            if (connected) {
              res
                .status(400)
                .send("Multiple connections at a time are not permitted");
              return;
            }
            connected = true;
            res.on("close", () => {
              connected = false;
            });

            const transport = new SSEServerTransport("/messages", res);
            app.post("/messages", async (req, res) => {
              await transport.handlePostMessage(req, res);
            });
            await server.connect(transport);
          });

          return await new Promise<void>((resolve, reject) => {
            const port = parseInt(process.env.PORT ?? "8000");
            const httpServer = http.createServer(app);
            createTerminus(httpServer, {
              signals: ["SIGINT", "SIGTERM"],
              beforeShutdown: async () => {
                resolve();
              },
            });
            httpServer
              .listen(port, () => {
                console.log(`Server is running on port ${port}`);
              })
              .on("close", resolve)
              .on("error", (err) => reject(err));
          });
        } catch (err) {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: err instanceof Error ? err.message : undefined,
          });
          throw err;
        } finally {
          span.end();
        }
      });
  } finally {
    await sdk.shutdown();
  }
}
