import { useEffect, useRef, useState } from "react";
import { Shield } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import "./UserProfile.css";

export function UserProfile({ variant = "default", children }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  // El menu se cierra con Esc o con un clic/toque afuera.
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) return null;

  const initial = (user.firstName || user.email || "?").charAt(0).toUpperCase();
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;

  return (
    <div className={`user-profile ${variant}`} ref={rootRef}>
      <button
        type="button"
        className="user-profile-trigger"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Menú de usuario: ${fullName} (${user.role})`}
      >
        <span className="user-profile-avatar" aria-hidden="true">{initial}</span>
        <span className="user-profile-info">
          <span className="user-profile-name">{fullName}</span>
          <span className="user-role">
            <Shield size={12} />
            {user.role}
          </span>
        </span>
      </button>

      {open && children && (
        <div className="user-profile-dropdown" onClick={() => setOpen(false)}>
          {children}
        </div>
      )}
    </div>
  );
}
