import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { applyDocumentLocale } from "@/lib/i18n";
import "./index.css";

// Antes do primeiro render: o `lang` do documento decide a pronúncia do leitor
// de tela, e ele não pode mais ser fixo no HTML — depende do locale do sistema.
applyDocumentLocale();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
