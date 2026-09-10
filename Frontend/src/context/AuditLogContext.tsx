import { createContext, useContext, useState, ReactNode } from "react";

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  bidder: string;
  event: string;
  actor: string;
  detail: string;
}

interface AuditLogContextType {
  logs: AuditLogEntry[];
  addLog: (entry: Omit<AuditLogEntry, "id" | "timestamp"> & { timestamp?: string }) => void;
}

const AuditLogContext = createContext<AuditLogContextType | null>(null);

const INITIAL_LOG: AuditLogEntry[] = [
  {
    id: "l1",
    timestamp: "Today, 09:02 AM",
    bidder: "Sundaram Industrial Equipments Pvt. Ltd.",
    event: "AI verification completed",
    actor: "System",
    detail: "All statutory checks passed. Compliance score 96.",
  },
  {
    id: "l2",
    timestamp: "Today, 09:14 AM",
    bidder: "Coastal EPC Solutions",
    event: "EPFO compliance flagged",
    actor: "System",
    detail: "EPFO registration certificate found expired.",
  },
  {
    id: "l3",
    timestamp: "Today, 09:20 AM",
    bidder: "NovaTech OEM Partners",
    event: "Possible debarment match found",
    actor: "System",
    detail: "Name match on CPPP debarment list, pending confirmation.",
  },
  {
    id: "l4",
    timestamp: "Today, 08:40 AM",
    bidder: "Vikram Safety Systems",
    event: "Officer approved",
    actor: "Procurement Officer",
    detail: "Approved for tender award.",
  },
  {
    id: "l5",
    timestamp: "Yesterday, 04:52 PM",
    bidder: "Ganga Engineering Works",
    event: "Documents requested",
    actor: "Procurement Officer",
    detail: "Requested updated ESIC registration proof.",
  },
];

export function AuditLogProvider({ children }: { children: ReactNode }) {
  const [logs, setLogs] = useState<AuditLogEntry[]>(INITIAL_LOG);

  function addLog(entry: Omit<AuditLogEntry, "id" | "timestamp"> & { timestamp?: string }) {
    setLogs((prev) => [
      {
        id: `l${prev.length + 1}-${Date.now()}`,
        timestamp: entry.timestamp || "Just now",
        ...entry,
      },
      ...prev,
    ]);
  }

  return (
    <AuditLogContext.Provider value={{ logs, addLog }}>
      {children}
    </AuditLogContext.Provider>
  );
}

export function useAuditLog() {
  const ctx = useContext(AuditLogContext);
  if (!ctx) throw new Error("useAuditLog must be used within AuditLogProvider");
  return ctx;
}
