import { createContext, ReactNode, useContext, useEffect, useState } from "react";

type User = {
  username: string;
  email?: string;
  role: "student" | "teacher" | "admin";
} | null;

interface AuthContextType {
  user: User;
  login: (userData: User) => void;
  logout: () => void;
  initialized: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
  initialized: false,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Try to restore user from localStorage, but validate with token first
    try {
      const savedUser = localStorage.getItem("user");
      const authToken = localStorage.getItem("authToken");
      const adminToken = localStorage.getItem("adminToken");
      const teacherToken = localStorage.getItem("teacherToken");

      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        // Only restore if it has required fields AND a valid token exists
        const hasValidToken = authToken || adminToken || teacherToken;
        
        if (parsed && parsed.username && parsed.role && hasValidToken) {
          setUser({
            username: parsed.username,
            email: parsed.email,
            role: parsed.role,
          });
        } else {
          // Remove invalid/incomplete session
          localStorage.removeItem("user");
          localStorage.removeItem("authToken");
          localStorage.removeItem("adminToken");
          localStorage.removeItem("teacherToken");
        }
      }
    } catch (e) {
      // Corrupted data, remove it
      localStorage.removeItem("user");
      localStorage.removeItem("authToken");
      localStorage.removeItem("adminToken");
      localStorage.removeItem("teacherToken");
    }
    setInitialized(true);
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem("user");
      localStorage.removeItem("authToken");
      localStorage.removeItem("teacherToken");
      localStorage.removeItem("adminToken");
      sessionStorage.removeItem("user");
    } catch (e) {
      // ignore
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, initialized }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);