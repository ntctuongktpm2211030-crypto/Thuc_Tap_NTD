import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { store } from './store';
import App from './App';
import { ThemeProvider } from './contexts/ThemeContext';
import { LangProvider } from './contexts/LanguageContext';

import { MotionProvider } from './animations';

// Import Mapbox styles for geocoding and routes
import 'maplibre-gl/dist/maplibre-gl.css';

import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <LangProvider>
            <BrowserRouter>
              <MotionProvider>
                <App />
              </MotionProvider>
            </BrowserRouter>
          </LangProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>
);
