import { useState, useEffect } from "react";

let toastRef = null;

export const showToast = (message, type = "success") => {
  if (toastRef) {
    toastRef(message, type);
  }
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    toastRef = (message, type) => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, message, type }]);
      
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    };

    return () => {
      toastRef = null;
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: "fixed",
      top: "24px",
      right: "24px",
      zIndex: 9999,
      display: "flex",
      flexDirection: "column",
      gap: "12px",
    }}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="toast"
          style={{
            padding: "16px 20px",
            borderRadius: "var(--radius)",
            background: "white",
            border: `1px solid ${
              toast.type === "success" ? "var(--success-200)" :
              toast.type === "error" ? "var(--error-200)" :
              toast.type === "warning" ? "var(--warning-200)" :
              "var(--border)"
            }`,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            minWidth: "320px",
            maxWidth: "480px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            animation: "slideInRight 0.3s ease-out",
          }}
        >
          <div style={{
            width: "20px",
            height: "20px",
            color: toast.type === "success" ? "var(--success)" :
                   toast.type === "error" ? "var(--error)" :
                   toast.type === "warning" ? "var(--warning)" :
                   "var(--primary)",
            flexShrink: 0,
          }}>
            {toast.type === "success" && (
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {toast.type === "error" && (
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {toast.type === "warning" && (
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            )}
          </div>
          <div style={{ 
            fontSize: "14px", 
            fontWeight: 500,
            flex: 1,
          }}>
            {toast.message}
          </div>
        </div>
      ))}
    </div>
  );
}
