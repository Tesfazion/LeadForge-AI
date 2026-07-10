import "../styles/globals.css";
import Layout from "../components/Layout";
import ToastContainer from "../components/Toast";
import Head from "next/head";

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>LeadForge AI - Automated Lead-to-Deployment Platform</title>
        <meta name="description" content="AI-powered platform that automates lead discovery, outreach, conversations, and website deployment" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/LeadForge AI Agent logo.png" />
      </Head>
      <Layout>
        <Component {...pageProps} />
      </Layout>
      <ToastContainer />
    </>
  );
}
