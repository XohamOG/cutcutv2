"use client";

import dynamic from "next/dynamic";

// Client-only: the app starts from browser storage. The solid panel matches the intro.
const App = dynamic(() => import("@/components/App"), {
  ssr: false,
  loading: () => <div style={{ position: "fixed", inset: 0, background: "#ff5000" }} />,
});

export default function Home() {
  return <App />;
}
