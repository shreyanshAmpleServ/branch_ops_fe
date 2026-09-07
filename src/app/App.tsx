import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDesignStore } from '../store/useDesignStore';
import { AuthGuard } from '../guards/AuthGuard';
import { GuestGuard } from '../guards/GuestGuard';

// Design layouts
import { Layout1 } from '../designs/design1';
import { Layout2 } from '../designs/design2';
import { Layout3 } from '../designs/design3';

import { LogoutModal } from '../features/auth/LogoutModal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { routes } from './routes';

const DesignLayout: React.FC = () => {
  const { activeDesign } = useDesignStore();
  const layouts = { design1: Layout1, design2: Layout2, design3: Layout3 };
  const ActiveLayout = layouts[activeDesign];
  return <ActiveLayout />;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
      <Routes>
        {routes.map((route, index) => {
          if (route.isPublic) {
            return (
              <Route 
                key={index} 
                path={route.path} 
                element={<GuestGuard>{route.element}</GuestGuard>} 
              />
            );
          }
          return null;
        })}

        {/* Protected routes with layout */}
        <Route element={<AuthGuard><DesignLayout /></AuthGuard>}>
          {routes.map((route, index) => {
            if (route.isProtected) {
              return (
                <Route 
                  key={index} 
                  path={route.path} 
                  element={route.element} 
                />
              );
            }
            return null;
          })}
        </Route>

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <LogoutModal />
    </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
