import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./app";
import "./index.css";
import { reportWebVitals } from "./lib/telemetry";
import { onCLS, onFCP, onINP, onLCP, onTTFB } from "web-vitals";

// Report Web Vitals to our in-memory telemetry store
onCLS((m) => reportWebVitals({ name: "CLS", value: m.value, rating: m.rating }));
onFCP((m) => reportWebVitals({ name: "FCP", value: m.value, rating: m.rating }));
onINP((m) => reportWebVitals({ name: "INP", value: m.value, rating: m.rating }));
onLCP((m) => reportWebVitals({ name: "LCP", value: m.value, rating: m.rating }));
onTTFB((m) => reportWebVitals({ name: "TTFB", value: m.value, rating: m.rating }));

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
