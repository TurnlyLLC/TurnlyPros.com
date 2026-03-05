// app/scan/page.tsx
// One-page landing that pulls TODAY's drop from /content/drops/YYYY-MM-DD.json
// Drop files are local JSON so the content updates automatically by date.

import fs from "fs";
import path from "path";
import Link from "next/link";

type Drop = {
  date: string; // "YYYY-MM-DD"
  number?: number; // optional: 1..365
  title: string;
  free: {
    puzzle: string;
    sharePrompt?: string;
  };
  paid: {
    answerKey: string;
    funFact?: string;
  };
  subscriber: {
    bonus?: string;
    emailTeaser?: string;
  };
};

function todayET(): string {
  // Uses America/New_York so the “daily drop” flips at midnight Eastern.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date()); // YYYY-MM-DD
}

function getDropByDate(dateStr?: string): Drop | null {
  const date = dateStr ?? todayET();
  const filePath = path.join(process.cwd(), "content", "drops", `${date}.json`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw) as Drop;
}

function classNames(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function LockCard({
  title,
  description,
  children,
  ctaHref,
  ctaLabel,
  secondaryHref,
  secondaryLabel,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
  ctaHref: string;
  ctaLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <section
      style={{
        border: "1px solid rgba(255,255,255,0.10)",
        borderRadius: 18,
        padding: 18,
        background: "rgba(255,255,255,0.04)",
        backdropFilter: "blur(6px)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontSize: 18, margin: 0 }}>{title}</h2>
          <p style={{ opacity: 0.8, margin: "6px 0 0 0", lineHeight: 1.45 }}>{description}</p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {secondaryHref && secondaryLabel ? (
            <Link
              href={secondaryHref}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.14)",
                textDecoration: "none",
                color: "white",
                opacity: 0.9,
                fontSize: 14,
                whiteSpace: "nowrap",
              }}
            >
              {secondaryLabel}
            </Link>
          ) : null}

          <Link
            href={ctaHref}
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.22)",
              textDecoration: "none",
              color: "black",
              background: "white",
              fontSize: 14,
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            {ctaLabel}
          </Link>
        </div>
      </div>

      {children ? (
        <div style={{ marginTop: 14 }}>
          <div
            style={{
              borderRadius: 14,
              border: "1px dashed rgba(255,255,255,0.22)",
              padding: 14,
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* “Locked blur” overlay */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(180deg, rgba(0,0,0,0.10), rgba(0,0,0,0.55))",
                backdropFilter: "blur(8px)",
              }}
            />
            <div style={{ position: "relative", opacity: 0.85 }}>{children}</div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default function ScanPage() {
  const drop = getDropByDate();

  // TODO (later): Replace with real auth + Stripe entitlement checks
  const isLoggedIn = false;
  const hasPaidAccess = false; // e.g., one-time unlock for today
  const hasSubscriberAccess = false; // e.g., active subscription

  const pageTitle = drop?.title ?? "Today’s Drop";
  const dateLabel = drop?.date ?? todayET();

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "28px 16px 48px",
        color: "white",
        background:
          "radial-gradient(1200px 600px at 20% 0%, rgba(255,255,255,0.10), transparent 60%), radial-gradient(900px 500px at 90% 20%, rgba(255,255,255,0.08), transparent 55%), #0b0b0f",
      }}
    >
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        {/* Top bar */}
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <Link href="/" style={{ textDecoration: "none", color: "white" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(255,255,255,0.06)",
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 800,
                }}
              >
                SC
              </div>
              <div>
                <div style={{ fontWeight: 800, letterSpacing: 0.2 }}>Secret Scan Club</div>
                <div style={{ opacity: 0.75, fontSize: 12, marginTop: 2 }}>Daily drops. One QR. Always new.</div>
              </div>
            </div>
          </Link>

          <nav style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Link
              href="/archive"
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.14)",
                textDecoration: "none",
                color: "white",
                opacity: 0.9,
                fontSize: 14,
              }}
            >
              Archives
            </Link>
            <Link
              href={isLoggedIn ? "/account" : "/login"}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.14)",
                textDecoration: "none",
                color: "white",
                opacity: 0.9,
                fontSize: 14,
              }}
            >
              {isLoggedIn ? "Account" : "Log in"}
            </Link>
          </nav>
        </header>

        {/* Hero */}
        <section style={{ marginTop: 26 }}>
          <div
            style={{
              border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: 22,
              padding: 20,
              background: "rgba(255,255,255,0.04)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ opacity: 0.75, fontSize: 13 }}>
                  Drop for <span style={{ fontWeight: 700 }}>{dateLabel}</span>
                  {drop?.number ? (
                    <>
                      {" "}• <span style={{ fontWeight: 700 }}>#{drop.number}</span>
                    </>
                  ) : null}
                </div>
                <h1 style={{ fontSize: 28, lineHeight: 1.15, margin: "8px 0 0 0" }}>{pageTitle}</h1>
                <p style={{ opacity: 0.85, margin: "10px 0 0 0", lineHeight: 1.5, maxWidth: 640 }}>
                  Scan → get today’s free puzzle. Pay to unlock the answer key + fun fact. Subscribe to get the daily email,
                  bonus content, and full archives.
                </p>
              </div>

              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <Link
                  href="/subscribe"
                  style={{
                    padding: "12px 14px",
                    borderRadius: 14,
                    background: "white",
                    color: "black",
                    textDecoration: "none",
                    fontWeight: 800,
                    fontSize: 14,
                    whiteSpace: "nowrap",
                  }}
                >
                  Subscribe
                </Link>
                <Link
                  href="/unlock"
                  style={{
                    padding: "12px 14px",
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.22)",
                    color: "white",
                    textDecoration: "none",
                    fontWeight: 700,
                    fontSize: 14,
                    whiteSpace: "nowrap",
                  }}
                >
                  Unlock today
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Content */}
        <section style={{ marginTop: 18, display: "grid", gap: 14 }}>
          {/* Free section */}
          <section
            style={{
              border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: 18,
              padding: 18,
              background: "rgba(255,255,255,0.04)",
            }}
          >
            <h2 style={{ fontSize: 18, margin: 0 }}>Today’s Free Drop</h2>

            {drop ? (
              <>
                <div
                  style={{
                    marginTop: 12,
                    padding: 14,
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(0,0,0,0.20)",
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.55,
                  }}
                >
                  {drop.free.puzzle}
                </div>

                {drop.free.sharePrompt ? (
                  <p style={{ opacity: 0.85, marginTop: 12, lineHeight: 1.45 }}>
                    <span style={{ fontWeight: 800 }}>Share prompt:</span> {drop.free.sharePrompt}
                  </p>
                ) : null}

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
                  <Link
                    href="/unlock"
                    style={{
                      padding: "10px 12px",
                      borderRadius: 12,
                      background: "white",
                      color: "black",
                      textDecoration: "none",
                      fontWeight: 800,
                      fontSize: 14,
                    }}
                  >
                    Unlock answer key
                  </Link>
                  <Link
                    href="/subscribe"
                    style={{
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.22)",
                      color: "white",
                      textDecoration: "none",
                      fontWeight: 700,
                      fontSize: 14,
                    }}
                  >
                    Subscribe for daily email
                  </Link>
                </div>
              </>
            ) : (
              <p style={{ opacity: 0.85, marginTop: 10 }}>
                Today’s drop isn’t live yet. Check back later.
              </p>
            )}
          </section>

          {/* Paid unlock section */}
          <LockCard
            title="Locked: Answer Key + Fun Fact"
            description="One-time unlock for today’s drop (or included with subscription tiers if you want)."
            ctaHref="/unlock"
            ctaLabel="Unlock today"
            secondaryHref="/subscribe"
            secondaryLabel="Or subscribe"
          >
            {/* If you want a tiny teaser inside the lock box */}
            <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.55 }}>
              {drop
                ? "Preview:\n• Answer key\n• Fun fact\n\n(Unlock to reveal.)"
                : "Preview:\n• Answer key\n• Fun fact"}
            </div>
          </LockCard>

          {/* Subscriber section */}
          <LockCard
            title="Subscriber Bonus"
            description="Subscribers get the email drop + bonus content and access to archives."
            ctaHref="/subscribe"
            ctaLabel="Subscribe"
            secondaryHref="/archive"
            secondaryLabel="View archives"
          >
            <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.55 }}>
              {drop?.subscriber?.emailTeaser
                ? `Email teaser:\n${drop.subscriber.emailTeaser}\n\n(Subscribe to get daily drops.)`
                : "What subscribers get:\n• Daily email drops\n• Bonus content\n• Archives (past drops)\n\n(Subscribe to unlock.)"}
            </div>
          </LockCard>

          {/* Footer CTA */}
          <footer style={{ opacity: 0.8, marginTop: 6, fontSize: 13, lineHeight: 1.6 }}>
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.10)", paddingTop: 14 }}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Link href="/subscribe" style={{ color: "white", fontWeight: 700 }}>
                  Subscribe
                </Link>
                <span style={{ opacity: 0.6 }}>•</span>
                <Link href="/login" style={{ color: "white", fontWeight: 700 }}>
                  Log in
                </Link>
                <span style={{ opacity: 0.6 }}>•</span>
                <Link href="/support" style={{ color: "white", fontWeight: 700 }}>
                  Support
                </Link>
              </div>
              <div style={{ marginTop: 8, opacity: 0.7 }}>
                © {new Date().getFullYear()} Secret Scan Club
              </div>
            </div>
          </footer>
        </section>
      </div>
    </main>
  );
}
