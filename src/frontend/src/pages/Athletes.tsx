import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { ChevronRight, Loader2, Plus, Search, Users } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { AddAthleteForm } from "../components/AddAthleteForm";
import { useGetAllAthletes } from "../hooks/useQueries";
import type { Athlete } from "../types";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function AthleteRow({ athlete, index }: { athlete: Athlete; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className="elite-card rounded-xl flex items-center gap-4 px-5 py-4 hover:border-border transition-all"
      data-ocid={`athletes.item.${index}`}
    >
      {/* Avatar */}
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
        style={{
          background: "oklch(0.72 0.12 75 / 0.12)",
          border: "2px solid oklch(0.72 0.12 75 / 0.3)",
        }}
      >
        <span style={{ color: "oklch(0.78 0.13 75)" }}>
          {getInitials(athlete.name)}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground">{athlete.name}</p>
        <p
          className="text-sm mt-0.5"
          style={{ color: "oklch(0.50 0.009 240)" }}
        >
          {athlete.sport} &bull; Age {String(athlete.age)}
        </p>
      </div>

      {/* Actions */}
      <Link
        to="/athletes/$athleteId"
        params={{ athleteId: athlete.id.toString() }}
        data-ocid={`athletes.link.${index}`}
      >
        <Button size="sm" className="btn-gold text-xs gap-1.5">
          View Profile
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </Link>
    </motion.div>
  );
}

export function Athletes() {
  const { data: athletes = [], isLoading, isError } = useGetAllAthletes();
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const filtered = athletes.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.sport.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen grid-bg relative">
      <div className="fixed inset-0 vignette pointer-events-none" />

      <main className="relative z-10 max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="font-display text-4xl font-bold text-foreground">
              Athlete Roster
            </h1>
            <p
              className="text-sm mt-1"
              style={{ color: "oklch(0.58 0.01 240)" }}
            >
              {athletes.length} athlete{athletes.length !== 1 ? "s" : ""} total
            </p>
          </div>

          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button
                className="btn-gold gap-2 shrink-0"
                data-ocid="athletes.open_modal_button"
              >
                <Plus className="w-4 h-4" /> Add Athlete
              </Button>
            </DialogTrigger>
            <DialogContent className="elite-card border-border">
              <DialogHeader>
                <DialogTitle>Add New Athlete</DialogTitle>
              </DialogHeader>
              <AddAthleteForm
                onSuccess={() => setAddOpen(false)}
                onCancel={() => setAddOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Search */}
        <div className="relative mb-6">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: "oklch(0.45 0.009 240)" }}
          />
          <Input
            placeholder="Search athletes by name or sport..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11 bg-card border-border h-11"
            data-ocid="athletes.search_input"
          />
        </div>

        {/* Error state */}
        {isError && (
          <div
            className="elite-card rounded-xl flex flex-col items-center justify-center p-10 text-center"
            data-ocid="athletes.error_state"
          >
            <p className="font-semibold text-foreground mb-1">
              Unable to load athletes
            </p>
            <p
              className="text-sm mb-4"
              style={{ color: "oklch(0.45 0.009 240)" }}
            >
              Please try refreshing the page. If the problem persists, log out
              and back in.
            </p>
            <Button
              variant="outline"
              className="btn-gold text-sm"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </Button>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="space-y-3" data-ocid="athletes.loading_state">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && filtered.length === 0 && (
          <div
            className="elite-card rounded-xl flex flex-col items-center justify-center p-16 text-center"
            data-ocid="athletes.empty_state"
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{
                background: "oklch(0.72 0.12 75 / 0.1)",
                border: "1px solid oklch(0.72 0.12 75 / 0.2)",
              }}
            >
              <Users
                className="w-8 h-8"
                style={{ color: "oklch(0.72 0.12 75 / 0.5)" }}
              />
            </div>
            <p className="font-semibold text-foreground mb-1">
              {search ? "No athletes found" : "No athletes yet"}
            </p>
            <p className="text-sm" style={{ color: "oklch(0.45 0.009 240)" }}>
              {search
                ? "Try a different search term"
                : "Add your first athlete to get started"}
            </p>
          </div>
        )}

        {/* List */}
        {!isLoading && !isError && (
          <div className="space-y-3">
            {filtered.map((athlete, i) => (
              <AthleteRow
                key={athlete.id.toString()}
                athlete={athlete}
                index={i + 1}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
