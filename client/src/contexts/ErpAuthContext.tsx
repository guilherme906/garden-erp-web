import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type ErpUser = {
  id: number;
  nome: string;
  email: string | null;
  telefone: string | null;
  perfil: "ADMIN" | "VENDEDOR";
};

type ErpAuthContextType = {
  erpUser: ErpUser | null;
  setErpUser: (user: ErpUser | null) => void;
  erpLogout: () => void;
  isAdmin: boolean;
};

const ErpAuthContext = createContext<ErpAuthContextType>({
  erpUser: null,
  setErpUser: () => {},
  erpLogout: () => {},
  isAdmin: false,
});

export function ErpAuthProvider({ children }: { children: ReactNode }) {
  const [erpUser, setErpUserState] = useState<ErpUser | null>(() => {
    try {
      const saved = localStorage.getItem("erp_user");
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const setErpUser = (user: ErpUser | null) => {
    setErpUserState(user);
    if (user) {
      localStorage.setItem("erp_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("erp_user");
    }
  };

  const erpLogout = () => {
    setErpUser(null);
  };

  return (
    <ErpAuthContext.Provider value={{ erpUser, setErpUser, erpLogout, isAdmin: erpUser?.perfil === "ADMIN" }}>
      {children}
    </ErpAuthContext.Provider>
  );
}

export function useErpAuth() {
  return useContext(ErpAuthContext);
}
