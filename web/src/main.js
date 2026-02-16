import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "./ErrorBoundary";
import { SkeletonStyles } from "./SkeletonLoaders";
import { ThemeProvider } from "./ThemeEngine";
createRoot(document.getElementById("root")).render(_jsx(StrictMode, { children: _jsx(ErrorBoundary, { children: _jsxs(ThemeProvider, { children: [_jsx(SkeletonStyles, {}), _jsx(App, {})] }) }) }));
