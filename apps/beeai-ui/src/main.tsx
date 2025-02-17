import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/style.scss';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
// ***
