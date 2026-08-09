/// <reference types="vite/client" />
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { NexusNativeProvider } from './hooks/useNexusNative.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <NexusNativeProvider>
        <App />
      </NexusNativeProvider>
    </ErrorBoundary>
  </StrictMode>,
);

