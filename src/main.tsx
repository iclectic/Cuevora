import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initNativePlugins } from "./lib/capacitor";

// Hide the native HTML splash once React takes over
const nativeSplash = document.getElementById('native-splash');
if (nativeSplash) {
  nativeSplash.classList.add('hidden');
  setTimeout(() => nativeSplash.remove(), 400);
}

// Initialize Capacitor native plugins (no-op on web)
initNativePlugins();

createRoot(document.getElementById("root")!).render(<App />);
