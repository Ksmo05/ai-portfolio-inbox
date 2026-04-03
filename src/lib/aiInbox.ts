const AI_INBOX_API_URL = process.env.NEXT_PUBLIC_INBOX_API_URL;

export const CHAT_WIDGET_SOURCE = "portfolio-chat-widget";
export const CONTACT_FORM_SOURCE = "portfolio-vercel";

type ChatReplyResponse = {
  reply?: string;
  message?: unknown;
};

export type InboxSuccessResponse = {
  ok?: boolean;
  analysis_engine?: string;
  message?: Record<string, unknown>;
  detail?: string;
};

export type ContactFormPayload = {
  name: string;
  email: string | null;
  company: string | null;
  message: string;
  source: string;
};

function getInboxApiUrl() {
  if (!AI_INBOX_API_URL) {
    console.error("[aiInbox] Missing NEXT_PUBLIC_INBOX_API_URL");
    return null;
  }

  return AI_INBOX_API_URL;
}

export async function postInboxPayload<TResponse>(payload: unknown) {
  const apiUrl = getInboxApiUrl();
  if (!apiUrl) {
    throw new Error("missing-inbox-api-url");
  }

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const rawText = await response.text();
  let data: TResponse | null = null;

  if (rawText) {
    try {
      data = JSON.parse(rawText) as TResponse;
    } catch (error) {
      throw new Error("invalid-json-response", { cause: error });
    }
  }

  return {
    response,
    data,
    rawText,
  };
}

export async function sendChatMessage(message: string) {
  const { response, data } = await postInboxPayload<ChatReplyResponse>({
    message,
    source: CHAT_WIDGET_SOURCE,
  });

  if (!response.ok) {
    throw new Error("chat-request-failed");
  }

  const reply =
    typeof data?.reply === "string"
      ? data.reply
      : typeof data?.message === "string"
        ? data.message
        : null;

  if (!reply) {
    throw new Error("chat-empty-response");
  }

  return reply;
}

export { AI_INBOX_API_URL };
