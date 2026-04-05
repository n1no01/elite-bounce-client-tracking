export function Footer() {
  const year = new Date().getFullYear();
  const hostname = encodeURIComponent(window.location.hostname);

  return (
    <footer
      className="mt-auto border-t"
      style={{
        borderColor: "oklch(0.22 0.008 240)",
        background: "oklch(0.11 0.005 240)",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs" style={{ color: "oklch(0.40 0.008 240)" }}>
          Elite Bounce &mdash; Empowering Peak Performance
        </p>
        <p className="text-xs" style={{ color: "oklch(0.35 0.007 240)" }}>
          &copy; {year}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${hostname}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline transition-colors"
            style={{ color: "oklch(0.72 0.12 75)" }}
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </footer>
  );
}
