import "./globals.css";
import type { Metadata } from "next";
import type { PropsWithChildren } from "react";
import {
  ACTIVITY_OUTBOX_PATH,
  JSON_FEED_PATH,
  RSS_API_PATH,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  DEFAULT_HUB_URL,
  ACTIVITY_ACTOR_PATH,
  absolutePath,
} from "@/lib/site-config";

export const metadata: Metadata = {
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: SITE_URL,
    types: {
      "application/json": absolutePath(JSON_FEED_PATH),
      "application/activity+json": absolutePath(ACTIVITY_OUTBOX_PATH),
      "text/html": SITE_URL,
    },
  },
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
  },
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en" className="h-full">
      <body className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
        <link rel="hub" href={DEFAULT_HUB_URL} />
        <link rel="self" href={JSON_FEED_PATH} type="application/json" />
        <link rel="alternate" type="application/json" href={JSON_FEED_PATH} title="JSON Feed" />
        <link
          rel="alternate"
          type="application/activity+json"
          href={ACTIVITY_OUTBOX_PATH}
          title="ActivityStreams Outbox"
        />
        <link rel="alternate" type="application/activity+json" href={ACTIVITY_ACTOR_PATH} title="ActivityPub Actor" />
        <link rel="alternate" type="application/rss+xml" href={RSS_API_PATH} title="RSS Feed" />
        <link rel="icon" href="/favicon.ico" />
        {children}
      </body>
    </html>
  );
}
