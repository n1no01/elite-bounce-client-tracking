import { useQueryClient } from "@tanstack/react-query";
import { Link, useRouterState } from "@tanstack/react-router";
import { LogOut, Zap } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const navLinks = [
  { to: "/", label: "Dashboard" },
  { to: "/athletes", label: "Athlete Roster" },
];

export function NavBar() {
  const { clear, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const getInitials = () => {
    return "C";
  };

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const isActive = (to: string) => {
    if (to === "/") return currentPath === "/";
    return currentPath.startsWith(to);
  };

  return (
    <nav
      className="sticky top-0 z-50 w-full"
      style={{
        background:
          "linear-gradient(180deg, oklch(0.14 0.006 240) 0%, oklch(0.12 0.005 240) 100%)",
        borderBottom: "1px solid oklch(0.28 0.01 240)",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center h-16 gap-8">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-3 shrink-0"
          data-ocid="nav.link"
        >
          <img
            src="/assets/transparent-019d59bc-03ca-7536-a459-dda3d327c5ac.png"
            alt="Elite Bounce"
            className="w-12 h-12 object-contain"
          />
          <span
            className="font-display text-sm font-bold tracking-widest uppercase"
            style={{ color: "oklch(0.78 0.13 75)" }}
          >
            Elite Bounce
          </span>
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-1 flex-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-4 py-5 text-sm font-medium tracking-wide transition-colors relative ${
                isActive(link.to)
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-ocid="nav.link"
            >
              {link.label}
              {isActive(link.to) && (
                <span
                  className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full"
                  style={{ background: "oklch(0.72 0.12 75)" }}
                />
              )}
            </Link>
          ))}
        </div>

        {/* Right: User + Logout */}
        {identity && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  background: "oklch(0.72 0.12 75 / 0.2)",
                  border: "1px solid oklch(0.72 0.12 75 / 0.4)",
                }}
              >
                <span style={{ color: "oklch(0.78 0.13 75)" }}>
                  {getInitials()}
                </span>
              </div>
              <span
                className="text-xs font-medium tracking-wider uppercase"
                style={{ color: "oklch(0.58 0.01 240)" }}
              >
                Coach
              </span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="p-2 rounded-md transition-colors hover:bg-muted"
              title="Logout"
              data-ocid="nav.link"
            >
              <LogOut
                className="w-4 h-4"
                style={{ color: "oklch(0.58 0.01 240)" }}
              />
            </button>
          </div>
        )}

        {!identity && (
          <div
            className="flex items-center gap-2"
            style={{ color: "oklch(0.58 0.01 240)" }}
          >
            <Zap className="w-4 h-4" style={{ color: "oklch(0.72 0.12 75)" }} />
            <span className="text-xs tracking-wider uppercase">
              Elite Bounce
            </span>
          </div>
        )}
      </div>
    </nav>
  );
}
