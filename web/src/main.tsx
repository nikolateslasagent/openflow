import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "./ErrorBoundary";
import { SkeletonStyles } from "./SkeletonLoaders";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <SkeletonStyles />
      <App />
    </ErrorBoundary>
  </StrictMode>
);
