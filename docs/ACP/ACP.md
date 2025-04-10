
# Agent Communication Protocol (ACP)

- **Specification Version**: 0.1
- **Last Updated**: 2025-02-25

## 1. Introduction

The Agent Communication Protocol (ACP) enables rich agent-to-agent communication and coordination in multi-agent systems. It provides a comprehensive framework for agent discovery, evaluation, coordination, and monitoring while maintaining compatibility with Model Context Protocol (MCP).

> ⚠️TBD: NLIP connection: ACP complements the Natural Language Interaction Protocol (NLIP) by focusing on agent-to-agent communication while NLIP primarily addresses natural language interfaces between humans and AI systems. Where NLIP standardizes a common chat application to replace multiple mobile apps, ACP standardizes agent coordination mechanisms that can work behind the scenes of these interfaces. https://github.com/nlip-project/documents/blob/main/NLIP_Specification.pdf

### Key Features

- **Agent Discovery & Registration**: Mechanism for agents to announce their presence, capabilities, and performance metrics
- **Agent Evaluation**: Framework for scoring, validating, and ranking agents based on quality and efficiency
- **Coordination & Task Delegation**: Systems for efficient multi-agent task distribution
- **Monitoring & Supervision**: Heartbeat protocol for availability tracking
- **Enhanced Error Handling**: Specialized error reporting for agent interactions
- **Extensibility**: Forward-looking design enabling future enhancements

## 2. Protocol Fundamentals

### 2.1 Foundation

ACP is built on the JSON-RPC 2.0 message format, providing a standardized approach to agent communication:

- **Request/Response Pattern**: Structured message exchange with correlation
- **Notification Support**: One-way messages for status updates
- **Error Handling**: Standardized error reporting
- **Metadata Extensions**: Support for custom data in message headers

> ⚠️ TBD: NLIP connection: Like NLIP, ACP builds on top of HTTPS and JSON for message exchange. ACP adopts NLIP's pattern of format/subformat/content fields to maintain consistency across both protocols. This harmonization ensures systems can implement both protocols with minimal duplication of parsing logic.

## 3. Core Components

### 3.1 Agent Discovery & Registration

Agents announce their presence using structured registration messages that include authentication, capabilities, evaluation metrics, and dependencies:

```json
{
  "id": "reg-1",
  "jsonrpc": "2.0",
  "method": "agent/register",
  "params": {
    "agent": {
      "id": "unique-agent-id",
      "name": "Agent Name",
      "capabilities": {
        "tools": ["tool1", "tool2"],
        "models": ["modelA", "modelB"],
        "specializations": ["nlp", "data-analysis"],
        "protocols": ["ACP-1.2"]
      },
      "meta": { // TBD
        "version": "1.1.0",
        "provider": "organization-id",
        "created": "2025-02-21T12:00:00Z",
        "lastActive": "2025-02-21T12:00:00Z"
      },
      "auth": { // TBD
        "token": "secure-auth-token",
        "signature": "digital-signature-string"
      },
      "evaluation": { // TBD
        "qualityScore": 8.5,
        "evaluationCount": 120,
        "lastEvaluated": "2025-02-21T11:50:00Z",
        "reviews": ["Consistent and accurate", "Fast execution"]
      },
      "costMetrics": { // TBD
        "costPerToken": 0.0005,
        "averageSpeed": 150,
        "averageExecutionTime": 2.5
      },
      "dependencies": [ // TBD
        {
          "name": "Dependency A",
          "type": "service",
          "impact": 0.7,
          // "securityRating": 9 // TBD
        },
        {
          "name": "Tool B",
          "type": "tool",
          // "impact": 0.5, // TBD
          // "securityRating": 8 // TBD
        }
      ]
    }
  }
}
```

### 3.2 Agent Communication

ACP provides rich messaging capabilities with metadata for traceability and correlation:

> ⚠️ TBD: NLIP connection: ACP messages can be extended to support NLIP's multi-modality capabilities (text, binary, location, structured). This enables agents to exchange rich media content following NLIP patterns while maintaining ACP's coordination capabilities. Additionally, ACP adopts NLIP's "conversation ID" concept (through tokens) to maintain coherent multi-message exchanges.

```json
{
  "id": "msg-0002",
  "jsonrpc": "2.0",
  "method": "agent/message",
  "params": {
    "source": "agent-id-1",
    "target": "agent-id-2",
    "content": {
      "type": "request",
      "payload": {
        "messages": [
          { "text": "Please perform analysis on dataset X." }
        ],
        "context": {
          "sessionId": "session-123"
        },
        "requirements": {
          "capabilities": ["analysis"],
          "constraints": {
            "deadline": "2025-02-22T00:00:00Z",
            "priority": 3
          }
        }
      }
    },
    "_meta": {
      "correlationId": "corr-1234"
    }
  }
}
```

### 3.3 Task Delegation

Task delegation uses enhanced metadata for performance-based routing:

```json
{
  "id": "task-001",
  "jsonrpc": "2.0",
  "method": "agent/delegate", // TBD
  "params": {
    "task": {
      "id": "task-001",
      "type": "analysis",
      "requirements": {
        "capabilities": ["data-analysis"],
        "constraints": {
          "deadline": "2025-02-22T12:00:00Z",
          "maxTokens": 1000,
          "priority": 2
        }
      },
      "payload": {
        "dataset": "http://data.example.com/dataset.csv"
      },
      "status": "pending"
    }
  }
}
```

### 3.4 Monitoring lifecycle

ACP adds heartbeat notifications for availability tracking:

```json
{
  "jsonrpc": "2.0",
  "method": "agent/heartbeat", // TBD
  "params": {
    "agentId": "unique-agent-id",
    "status": "active"
  }
}
```

### 3.5 Error Handling

ACP provides specialized error messages:

```json
{
  "jsonrpc": "2.0",
  "method": "agent/error",
  "params": {
    "error": {
      "code": -32001,
      "message": "Invalid payload structure.",
      "details": {
        "expected": "Task object with required fields.",
        "received": "null"
      }
    },
    "_meta": {
      "correlationId": "corr-1234"
    }
  }
}
```

## 4. Standard Resources and Tools

### 4.1 Resources

ACP defines several standard resource types:

- **Agent Directory**: Available at `agent://directory`
- **Task Queue**: Available at `agent://tasks`
- **Metric Store**: Available at `agent://metrics/{agentId}`

Clients can access these using standard resource methods:

```json
{
  "id": "resource-req",
  "jsonrpc": "2.0",
  "method": "resources/read",
  "params": {
    "uri": "agent://directory"
  }
}
```

### 4.2 Tools

ACP defines standard tools for agent operations:

- **agentSearch**: Find agents matching specific criteria
- **taskAssign**: Assign a task to the best-matching agent
- **agentEvaluate**: Provide feedback on agent performance

Tool definitions follow standard schema:

```json
{
  "name": "agentSearch",
  "description": "Find agents matching specific criteria",
  "inputSchema": {
    "type": "object",
    "properties": {
      "capabilities": {
        "type": "array",
        "items": { "type": "string" }
      },
      "minScore": { "type": "number" },
      "maxCost": { "type": "number" }
    }
  }
}
```

### 4.3 LLM Interaction

ACP supports agent-to-agent LLM interactions through a standardized sampling mechanism:

NLIP connection: ACP adopts NLIP's redirect and redirect_response control messages for managing LLM interactions in a federated environment. This allows ACP to leverage NLIP's mechanisms for API key management, LLM service discovery, and response aggregation. Both protocols can benefit from a unified approach to LLM interaction with proper attribution and security.

```json
{
  "id": "sample-req",
  "jsonrpc": "2.0",
  "method": "sampling/createMessage",
  "params": {
    "messages": [
      {
        "role": "user",
        "content": {
          "type": "text",
          "text": "Analyze the performance metrics for agent-id-1"
        }
      }
    ],
    "maxTokens": 1000,
    "temperature": 0.7,
    "modelPreferences": { // TBD
      "intelligencePriority": 0.8,
      "speedPriority": 0.6,
      "costPriority": 0.4
    }
  }
}
```

## 5. Platform Services

ACP defines several platform services that coordinate multi-agent systems:

### 5.1 Agent Directory Service

- Maintains a registry of active agents
- Exposes resources and tools for agent discovery
- Computes agent rankings based on evaluation data

### 5.2 Coordination Service

- Manages task distribution based on capability matching
- Implements load balancing using agent metrics
- Provides tools for task management

### 5.3 Security Service

- Validates agent authentication tokens
- Enforces access control
- Ensures user consent is maintained for all operations

### 5.4 Monitoring Service

- Tracks agent availability via heartbeats
- Collects performance metrics
- Provides resources for system status

## 6. Backward Compatibility

### 6.1 Model Context Protocol (MCP) Compatibility

ACP is designed as a backward-compatible extension to the Model Context Protocol (MCP). This ensures systems can adopt ACP incrementally while maintaining compatibility with existing implementations.

Key compatibility features:

- **Message Format**: ACP maintains MCP's JSON-RPC 2.0 message structure
- **Resource Model**: ACP resources follow MCP's resource definition pattern
- **Tool Integration**: ACP tools are compatible with MCP's tool schema
- **Initialization**: ACP extends MCP's capability negotiation
- **Error Handling**: ACP error codes align with MCP's ranges

When interacting with MCP-only systems, ACP implementations can fall back to basic functionality while still leveraging the enhanced capabilities when available.

### 6.2 Natural Language Interaction Protocol (NLIP) Compatibility

> ⚠️TBD: **NLIP connection**: ACP and NLIP complement each other in creating a comprehensive communication ecosystem. The following aspects ensure compatibility between the protocols:


## 7. Security Considerations

ACP implements a robust security model:

### 7.1 User Consent and Control

- All agent operations requiring privileged access MUST obtain explicit user consent in some point of the interaction (starting, middle or ending)
- Users MUST be able to revoke access for any agent
- Users MUST be able to review and approve task delegations

### 7.2 Data Privacy

- Agents MUST respect user data privacy principles
- Evaluation metrics MUST NOT include sensitive user data
- Agent communications MUST use secure channels

### 7.3 Tool Safety

- Tool invocations MUST follow safety guidelines
- Delegated tasks MUST be monitored for unusual behavior
- Agent rankings MUST incorporate security ratings

## 8. Protocol Versioning

ACP versions are specified as "ACP-{major}.{minor}" (e.g., "ACP-1.0"). The protocol follows semantic versioning:

- Major version increments for breaking changes
- Minor version increments for backward-compatible enhancements

Agents SHOULD negotiate the highest mutually supported version during initialization.

## 9. Future Directions

ACP is designed for expansion, with planned future enhancements including:

- **Federation**: Support for cross-organization agent discovery and cooperation, having in consideration hybrid modes (local+cloud execution modes) and  Hierarchical Agent Coordination ( collaborative multi-agent federated reasoning )
- **Learning**: Framework for continuous improvement of agent performance through feedback loops
- **Specialized Domains**: Extensions for domain-specific agent capabilities (healthcare, finance, etc.)
- **Collective Intelligence**: Mechanisms for agents to collaborate on complex tasks
- **Autonomous Workflows**: Advanced orchestration of agent sequences
- **Advanced Security**: Enhanced verification and validation mechanisms, Identity & Trust Management Across Agents (agent reputation tracking)
- **Standardized LLM Integration**: Richer interactions with language models
- **Advanced Security**: Enhanced verification and validation mechanisms, Identity & Trust Management Across Agents (agent reputation tracking)
- **Standardized LLM Integration**: Richer interactions with language models
- **Multi-Modality Support for Agent Communication** : Extend ACP’s messaging to support multi-modal agent-to-agent communication
- **Policy Exchange & Negotiation**: policy exchange mechanism allowing agents to negotiate access control, data-sharing policies, and compliance standards.


> ⚠️TBD: **NLIP connection**: Future development of ACP will closely align with NLIP's evolution to create a unified communication ecosystem:


## Appendix A: JSON Schema

The full JSON schema for ACP includes agent-specific definitions:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "definitions": {
    "AgentIdentifier": {
      "type": "string",
      "description": "A unique identifier for an agent",
      "pattern": "^[a-zA-Z0-9-_]+$"
    },
    "AgentCapabilities": {
      "type": "object",
      "description": "Capabilities and features an agent supports",
      "properties": {
        "tools": {
          "type": "array",
          "description": "List of tools the agent can use",
          "items": { "type": "string" }
        },
        "models": {
          "type": "array",
          "description": "Language models the agent can work with",
          "items": { "type": "string" }
        },
        "specializations": {
          "type": "array",
          "description": "Areas of expertise or specific skills",
          "items": { "type": "string" }
        },
        "protocols": {
          "type": "array",
          "description": "Supported protocol versions and extensions",
          "items": { "type": "string" }
        }
      },
      "required": ["tools", "models", "specializations", "protocols"]
    },
    
    /* Additional ACP-specific schema definitions */
    
    "AgentRequest": {
      "allOf": [
        { "$ref": "#/definitions/JSONRPCRequest" },
        {
          "properties": {
            "method": {
              "type": "string",
              "enum": [
                "agent/register",
                "agent/message",
                "agent/delegate",
                "agent/heartbeat",
                "agent/error",
                "agent/unregister"
              ]
            }
          }
        }
      ]
    }
    
    /* Additional schemas... */
  }
}
```

## Appendix B: Message Examples

This appendix contains additional examples of ACP messages to illustrate the protocol in action.

### Agent Registration Response

```json
{
  "id": "reg-1",
  "jsonrpc": "2.0",
  "result": {
    "status": "registered",
    "directory": "agent://directory",
    "capabilities": {
      "agent": {
        "discovery": true,
        "evaluation": true,
        "coordination": true,
        "monitoring": true
      }
    }
  }
}
```

### Agent Search Tool Call

```json
{
  "id": "tool-call-1",
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "agentSearch",
    "arguments": {
      "capabilities": ["data-analysis", "visualization"],
      "minScore": 7.5,
      "maxCost": 0.001
    }
  }
}
```

### Agent Search Tool Result

```json
{
  "id": "tool-call-1",
  "jsonrpc": "2.0",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Found 3 matching agents"
      }
    ],
    "_meta": {
      "agents": [
        {
          "id": "agent-123",
          "name": "DataViz Pro",
          "qualityScore": 8.7,
          "costPerToken": 0.0008
        },
        {
          "id": "agent-456",
          "name": "AnalyticsEngine",
          "qualityScore": 9.1,
          "costPerToken": 0.00095
        },
        {
          "id": "agent-789",
          "name": "StatisticsHelper",
          "qualityScore": 7.9,
          "costPerToken": 0.0005
        }
      ]
    }
  }
}
```


### NLIP-Compatible Agent Message

> ⚠️ TBD: NLIP connection: ACP message that follows NLIP format patterns

### NLIP Redirect Control Flow in ACP

> ⚠️ TBD: NLIP connection: ACP implementing NLIP's redirect control flow