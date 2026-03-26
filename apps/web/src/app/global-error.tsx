"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="zh-HK">
      <body
        style={{
          margin: 0,
          fontFamily: "'DM Sans', 'Noto Sans TC', system-ui, sans-serif",
          backgroundColor: "#FAF8F5",
          color: "#2C2C2C",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center", padding: "2rem", maxWidth: "420px" }}>
          <p style={{ fontSize: "4rem", margin: "0 0 1.5rem" }}>🍷</p>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 600,
              margin: "0 0 0.75rem",
            }}
          >
            Oops, something went wrong
          </h1>
          <p
            style={{
              fontSize: "0.875rem",
              color: "#6B6560",
              margin: "0 0 2rem",
              lineHeight: 1.6,
            }}
          >
            We ran into an unexpected error. Please try again, or go back to the home page.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
            <button
              onClick={() => reset()}
              style={{
                padding: "0.625rem 1.25rem",
                backgroundColor: "#5B2E35",
                color: "#fff",
                border: "none",
                borderRadius: "0.75rem",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Try Again
            </button>
            <a
              href="/zh-HK"
              style={{
                padding: "0.625rem 1.25rem",
                backgroundColor: "transparent",
                color: "#2C2C2C",
                border: "1px solid #E5DDD4",
                borderRadius: "0.75rem",
                fontSize: "0.875rem",
                fontWeight: 500,
                textDecoration: "none",
                cursor: "pointer",
              }}
            >
              Back to Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
