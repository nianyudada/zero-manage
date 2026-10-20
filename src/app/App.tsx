import { RouterProvider } from 'react-router';
import { router } from './routes';
import { TemplateProvider } from './contexts/TemplateContext';
import { Toaster } from './components/ui/sonner';

export default function App() {
  return (
    <TemplateProvider>
      <RouterProvider router={router} />
      <Toaster />
    </TemplateProvider>
  );
}