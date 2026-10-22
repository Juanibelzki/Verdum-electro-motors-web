import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import AdminApp from "./admin/AdminApp";

const isAdminRoute = /^\/admin(?:\.html)?\/?$/i.test(window.location.pathname);

createRoot(document.getElementById("root")!).render(
  <StrictMode>{isAdminRoute ? <AdminApp /> : <App />}</StrictMode>
);
