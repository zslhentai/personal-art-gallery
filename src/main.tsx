import { createRoot } from "react-dom/client";
import { initPwa } from "./pwa";
import App from "./App";
import "./styles.css";
createRoot(document.getElementById("root")!).render(<App />);

if (import.meta.env.PROD) initPwa();
