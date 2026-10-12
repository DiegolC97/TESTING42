import type { Metadata } from "next";
import ConnectFour from "./ConnectFour";

export const metadata: Metadata = {
  title: "Connect Four · Testing42",
  description: "Play four-in-a-line against the computer.",
};

export default function ConnectFourPage() {
  return <ConnectFour />;
}
