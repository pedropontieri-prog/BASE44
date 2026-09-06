import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback
} from "react";
import { supabase } from "@/lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  const loadUserProfile = useCallback(async (authUser) => {
    if (!authUser) {
      return null;
    }

    const metadata = authUser.user_metadata || {};

    const userData = {
      id: authUser.id,
      email: authUser.email || "",
      name: metadata.name || metadata.full_name || "",
      full_name: metadata.full_name || metadata.name || "",
      avatar_url: metadata.avatar_url || null,
      role:
        metadata.role ||
        metadata.account_type ||
        metadata.user_type ||
        "patient",
      created_at: authUser.created_at,
      updated_at: authUser.updated_at || authUser.created_at,
      user_metadata: metadata
    };

    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .maybeSingle();

      if (error || !profile) {
        return userData;
      }

      return {
        ...userData,
        ...profile,
        id: authUser.id,
        email: authUser.email || profile.email || "",
        name: profile.name || profile.full_name || userData.name || "",
        full_name:
          profile.full_name ||
          profile.name ||
          userData.full_name ||
          "",
        avatar_url: profile.avatar_url || userData.avatar_url || null,
        role:
          profile.role ||
          profile.account_type ||
          profile.user_type ||
          userData.role ||
          "patient",
        user_metadata: metadata
      };
    } catch {
      return userData;
    }
  }, []);

  const checkUserAuth = useCallback(async () => {
    setIsLoadingAuth(true);
    setAuthError(null);

    try {
      const {
        data: { session },
        error: sessionError
      } = await supabase.auth.getSession();

      if (sessionError) {
        setUser(null);
        setIsAuthenticated(false);
        setAuthError(sessionError);
        return null;
      }

      if (!session?.user) {
        setUser(null);
        setIsAuthenticated(false);
        return null;
      }

      const profile = await loadUserProfile(session.user);

      setUser(profile);
      setIsAuthenticated(true);

      return profile;
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      setAuthError(error);
      return null;
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  }, [loadUserProfile]);

  const checkAppState = useCallback(async () => {
    setIsLoadingPublicSettings(true);

    try {
      const { data, error } = await supabase
        .from("app_public_settings")
        .select("*")
        .maybeSingle();

      if (error) {
        setAppPublicSettings(null);
        return null;
      }

      setAppPublicSettings(data || null);
      return data || null;
    } catch {
      setAppPublicSettings(null);
      return null;
    } finally {
      setIsLoadingPublicSettings(false);
    }
  }, []);

  const logout = useCallback(async (shouldRedirect = true) => {
    try {
      await supabase.auth.signOut();
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setAuthError(null);
      setAuthChecked(true);

      if (shouldRedirect) {
        window.location.href = "/";
      }
    }
  }, []);

  const navigateToLogin = useCallback(() => {
    const currentPath =
      window.location.pathname +
      window.location.search +
      window.location.hash;

    const returnTo = encodeURIComponent(currentPath);

    window.location.href = `/login?returnTo=${returnTo}`;
  }, []);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      if (!mounted) {
        return;
      }

      await Promise.all([
        checkUserAuth(),
        checkAppState()
      ]);
    };

    initialize();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) {
        return;
      }

      if (session?.user) {
        const profile = await loadUserProfile(session.user);

        if (!mounted) {
          return;
        }

        setUser(profile);
        setIsAuthenticated(true);
        setAuthError(null);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setAuthError(null);
      }

      setIsLoadingAuth(false);
      setAuthChecked(true);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [checkUserAuth, checkAppState, loadUserProfile]);

  const value = {
    user,
    isAuthenticated,
    isLoadingAuth,
    isLoadingPublicSettings,
    authError,
    authChecked,
    appPublicSettings,
    logout,
    navigateToLogin,
    checkUserAuth,
    checkAppState
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}

export default AuthContext;
