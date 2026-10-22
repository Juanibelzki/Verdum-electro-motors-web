import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import AdminApp from "./admin/AdminApp";
import TasacionGallery from "./tasacion/TasacionGallery";

const path = window.location.pathname;
const isAdminRoute = /^\/admin(?:\.html)?(?:\/.*)?$/i.test(path);
const isTasacionRoute = /^\/tasacion(?:\/.*)?$/i.test(path);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {isAdminRoute ? (
      <AdminApp />
    ) : isTasacionRoute ? (
      <TasacionGallery />
    ) : (
      <App />
    )}
  </StrictMode>
);
