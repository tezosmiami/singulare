import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { TezosContextProvider } from "./context/tezos-context";
import { BrowserRouter } from "react-router-dom";

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
  <TezosContextProvider>
    <App />
  </TezosContextProvider>
  </BrowserRouter>
);
