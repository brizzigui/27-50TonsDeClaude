import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { PiqueteProvider } from "./context/PiqueteContext";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <PiqueteProvider>
        <App />
      </PiqueteProvider>
    </BrowserRouter>
  </StrictMode>
);
