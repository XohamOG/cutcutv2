import type { Metadata } from "next";
import KeyGuide from "@/components/KeyGuide";

export const metadata: Metadata = {
  title: "Get your AI key · viralbits",
  description: "Step-by-step: where to get a free AI key, where to paste it, and how to revoke it.",
};

export default function KeysPage() {
  return <KeyGuide />;
}
