import { NextRequest, NextResponse } from "next/server";
import {
  handleContentNotification,
  handleVerificationCallback,
  resolveTopicFromHeaders,
  resolveTopicFromParams,
} from "@/server/websub";

export async function GET(request: NextRequest) {
  const result = await handleVerificationCallback(request.nextUrl.searchParams);
  return new NextResponse(result.body, {
    status: result.status,
    headers: {
      "content-type": "text/plain; charset=utf-8",
    },
  });
}

export async function POST(request: NextRequest) {
  const topicId = request.nextUrl.searchParams.get("topicId");
  const headers = request.headers;
  const body = await request.text();

  const topicFromParams = resolveTopicFromParams(topicId);
  const topicFromHeaders = resolveTopicFromHeaders(headers);
  const fallbackTopic = request.nextUrl.searchParams.get("hub.topic");
  const topic = topicFromParams ?? topicFromHeaders ?? fallbackTopic;

  if (!topic) {
    return NextResponse.json({ error: "Unable to resolve topic" }, { status: 400 });
  }

  try {
    await handleContentNotification(topic, body, headers);
    return NextResponse.json({ status: "ok" });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

