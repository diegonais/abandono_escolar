import {
  createContext,
  type PropsWithChildren,
  useContext,
  useMemo,
  useState,
} from "react";
import { clearSessionStorage, getStoredToken, getStoredUser, saveSession } from "@/features/auth/auth-storage";
import { type AuthSession, type AuthUser } from "@/types/auth";

interface AuthContextValue {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  signIn: (session: AuthSession) => void;
  signOut: () => void;
  updateUser: (user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());

  const contextValue = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      signIn: (session) => {
        saveSession(session);
        setToken(session.token);
        setUser(session.user);
      },
      signOut: () => {
        clearSessionStorage();
        setToken(null);
        setUser(null);
      },
      updateUser: (nextUser) => {
        const currentToken = token ?? getStoredToken();
        if (!currentToken) {
          return;
        }

        saveSession({ token: currentToken, user: nextUser });
        setUser(nextUser);
      },
    }),
    [token, user],
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
