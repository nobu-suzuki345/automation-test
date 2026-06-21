import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { GoogleProvider } from "./context/GoogleContext";
import { EventsProvider } from "./context/EventsContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <GoogleProvider>
        <EventsProvider>
          <App />
        </EventsProvider>
      </GoogleProvider>
    </BrowserRouter>
  </React.StrictMode>
);
