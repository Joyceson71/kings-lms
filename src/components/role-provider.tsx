"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type Role = "admin" | "faculty" | "student";

interface RoleContextType {
  role: Role;
  setRole: (role: Role) => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<Role>("admin");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Only access localStorage in the browser
    const storedRole = localStorage.getItem("kings_mock_role") as Role;
    if (storedRole && ["admin", "faculty", "student"].includes(storedRole)) {
      setRoleState(storedRole);
    }
    setMounted(true);
  }, []);

  const setRole = (newRole: Role) => {
    setRoleState(newRole);
    localStorage.setItem("kings_mock_role", newRole);
  };

  if (!mounted) {
    return null; // Avoid hydration mismatch by waiting for mount
  }

  return (
    <RoleContext.Provider value={{ role, setRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return context;
}
