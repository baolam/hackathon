import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import {
  useTideCloak,
  useAuthCallback,
  Authenticated,
  Unauthenticated,
} from "@tidecloak/react";
import "./styles.css";
import { Landing } from "./pages/Landing";
import { Dashboard } from "./pages/Dashboard";
import { SubmitReport } from "./pages/SubmitReport";
import { CaseDetail } from "./pages/CaseDetail";
import { E2EEDemo } from "./pages/E2EEDemo";
import { AnonymousIntake } from "./pages/AnonymousIntake";
import { AnonymousTracker } from "./pages/AnonymousTracker";
import { Layout } from "./components/Layout";
import { LoadingScreen } from "./components/LoadingScreen";

// IMPORTANT: isInitializing must be checked BEFORE Authenticated/Unauthenticated guards.
function App() {
  const { isInitializing } = useTideCloak();

  const { isCallback, isProcessing, error: callbackError } = useAuthCallback({
    onSuccess: (returnUrl) => {
      window.location.assign(returnUrl || "/");
    },
    onError: () => {
      window.location.assign("/");
    },
    onMissingVerifierRedirectTo: "/",
  });

  if (isCallback) {
    if (callbackError) return <p>Authentication failed: {callbackError.message}</p>;
    if (isProcessing) return <p>Completing login...</p>;
    return <p>Redirecting...</p>;
  }

  if (isInitializing) return <LoadingScreen />;

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes — Accessible to everyone without login */}
        <Route path="/anonymous-report" element={<AnonymousIntake />} />
        <Route path="/track" element={<AnonymousTracker />} />

        {/* Root Route: Landing portal for unauthenticated, Dashboard for authenticated */}
        <Route
          path="/"
          element={
            <>
              <Authenticated>
                <Layout>
                  <Dashboard />
                </Layout>
              </Authenticated>
              <Unauthenticated>
                <Landing />
              </Unauthenticated>
            </>
          }
        />

        {/* Workspace Management Routes */}
        <Route
          path="/cases"
          element={
            <Layout>
              <Dashboard />
            </Layout>
          }
        />
        <Route
          path="/cases/:id"
          element={
            <Layout>
              <CaseDetail />
            </Layout>
          }
        />
        <Route
          path="/submit"
          element={
            <Layout>
              <SubmitReport />
            </Layout>
          }
        />
        <Route
          path="/evidence"
          element={
            <Layout>
              <E2EEDemo />
            </Layout>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
