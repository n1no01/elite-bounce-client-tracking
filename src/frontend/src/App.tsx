import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { Footer } from "./components/Footer";
import { LoginPage } from "./components/LoginPage";
import { NavBar } from "./components/NavBar";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { AthleteComparison } from "./pages/AthleteComparison";
import { AthleteDetail } from "./pages/AthleteDetail";
import { Athletes } from "./pages/Athletes";
import { Dashboard } from "./pages/Dashboard";
import { TrainingSessions } from "./pages/TrainingSessions";
import type { BackendActor } from "./types/index";

// Root layout with auth guard
function RootLayout() {
  const { identity, isInitializing } = useInternetIdentity();
  const { actor, isFetching } = useActor();

  // Call _initializeAccessControl every time the actor instance changes.
  // No session/principal guard — ensures admin role is re-established after
  // every canister redeploy, not just once per session.
  useEffect(() => {
    if (!identity || !actor || isFetching) return;

    let principalStr: string;
    try {
      principalStr = identity.getPrincipal().toText();
      // Skip anonymous identity
      if (principalStr === "2vxsx-fae") return;
    } catch {
      return;
    }

    const backendActor = actor as BackendActor;
    if (!backendActor._initializeAccessControl) return;

    backendActor
      ._initializeAccessControl()
      .then(() => {
        console.log(
          "[Elite Bounce] Access control initialized for:",
          principalStr,
        );
      })
      .catch((err: unknown) => {
        console.error("[Elite Bounce] _initializeAccessControl failed:", err);
      });
  }, [actor, identity, isFetching]); // actor as primary trigger — re-runs on every new actor instance (e.g., after redeploy)

  if (isInitializing) {
    return (
      <div
        className="min-h-screen grid-bg flex items-center justify-center"
        data-ocid="app.loading_state"
      >
        <div className="fixed inset-0 vignette pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <img
            src="/assets/transparent-019d59bc-03ca-7536-a459-dda3d327c5ac.png"
            alt="Elite Bounce"
            className="w-20 h-20 object-contain animate-pulse"
          />
          <p
            className="text-sm tracking-widest uppercase"
            style={{ color: "oklch(0.45 0.009 240)" }}
          >
            Loading...
          </p>
        </div>
      </div>
    );
  }

  if (!identity) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}

// Route definitions
const rootRoute = createRootRoute({
  component: RootLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Dashboard,
});

const athletesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/athletes",
  component: Athletes,
});

const athleteDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/athletes/$athleteId",
  component: AthleteDetail,
});

const athleteCompareRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/athletes/compare",
  component: AthleteComparison,
});

const sessionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sessions",
  component: TrainingSessions,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  athletesRoute,
  athleteDetailRoute,
  athleteCompareRoute,
  sessionsRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "oklch(0.20 0.009 240)",
            border: "1px solid oklch(0.28 0.01 240)",
            color: "oklch(0.95 0.005 240)",
          },
        }}
      />
    </>
  );
}
