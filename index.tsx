import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Removed Clerk - now using Supabase Auth
// ClerkProvider is no longer needed as authentication is handled by SupabaseAuthProvider in App.tsx

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("No se encontró el elemento root");
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
