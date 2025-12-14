import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initCapacitor, isNative } from "./lib/capacitorInit";

// Initialize Capacitor for native app features
if (isNative) {
  initCapacitor().then(() => {
    console.log('Capacitor initialized for native platform');
  });
}

createRoot(document.getElementById("root")!).render(<App />);
