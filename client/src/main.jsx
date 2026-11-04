import { createRoot } from "react-dom/client";

import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import Auth0ProviderWithNavigate from "./auth/auth0-provider-with-history";
import { ThemeProvider } from "./utils/theme";

import "./index.css";

// installable app: the service worker only runs in the built app, so local
// development always loads fresh files
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.warn("Service worker registration failed", err);
    });
  });
}

const container = document.getElementById("root");
const root = createRoot(container); // createRoot(container!) if you use TypeScript
root.render(
  <BrowserRouter>
    <ThemeProvider>
      <Auth0ProviderWithNavigate>
        <App />
      </Auth0ProviderWithNavigate>
    </ThemeProvider>
  </BrowserRouter>
);
