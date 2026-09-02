import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { supabase } from "@/lib/supabase";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  const loadUserProfile = async (authUser) => {
    if (!authUser) {
      return null;
    }

    const userData = {
      id: authUser.id,
      email: authUser.email || "",
      name:
        authUser.user_metadata?.name ||
        authUser.user_metadata?.full_name ||
        "",
      full_name:
        authUser.user_metadata?.full_name ||
        authUser.user_metadata?.name ||
        "",
      avatar_url: authUser.user_metadata?.avatar_url || null,
      role: authUser.user_metadata?.role || "patient",
      created_at: authUser.created_at,
      updated_at: authUser.updated_at,
    };

    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .maybeSingle();

      if (!error && profile) {
        return {
          ...userData,
          ...profile,
          id: authUser.id,
          email: authUser.email || profile.email || "",
        };
      }
    } catch (error) {
      console.warn("Não foi possível carregar o perfil:", error);
    }

    return userData;
  };

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);
      setAuthError(null);

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        throw error;
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
      console.error("Erro ao verificar autenticação:", error);

      setUser(null);
      setIsAuthenticated(false);

      setAuthError({
        type: "auth_error",
        message:
          error?.message || "Não foi possível verificar sua autenticação.",
      });

      return null;
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  };

  const checkAppState = async () => {
    setIsLoadingPublicSettings(false);
    return checkUserAuth();
  };

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      await checkUserAuth();
    };

    initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === "SIGNED_OUT") {
        setUser(null);
        setIsAuthenticated(false);
        setAuthError(null);
        setAuthChecked(true);
        setIsLoadingAuth(false);
        return;
      }

      if (
        event === "SIGNED_IN" ||
        event === "USER_UPDATED" ||
        event === "INITIAL_SESSION"
      ) {
        if (session?.user) {
          const profile = await loadUserProfile(session.user);

          if (!mounted) return;

          setUser(profile);
          setIsAuthenticated(true);
          setAuthError(null);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }

        setAuthChecked(true);
        setIsLoadingAuth(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const logout = async (shouldRedirect = true) => {
    try {
      setIsLoadingAuth(true);
      setAuthError(null);

      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      setUser(null);
      setIsAuthenticated(false);

      if (shouldRedirect) {
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Erro ao sair:", error);

      setAuthError({
        type: "logout_error",
        message:
          error?.message || "Não foi possível sair da conta.",
      });
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const navigateToLogin = () => {
    const currentPath =
      window.location.pathname +
      window.location.search +
      window.location.hash;

    if (window.location.pathname === "/login") {
      return;
    }

    const returnTo =
      currentPath && currentPath !== "/login"
        ? `?returnTo=${encodeURIComponent(currentPath)}`
        : "";

    window.location.href = `/login${returnTo}`;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        appPublicSettings,
        authChecked,
        logout,
        navigateToLogin,
        checkUserAuth,
        checkAppState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
