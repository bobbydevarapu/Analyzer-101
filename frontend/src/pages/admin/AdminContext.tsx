import { createContext, ReactNode, useContext, useState } from "react";

export type AdminPage = "dashboard" | "assignments" | "teachers" | "students" | "alerts" | "settings";

interface AdminContextType {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  activePage: AdminPage;
  setActivePage: (page: AdminPage) => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activePage, setActivePage] = useState<AdminPage>("dashboard");

  return (
    <AdminContext.Provider value={{ collapsed, setCollapsed, mobileOpen, setMobileOpen, activePage, setActivePage }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used within AdminProvider");
  }
  return context;
}
