import { useEffect } from "react";
import { useRouter } from "next/router";

export default function BuildLivePage() {
  const router = useRouter();
  const { projectId } = router.query;

  useEffect(() => {
    if (!router.isReady) return;
    router.replace(projectId ? `/preview/${encodeURIComponent(projectId)}` : "/projects");
  }, [projectId, router]);

  return (
    <div className="empty-state" role="status" aria-busy="true">
      <div className="spinner" />
      <p>Opening the actual website project…</p>
    </div>
  );
}
