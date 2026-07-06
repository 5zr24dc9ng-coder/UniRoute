import React from "react";
import ReactDOM from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import { jaJP } from "@clerk/localizations";
import App from "./App";
import "./index.css";

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;
if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error("VITE_CLERK_PUBLISHABLE_KEY が .env に設定されていません");
}

// Clerkの全コンポーネント（モーダル・UserButtonのポップオーバー等）共通の見た目設定
const clerkAppearance = {
  variables: {
    colorPrimary: "#2f63e6",
    fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
    borderRadius: "10px",
  },
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} localization={jaJP} appearance={clerkAppearance}>
      <App />
    </ClerkProvider>
  </React.StrictMode>
);
