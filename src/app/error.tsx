"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="planner-shell"><section className="paper-card">
    <p className="brand">Life Planner</p>
    <h1>Let’s try that again.</h1>
    <p className="intro" role="alert">We couldn’t open your account right now. Check your connection and try again.</p>
    <button className="primary-button" onClick={reset}>Try again</button>
  </section></main>;
}
