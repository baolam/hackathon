import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import { Layout } from "./components/Layout";

// IMPORTANT: isInitializing must be checked BEFORE Authenticated/Unauthenticated guards.
// Unauthenticated renders during init because the user is not yet authenticated.
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

  if (isInitializing) return <p>Initializing TideCloak...</p>;

  return (
    <>
      <Authenticated>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/submit" element={<SubmitReport />} />
              <Route path="/cases/:id" element={<CaseDetail />} />
              <Route path="/evidence" element={<E2EEDemo />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </Authenticated>
      <Unauthenticated>
        <Landing />
      </Unauthenticated>
    </>
  );
}

export default App;
