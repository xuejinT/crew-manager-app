declare module '@kirocrew/app-sdk' {
  export interface AppApi {
    get<T = unknown>(path: string, init?: RequestInit): Promise<T>
    post<T = unknown>(path: string, body?: unknown): Promise<T>
    put<T = unknown>(path: string, body?: unknown): Promise<T>
    patch<T = unknown>(path: string, body?: unknown): Promise<T>
    del<T = unknown>(path: string): Promise<T>
  }

  export interface AppInfo {
    name: string
    version: string
    permissions: {
      api: string[]
      events: string[]
    }
  }

  export function useAppApi(): AppApi
  export function useAppInfo(): AppInfo
  export function useNavigate(): (path: string) => void
  export function useNavBadge(): (count: number) => void
  export function useNotify(): (
    message: string,
    options?: { type?: 'info' | 'success' | 'error' },
  ) => void
  export function useAppEvents(event: string, callback: (data: unknown) => void): void
  // Native chat surface shared with the main ChatPage: markdown, OPTIONS buttons,
  // streaming, and persistence. onSend overrides the default POST /api/chat.
  export const ChatEmbed: import('react').ComponentType<{
    slotKey: string
    agent?: string
    placeholder?: string
    frameless?: boolean
    startAtBottom?: boolean
    slotControls?: boolean
    onSend?: (message: string) => Promise<unknown> | void
    aboveComposer?: import('react').ReactNode
  }>
}

declare module '@kirocrew/app-sdk/ui' {
  export const Badge: import('react').ComponentType<
    import('react').HTMLAttributes<HTMLSpanElement> & { variant?: 'err' | 'warn' | 'aim' | 'ok' | 'muted' }
  >
  export const Btn: import('react').ComponentType<import('react').ButtonHTMLAttributes<HTMLButtonElement>>
  export const SendBtn: import('react').ComponentType<import('react').ButtonHTMLAttributes<HTMLButtonElement>>
  export const Input: import('react').ComponentType<import('react').InputHTMLAttributes<HTMLInputElement>>
  export const SearchInput: import('react').ComponentType<import('react').InputHTMLAttributes<HTMLInputElement>>
  export const ContentSkeleton: import('react').ComponentType<{ rows?: number }>
  export const EmptyState: import('react').ComponentType<{
    icon?: import('react').ReactNode
    title: string
    subtitle?: string
    action?: import('react').ReactNode
  }>
  export const PageHeader: import('react').ComponentType<{ title: import('react').ReactNode; subtitle?: string; actions?: import('react').ReactNode }>
}
