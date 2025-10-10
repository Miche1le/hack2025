import { NextResponse } from "next/server";
import {
  ACTIVITY_OUTBOX_PATH,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  absolutePath,
  JSON_FEED_PATH,
  RSS_API_PATH,
} from "@/lib/site-config";

export async function GET() {
  const actorId = absolutePath("/api/activitypub/actor");
  const outboxUrl = absolutePath(ACTIVITY_OUTBOX_PATH);

  const actor = {
    "@context": [
      "https://www.w3.org/ns/activitystreams",
      {
        toot: "http://joinmastodon.org/ns#",
        featured: { "@id": "toot:featured" },
      },
    ],
    id: actorId,
    type: "Application",
    preferredUsername: SITE_NAME.replace(/\s+/g, "").toLowerCase(),
    name: SITE_NAME,
    summary: SITE_DESCRIPTION,
    url: SITE_URL,
    inbox: `${actorId}/inbox`,
    outbox: outboxUrl,
    endpoints: {
      sharedInbox: `${actorId}/inbox`,
    },
    icon: {
      type: "Image",
      mediaType: "image/png",
      url: absolutePath("/logo.png"),
    },
    attachment: [
      {
        type: "PropertyValue",
        name: "JSON Feed",
        value: JSON_FEED_PATH,
      },
      {
        type: "PropertyValue",
        name: "RSS",
        value: RSS_API_PATH,
      },
    ],
  };

  return NextResponse.json(actor, {
    headers: {
      "content-type": "application/activity+json",
    },
  });
}
