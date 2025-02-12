import express from "express";
import { McpServer } from "@agentcommunicationprotocol/sdk/server/mcp";
import { SSEServerTransport } from "@agentcommunicationprotocol/sdk/server/sse";

export async function runAgentProvider(server: McpServer): Promise<void> {
  const app = express();

  let connected = false;
  app.get("/sse", async (req, res) => {
    if (connected) {
      res.status(400).send("Multiple connections at a time are not permitted");
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

  const port = parseInt(process.env.PORT ?? "3001");

  return new Promise((resolve, reject) => {
    app
      .listen(port, () => {
        console.log(`Server is running on port ${port}`);
      })
      .on("close", resolve)
      .on("error", (err) => reject(err));
  });
}
