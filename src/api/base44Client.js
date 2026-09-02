import { supabase } from '@/lib/supabase'

/*
 * Cliente de compatibilidade da EntreNós.
 *
 * A aplicação está migrando do Base44 para o Supabase.
 * Novas funcionalidades devem usar diretamente:
 *
 * import { supabase } from '@/lib/supabase'
 */

export const base44 = {
  auth: {
    async me() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error) throw error

      if (!user) {
        const error = new Error('Usuário não autenticado')
        error.status = 401
        throw error
      }

      return {
        id: user.id,
        email: user.email,
        name:
          user.user_metadata?.name ||
          user.user_metadata?.full_name ||
          '',
        full_name:
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          '',
        avatar_url: user.user_metadata?.avatar_url || null,
        role: user.user_metadata?.role || 'patient',
        created_at: user.created_at,
        updated_at: user.updated_at,
        user_metadata: user.user_metadata,
      }
    },

    async logout() {
      const { error } = await supabase.auth.signOut()

      if (error) {
        throw error
      }

      window.location.href = '/'
    },

    async redirectToLogin(returnUrl = window.location.href) {
      const returnTo = encodeURIComponent(
        new URL(returnUrl).pathname +
          new URL(returnUrl).search +
          new URL(returnUrl).hash
      )

      window.location.href = `/login?returnTo=${returnTo}`
    },
  },

  /*
   * Mantido temporariamente para impedir que páginas antigas
   * que ainda importam "base44" quebrem durante a migração.
   *
   * As entidades serão migradas individualmente para Supabase.
   */
  entities: {},

  functions: {},

  integrations: {},
}

export { supabase }
