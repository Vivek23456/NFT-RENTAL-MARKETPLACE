import React from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import WalletConnectionProvider from "@/components/WalletProvider";
import { AuthProvider } from "./hooks/useAuth.tsx";
import App from "./App.tsx";
import "./index.css";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <WalletConnectionProvider>
        <AuthProvider>
        <App />
        </AuthProvider>
      </WalletConnectionProvider>
    </BrowserRouter>
  </QueryClientProvider>
);
