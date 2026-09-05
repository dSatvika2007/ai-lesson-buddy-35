const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "openai/gpt-5.6-sol";

export class AiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "AiError";
  }
}

function friendlyMessage(status: number, raw: string): string {
  if (status === 402) return "The AI credits for this workspace have run out. Add credits to continue.";
  if (status === 403) return "AI access is currently blocked for this workspace.";
  if (status === 429) return "The AI is busy right now. Please wait a moment and try again.";
  if (status >= 500) return "The AI service had a temporary problem. Please try again.";
  return raw || "The AI request failed.";
}

/**
 * Calls the AI gateway and returns parsed JSON of type T.
 * Must only ever run inside a server function handler.
 */
export async function generateJson<T>(args: {
  system: string;
  user: string;
  schemaName: string;
  schema: Record<string, unknown>;
}): Promise<T> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new AiError(401, "AI is not configured for this app yet.");

  const response = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      reasoning_effort: "none",
      messages: [
        { role: "system", content: args.system },
        { role: "user", content: args.user },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: args.schemaName,
          strict: true,
          schema: args.schema,
        },
      },
    }),
  });

  if (!response.ok) {
    const raw = await response.text().catch(() => "");
    let message = raw;
    try {
      const parsed = JSON.parse(raw) as { error?: { message?: string }; message?: string };
      message = parsed.error?.message ?? parsed.message ?? raw;
    } catch {
      /* keep raw */
    }
    throw new AiError(response.status, friendlyMessage(response.status, message));
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new AiError(502, "The AI returned an empty response. Please try again.");

  try {
    return JSON.parse(content) as T;
  } catch {
    throw new AiError(502, "The AI response could not be read. Please try again.");
  }
}
