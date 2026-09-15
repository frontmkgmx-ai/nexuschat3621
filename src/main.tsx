/// <reference types="vite/client" />
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import './index.css';
import { NexusNativeProvider } from './hooks/useNexusNative';
import { ErrorBoundary } from './components/ErrorBoundary';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <NexusNativeProvider>
        <App />
      </NexusNativeProvider>
    </ErrorBoundary>
  </StrictMode>,
);

