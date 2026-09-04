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
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] =
    useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  const loadUserProfile = async (authUser) => {
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
      role: metadata.role || "patient",
      created_at: authUser.created_at,
      updated_at: authUser.updated_at || authUser.created_at,
      user_metadata: metadata,
    };

    try {
      const {
        data: profile,
        error,
      } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .maybeSingle();

      if (error) {
        console.warn(
          "Não foi possível carregar o perfil:",
          error
        );

        return userData;
      }

      if (!profile) {
        return userData;
      }

      return {
        ...userData,
        ...profile,

        id: authUser.id,

        email:
          authUser.email ||
          profile.email ||
          "",

        name:
          profile.name ||
          profile.full_name ||
          userData.name,

        full_name:
          profile.full_name ||
          profile.name ||
          userData.full_name,

        avatar_url:
          profile.avatar_url ||
          userData.avatar_url,

        role:
          profile.role ||
          userData.role,

        user_metadata: metadata,
      };
    } catch (error) {
      console.warn(
        "Erro inesperado ao carregar o perfil:",
        error
      );

      return userData;
    }
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
      console.error(
        "Erro ao verificar autenticação:",
        error
      );

      setUser(null);
      setIsAuthenticated(false);

      setAuthError({
        type: "auth_error",
        message:
          error?.message ||
          "Não foi possível verificar sua autenticação.",
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

    const initializeAuth = async () => {
      await checkUserAuth();
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) {
          return;
        }

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
          if (!session?.user) {
            setUser(null);
            setIsAuthenticated(false);
            setAuthChecked(true);
            setIsLoadingAuth(false);

            return;
          }

          const profile = await loadUserProfile(
            session.user
          );

          if (!mounted) {
            return;
          }

          setUser(profile);
          setIsAuthenticated(true);
          setAuthError(null);
          setAuthChecked(true);
          setIsLoadingAuth(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const logout = async (shouldRedirect = true) => {
    try {
      setIsLoadingAuth(true);
      setAuthError(null);

      const { error } =
        await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      setUser(null);
      setIsAuthenticated(false);
      setAuthChecked(true);

      if (shouldRedirect) {
        window.location.href = "/";
      }
    } catch (error) {
      console.error(
        "Erro ao sair:",
        error
      );

      setAuthError({
        type: "logout_error",
        message:
          error?.message ||
          "Não foi possível sair da conta.",
      });
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const navigateToLogin = () => {
    const pathname = window.location.pathname;
    const search = window.location.search;
    const hash = window.location.hash;

    if (pathname === "/login") {
      return;
    }

    const currentPath =
      `${pathname}${search}${hash}`;

    const returnTo =
      currentPath &&
      currentPath !== "/login"
        ? `?returnTo=${encodeURIComponent(
            currentPath
          )}`
        : "";

    window.location.href =
      `/login${returnTo}`;
  };

  const value = {
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
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used within an AuthProvider"
    );
  }

  return context;
};
