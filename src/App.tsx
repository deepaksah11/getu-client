import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/Layout.js';

// Pages
import { Dashboard } from './pages/Dashboard.js';
import { Jobs } from './pages/Jobs.js';
import { JobDetails } from './pages/JobDetails.js';
import { Resumes } from './pages/Resumes.js';
import { ResumeDetails } from './pages/ResumeDetails.js';
import { Profile } from './pages/Profile.js';
import { Applications } from './pages/Applications.js';
import { ApplicationDetails } from './pages/ApplicationDetails.js';
import { Automation } from './pages/Automation.js';
import { AutomationLogs } from './pages/AutomationLogs.js';
import { Analytics } from './pages/Analytics.js';
import { Settings } from './pages/Settings.js';
import { Platforms } from './pages/Platforms.js';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5000,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="jobs" element={<Jobs />} />
            <Route path="jobs/:id" element={<JobDetails />} />
            <Route path="resumes" element={<Resumes />} />
            <Route path="resumes/:id" element={<ResumeDetails />} />
            <Route path="profile" element={<Profile />} />
            <Route path="applications" element={<Applications />} />
            <Route path="applications/:id" element={<ApplicationDetails />} />
            <Route path="platforms" element={<Platforms />} />
            <Route path="automation" element={<Automation />} />
            <Route path="automation/logs" element={<AutomationLogs />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
