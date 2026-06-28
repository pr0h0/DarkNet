import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./styles.css";

// ponytail: no StrictMode — its dev double-mount re-runs the async boot/initBash
// twice; not worth the guards for a single-player game.
createRoot(document.getElementById("root")!).render(<App />);
