import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export function LoginPage() {
  const { login, isLoggingIn, isInitializing } = useInternetIdentity();

  return (
    <div
      className="min-h-screen grid-bg flex flex-col items-center justify-center relative overflow-hidden"
      data-ocid="login.page"
    >
      {/* Vignette */}
      <div className="fixed inset-0 vignette" />

      <div className="relative z-10 flex flex-col items-center gap-10 px-6 text-center">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div
              className="absolute inset-0 rounded-full blur-2xl"
              style={{ background: "oklch(0.72 0.12 75 / 0.15)" }}
            />
            <img
              src="/assets/transparent-019d59bc-03ca-7536-a459-dda3d327c5ac.png"
              alt="Elite Bounce"
              className="relative w-36 h-36 object-contain"
            />
          </div>
          <div>
            <h1
              className="font-display text-5xl font-bold tracking-widest uppercase"
              style={{ color: "oklch(0.78 0.13 75)" }}
            >
              Elite Bounce
            </h1>
            <p
              className="mt-2 text-sm tracking-widest uppercase font-medium"
              style={{ color: "oklch(0.58 0.01 240)" }}
            >
              Athlete Performance Tracking
            </p>
          </div>
        </div>

        {/* Card */}
        <div
          className="elite-card rounded-xl p-8 w-full max-w-sm flex flex-col items-center gap-6"
          data-ocid="login.dialog"
        >
          <div className="text-center">
            <h2 className="text-xl font-semibold text-foreground">
              Coach Access
            </h2>
            <p
              className="mt-1.5 text-sm"
              style={{ color: "oklch(0.58 0.01 240)" }}
            >
              Sign in to manage your athletes and track performance.
            </p>
          </div>

          <Button
            onClick={login}
            disabled={isLoggingIn || isInitializing}
            className="w-full btn-gold font-medium tracking-wider"
            data-ocid="login.primary_button"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              "Login with Internet Identity"
            )}
          </Button>

          <p
            className="text-xs text-center"
            style={{ color: "oklch(0.42 0.008 240)" }}
          >
            Secured by Internet Computer&rsquo;s decentralized identity
            protocol.
          </p>
        </div>
      </div>
    </div>
  );
}
