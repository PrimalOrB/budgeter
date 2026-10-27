import { createRoot } from "react-dom/client";

import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import Auth0ProviderWithNavigate from "./auth/auth0-provider-with-history";
import { ThemeProvider } from "./utils/theme";

import "./index.css";

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
