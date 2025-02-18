import express from "express";
import { McpServer } from "@agentcommunicationprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@agentcommunicationprotocol/sdk/server/sse.js";
import { Implementation } from "@agentcommunicationprotocol/sdk/types.js";
import { NodeSDK, resources } from "@opentelemetry/sdk-node";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";

export async function runAgentProvider(
  server: McpServer,
  opentelemetrySdk?: NodeSDK,
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    const port = parseInt(process.env.PORT ?? "8000");

    await new Promise<void>((resolve, reject) => {
      const server = app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
      });

      server.on("error", (err) => {
        reject(err);
      });

      const shutdownHandler = () => {
        server.close(() => {
          process.removeListener("SIGINT", shutdownHandler);
          resolve();
        });
      };

      process.on("SIGINT", shutdownHandler);
    });
  } finally {
    await sdk.shutdown().catch(() => {});
  }
}

await runAgentProvider(new McpServer({ name: "foo", version: "bar" }, {}));
