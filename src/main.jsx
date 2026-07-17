import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App';
import DynamicThemeProvider from './theme/DynamicThemeProvider';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <DynamicThemeProvider>
        <App />
      </DynamicThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);
