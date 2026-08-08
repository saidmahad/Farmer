// App.tsx
// Router shell. Public routes (Landing, Auth) render without the Layout;
// everything else is behind a protected Layout route. The active sidebar
// item is derived from the pathname inside Layout.
//
// Mirrors the Make file's App.tsx page set. navigationData (crop/disease/
// search/query/soilType) travels between pages via router location state.

import { Navigate, Route, Routes, useLocation } from 'react-router';
import { Layout } from '@/components/layout/Layout';
import { Landing } from '@/pages/Landing';
import { Auth } from '@/pages/Auth';
import { Placeholder } from '@/pages/Placeholder';
import { Toaster } from '@/components/ui/sonner';
import { useAuth } from '@/lib/auth';
import { Dashboard } from '@/pages/Dashboard';
import { CropRecommendation } from '@/pages/CropRecommendation';
import { SoilPrediction } from '@/pages/SoilPrediction';
import { PlantExplorer } from '@/pages/PlantExplorer';
import { DiseaseLibrary } from '@/pages/DiseaseLibrary';
import { GrowthCalendar } from '@/pages/GrowthCalendar';
import { VideoHub } from '@/pages/VideoHub';
import { Feedback } from '@/pages/Feedback';
import { Reports } from '@/pages/Reports';
import { AdminDashboard } from '@/pages/AdminDashboard';
import { Chatbot } from '@/pages/Chatbot';
import { Subscription } from '@/pages/Subscription';

// Pages behind the authenticated Layout. Each currently renders its own
// stub component (which in turn renders Placeholder) so URLs and route
// guards are stable while the real UIs land across build groups 3–5.
const PROTECTED_PAGES: { path: string; element: React.ReactNode }[] = [
  { path: '/dashboard', element: <Dashboard /> },
  { path: '/crop-recommendation', element: <CropRecommendation /> },
  { path: '/soil-prediction', element: <SoilPrediction /> },
  { path: '/plant-explorer', element: <PlantExplorer /> },
  { path: '/disease-library', element: <DiseaseLibrary /> },
  { path: '/growth-calendar', element: <GrowthCalendar /> },
  { path: '/video-hub', element: <VideoHub /> },
  { path: '/feedback', element: <Feedback /> },
  { path: '/reports', element: <Reports /> },
  { path: '/subscription', element: <Subscription /> },
  { path: '/admin', element: <AdminDashboard /> },
  { path: '/chatbot', element: <Chatbot /> },
];

// Keep the title for Placeholder so future stub pages can keep using it.
const _Placeholder = Placeholder; void _Placeholder;

function RequireAuth() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  return <Layout />;
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />

        <Route element={<RequireAuth />}>
          {PROTECTED_PAGES.map((page) => (
            <Route
              key={page.path}
              path={page.path}
              element={page.element}
            />
          ))}
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </>
  );
}
