/**
 * Sprint 10: Notification Center
 */
import { useState, useCallback } from "react";

export interface Notification {
  id: string;
  type: "success" | "error" | "info";
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  nodeId?: string;
}

const STORAGE_KEY = "openflow_notifications";
const MAX_NOTIFICATIONS = 50;

function loadNotifications(): Notification[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}

function persistNotifications(notifs: Notification[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifs.slice(0, MAX_NOTIFICATIONS)));
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>(loadNotifications);

  const addNotification = useCallback((type: Notification["type"], title: string, message: string, nodeId?: string) => {
    const n: Notification = { id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, type, title, message, timestamp: Date.now(), read: false, nodeId };
    setNotifications(prev => { const next = [n, ...prev].slice(0, MAX_NOTIFICATIONS); persistNotifications(next); return next; });
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => { const next = prev.map(n => ({ ...n, read: true })); persistNotifications(next); return next; });
  }, []);

  const clearAll = useCallback(() => { setNotifications([]); persistNotifications([]); }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return { notifications, addNotification, markAllRead, clearAll, unreadCount };
}

export function NotificationBell({ unreadCount, onOpen }: { notifications: Notification[]; unreadCount: number; onOpen: () => void }) {
  return (
    <button onClick={onOpen} title="Notifications" style={{ position: "relative", width: 38, height: 38, borderRadius: 10, border: "1px solid #2a2a30", background: "#141416", color: "#9ca3af", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
      🔔
      {unreadCount > 0 && (
        <span style={{ position: "absolute", top: -4, right: -4, background: "#ef4444", color: "#fff", fontSize: 9, fontWeight: 700, borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  );
}

export function NotificationPanel({ notifications, onClose, onMarkAllRead, onClear, onJumpToNode }: {
  notifications: Notification[];
  onClose: () => void;
  onMarkAllRead: () => void;
  onClear: () => void;
  onJumpToNode?: (nodeId: string) => void;
}) {
  return (
    <div style={{ position: "fixed", top: 60, right: 16, width: 360, maxHeight: "70vh", background: "#fff", border: "1px solid #e8e8eb", borderRadius: 16, boxShadow: "0 12px 40px rgba(0,0,0,0.15)", zIndex: 900, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "16px 20px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f0f0f2" }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a" }}>Notifications</span>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={onMarkAllRead} style={{ padding: "4px 10px", background: "#f5f5f7", border: "none", borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: "pointer", color: "#6b7280" }}>Mark all read</button>
          <button onClick={onClear} style={{ padding: "4px 10px", background: "#fef2f2", border: "none", borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: "pointer", color: "#ef4444" }}>Clear</button>
          <button onClick={onClose} style={{ width: 24, height: 24, borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", fontSize: 14, color: "#9ca3af" }}>✕</button>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}>
        {notifications.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>No notifications yet</div>
        ) : (
          notifications.map(n => (
            <div key={n.id} onClick={() => { if (n.nodeId && onJumpToNode) onJumpToNode(n.nodeId); }}
              style={{ padding: "12px 20px", borderBottom: "1px solid #f5f5f7", cursor: n.nodeId ? "pointer" : "default", background: n.read ? "transparent" : "#f0f4ff", transition: "background 0.15s" }}
              onMouseOver={e => { if (n.nodeId) e.currentTarget.style.background = "#f5f5f7"; }}
              onMouseOut={e => { e.currentTarget.style.background = n.read ? "transparent" : "#f0f4ff"; }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                <span style={{ fontSize: 14 }}>{n.type === "success" ? "✅" : n.type === "error" ? "❌" : "ℹ️"}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#1a1a1a" }}>{n.title}</span>
                {!n.read && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#3b82f6" }} />}
              </div>
              <div style={{ fontSize: 11, color: "#6b7280", marginLeft: 22 }}>{n.message}</div>
              <div style={{ fontSize: 9, color: "#c4c4c8", marginLeft: 22, marginTop: 4 }}>{new Date(n.timestamp).toLocaleTimeString()}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
