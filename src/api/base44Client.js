```javascript
import { supabase } from '@/lib/supabase'

/**
 * Cliente de compatibilidade da aplicação EntreNós.
 *
 * O projeto está migrando do Base44 para o Supabase.
 *
 * Novas funcionalidades devem utilizar diretamente:
 *
 * import { supabase } from '@/lib/supabase'
 *
 * Este arquivo existe apenas para manter compatibilidade
 * com componentes antigos que ainda utilizam "base44".
 */

export const base44 = {
  auth: {
    /**
     * Retorna o usuário atualmente autenticado.
     */
    async me() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error) {
        throw error
      }

      if (!user) {
        const authError = new Error('Usuário não autenticado')
        authError.status = 401
        throw authError
      }

      const metadata = user.user_metadata || {}

      return {
        id: user.id,
        email: user.email || '',
        name: metadata.name || metadata.full_name || '',
        full_name: metadata.full_name || metadata.name || '',
        avatar_url: metadata.avatar_url || null,
        role: metadata.role || 'patient',
        created_at: user.created_at,
        updated_at: user.updated_at || user.created_at,
        user_metadata: metadata,
      }
    },

    /**
     * Encerra a sessão do usuário.
     */
    async logout() {
      const { error } = await supabase.auth.signOut()

      if (error) {
        throw error
      }

      window.location.href = '/'
    },

    /**
     * Redireciona o usuário para a tela de login.
     *
     * O endereço atual é preservado para permitir
     * o retorno após a autenticação.
     */
    async redirectToLogin(returnUrl = window.location.href) {
      try {
        const url = new URL(returnUrl, window.location.origin)

        const returnTo = encodeURIComponent(
          url.pathname + url.search + url.hash
        )

        window.location.href = `/login?returnTo=${returnTo}`
      } catch {
        window.location.href = '/login'
      }
    },
  },

  /**
   * Compatibilidade temporária com páginas antigas.
   *
   * As entidades devem ser migradas individualmente
   * para consultas utilizando o Supabase.
   */
  entities: {},

  /**
   * Compatibilidade temporária.
   */
  functions: {},

  /**
   * Compatibilidade temporária.
   */
  integrations: {},
}

/**
 * Exporta o cliente Supabase para facilitar a migração
 * dos componentes antigos.
 */
export { supabase }
```
