import React, {
  createContext,
  useState,
  useContext,
  useEffect,
} from 'react'
import { supabase } from '@/lib/supabase'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false)
  const [authError, setAuthError] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [appPublicSettings, setAppPublicSettings] = useState(null)

  const loadUserProfile = async (authUser) => {
    if (!authUser) {
      setUser(null)
      setIsAuthenticated(false)
      return null
    }

    /*
     * Mantemos o objeto do usuário compatível com o restante
     * da aplicação.
     *
     * Primeiro usamos os dados do Supabase Auth.
     */
    const userData = {
      id: authUser.id,
      email: authUser.email,
      name:
        authUser.user_metadata?.name ||
        authUser.user_metadata?.full_name ||
        '',
      full_name:
        authUser.user_metadata?.full_name ||
        authUser.user_metadata?.name ||
        '',
      avatar_url: authUser.user_metadata?.avatar_url || null,
      role: authUser.user_metadata?.role || 'patient',
      created_at: authUser.created_at,
      updated_at: authUser.updated_at,
    }

    /*
     * Se existir uma tabela profiles, tentamos carregar
     * informações adicionais sem impedir o login caso
     * o perfil ainda não exista.
     */
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle()

      if (!error && profile) {
        return {
          ...userData,
          ...profile,
          id: authUser.id,
          email: authUser.email,
        }
      }
    } catch (error) {
      console.warn('Não foi possível carregar o perfil:', error)
    }

    return userData
  }

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true)
      setAuthError(null)

      const {
        data: { user: currentUser },
        error,
      } = await supabase.auth.getUser()

      if (error) {
        throw error
      }

      if (!currentUser) {
        setUser(null)
        setIsAuthenticated(false)
        return null
      }

      const profile = await loadUserProfile(currentUser)

      setUser(profile)
      setIsAuthenticated(true)

      return profile
    } catch (error) {
      console.error('User auth check failed:', error)

      setUser(null)
      setIsAuthenticated(false)

      setAuthError({
        type: 'auth_required',
        message: error?.message || 'Authentication required',
      })

      return null
    } finally {
      setIsLoadingAuth(false)
      setAuthChecked(true)
    }
  }

  const checkAppState = async () => {
    try {
      setAuthError(null)
      setIsLoadingPublicSettings(false)

      await checkUserAuth()
    } catch (error) {
      console.error('Unexpected auth error:', error)

      setAuthError({
        type: 'unknown',
        message: error?.message || 'An unexpected error occurred',
      })

      setIsLoadingAuth(false)
      setAuthChecked(true)
    }
  }

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      if (!mounted) return

      await checkUserAuth()
    }

    initializeAuth()

    /*
     * Supabase avisa automaticamente quando:
     *
     * - usuário entra
     * - usuário sai
     * - sessão é renovada
     * - confirmação de e-mail acontece
     */
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      if (event === 'SIGNED_OUT') {
        setUser(null)
        setIsAuthenticated(false)
        setAuthChecked(true)
        setIsLoadingAuth(false)
        return
      }

      if (session?.user) {
        /*
         * Evita chamadas desnecessárias durante eventos
         * de renovação de sessão.
         */
        if (
          event === 'SIGNED_IN' ||
          event === 'USER_UPDATED' ||
          event === 'INITIAL_SESSION'
        ) {
          const profile = await loadUserProfile(session.user)

          if (!mounted) return

          setUser(profile)
          setIsAuthenticated(true)
          setAuthChecked(true)
          setIsLoadingAuth(false)
        }
      } else {
        setUser(null)
        setIsAuthenticated(false)
        setAuthChecked(true)
        setIsLoadingAuth(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const logout = async (shouldRedirect = true) => {
    try {
      setIsLoadingAuth(true)

      const { error } = await supabase.auth.signOut()

      if (error) {
        throw error
      }

      setUser(null)
      setIsAuthenticated(false)

      if (shouldRedirect) {
        window.location.href = '/'
      }
    } catch (error) {
      console.error('Logout failed:', error)

      setAuthError({
        type: 'logout_error',
        message: error?.message || 'Não foi possível sair da conta.',
      })
    } finally {
      setIsLoadingAuth(false)
    }
  }

  const navigateToLogin = () => {
    const currentPath =
      window.location.pathname +
      window.location.search +
      window.location.hash

    window.location.href = `/login?returnTo=${encodeURIComponent(currentPath)}`
  }

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
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
