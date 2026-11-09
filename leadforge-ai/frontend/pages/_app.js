import "../styles/globals.css";
import Layout from "../components/Layout";
import ToastContainer from "../components/Toast";
import Head from "next/head";
import { useEffect, useState } from "react";
import { setApiTokenProvider } from "../lib/api";
import { supabase } from "../lib/supabase";

const STANDALONE_ROUTES = ["/"];

function AuthenticationGate({ Component, pageProps }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    let active = true;
    setApiTokenProvider(async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data.session?.access_token ?? null;
    });

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) setAuthError(error.message);
      setSession(data.session);
      setLoading(false);
    }).catch((error) => {
      if (!active) return;
      setAuthError(error.message || "Unable to load your session.");
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthError("");
    });

    return () => {
      active = false;
      subscription.unsubscribe();
      setApiTokenProvider(null);
    };
  }, []);

  if (loading) {
    return <main className="auth-gate"><p role="status">Loading your workspace…</p></main>;
  }

  if (!session) {
    return <SignInForm authError={authError} />;
  }

  return (
    <Layout
      userEmail={session.user.email}
      authError={authError}
      onSignOut={async () => {
        const { error } = await supabase.auth.signOut();
        if (error) setAuthError(error.message);
      }}
    >
      <Component {...pageProps} />
    </Layout>
  );
}

function SignInForm({ authError }) {
  const [mode, setMode] = useState("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    setSubmitting(true);

    try {
      if (mode === "sign-up") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/dashboard` },
        });
        if (signUpError) throw signUpError;
        if (!data.session) {
          setNotice("Check your email to confirm your account, then sign in.");
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      }
    } catch (submitError) {
      setError(submitError.message || "Authentication failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-gate">
      <section className="auth-gate-card">
        <img src="/LeadForge AI Agent logo.png" alt="" width="56" height="56" />
        <p className="auth-eyebrow">LEADFORGE AI</p>
        <h1>{mode === "sign-in" ? "Welcome back." : "Create your workspace."}</h1>
        <p>Sign in to manage your leads, automations, and customer projects.</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="auth-email">Email</label>
          <input
            id="auth-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <label htmlFor="auth-password">Password</label>
          <input
            id="auth-password"
            type="password"
            autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          {(error || authError) && <p className="auth-message error" role="alert">{error || authError}</p>}
          {notice && <p className="auth-message" role="status">{notice}</p>}
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? "Please wait…" : mode === "sign-in" ? "Sign in" : "Create account"}
          </button>
        </form>
        <button
          className="auth-mode-toggle"
          type="button"
          onClick={() => {
            setMode((current) => current === "sign-in" ? "sign-up" : "sign-in");
            setError("");
            setNotice("");
          }}
        >
          {mode === "sign-in" ? "New to LeadForge? Create an account" : "Already have an account? Sign in"}
        </button>
      </section>
    </main>
  );
}

export default function App({ Component, pageProps, router }) {
  const isStandalone = STANDALONE_ROUTES.includes(router.pathname);

  return (
    <>
      <Head>
        <title>LeadForge AI - Automated Lead-to-Deployment Platform</title>
        <meta name="description" content="AI-powered platform that automates lead discovery, outreach, conversations, and website deployment" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/LeadForge AI Agent logo.png" />
      </Head>
      {isStandalone ? (
        <Component {...pageProps} />
      ) : !supabase ? (
        <main className="auth-gate">
          <div className="auth-gate-card">
            <p className="auth-eyebrow">AUTHENTICATION SETUP REQUIRED</p>
            <h1>Connect Supabase to open LeadForge.</h1>
            <p>
              Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in
              frontend/.env.local, and SUPABASE_URL plus SUPABASE_ANON_KEY in
              backend/.env. Use your project URL and public anon/publishable key.
            </p>
          </div>
        </main>
      ) : (
        <AuthenticationGate Component={Component} pageProps={pageProps} />
      )}
      <ToastContainer />
    </>
  );
}
