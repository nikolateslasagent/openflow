import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "./ErrorBoundary";
import { SkeletonStyles } from "./SkeletonLoaders";
import { ThemeProvider } from "./ThemeEngine";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <SkeletonStyles />
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>
);
