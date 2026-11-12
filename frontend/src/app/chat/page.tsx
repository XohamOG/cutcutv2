import type { Metadata } from "next";
import ChatGuide from "@/components/ChatGuide";

export const metadata: Metadata = {
  title: "Add your Twitch or YouTube chat replay",
  alternates: { canonical: "/chat" },
  description: "Step-by-step: how to save your YouTube or Twitch chat replay and add it for better clip picks.",
};

export default function ChatPage() {
  return <ChatGuide />;
}
