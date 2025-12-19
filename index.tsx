import React from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import { esES } from '@clerk/localizations'; // (Opcional) Para que el login salga en español
import App from './App';

// Importamos la clave pública desde el entorno
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Falta la variable VITE_CLERK_PUBLISHABLE_KEY en Vercel o .env");
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("No se encontró el elemento root");
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} localization={esES}>
      <App />
    </ClerkProvider>
  </React.StrictMode>
);
