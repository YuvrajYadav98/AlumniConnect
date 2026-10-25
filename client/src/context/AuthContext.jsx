import { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  loginUser as apiLogin,
  registerUser as apiRegister,
  logoutUser as apiLogout,
  getCurrentUser as apiGetCurrentUser,
} from "../services/authService";
import { getErrorMessage } from "../utils/getErrorMessage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // `loading` covers the initial "am I already logged in?" check on app
  // load. Consumers (like ProtectedRoute) wait for this before deciding
  // to redirect, so a page refresh doesn't briefly bounce a logged-in
  // user to the login page.
  const [loading, setLoading] = useState(true);

  // On first mount, ask the backend who (if anyone) the current cookie
  // belongs to. This is what keeps a session alive across page refreshes.
  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const data = await apiGetCurrentUser();
        if (isMounted) setUser(data.user);
      } catch {
        // No valid session - that's a normal, expected state, not an error
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await apiLogin(credentials); // throws on failure - let caller catch it
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await apiRegister(payload);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } finally {
      // Always clear local state, even if the network call fails,
      // so the UI never gets stuck showing a "logged in" state.
      setUser(null);
    }
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    // Exposed for cases where a sub-page needs to patch the current
    // user in place (e.g. after a profile image upload) without a
    // full re-fetch. Prefer the dedicated actions above where possible.
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Re-exported for pages that only need the error-message helper
// alongside auth actions.
export { getErrorMessage };
