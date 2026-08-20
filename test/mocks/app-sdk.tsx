import type { ReactNode } from 'react'
import { vi } from 'vitest'

export const appSdkMocks = {
  get: vi.fn(),
  post: vi.fn(),
  navigate: vi.fn(),
  setNavBadge: vi.fn(),
}

export function useAppApi() {
  return {
    get: appSdkMocks.get,
    post: appSdkMocks.post,
    put: vi.fn(),
    patch: vi.fn(),
    del: vi.fn(),
  }
}

export function useNavigate() {
  return appSdkMocks.navigate
}

export function useNavBadge() {
  return appSdkMocks.setNavBadge
}

export function ChatEmbed({ slotKey, onSend, placeholder, aboveComposer }: { slotKey?: string; onSend?: (message: string) => Promise<void> | void; placeholder?: string; aboveComposer?: ReactNode }) {
  return (
    <div data-testid="chat-embed" data-slot={slotKey}>
      {aboveComposer}
      <input
        aria-label="Message to Conductor"
        placeholder={placeholder}
        onChange={event => { (event.target as HTMLInputElement).dataset.value = event.target.value }}
      />
      <button
        type="button"
        onClick={event => {
          const input = (event.currentTarget.parentElement?.querySelector('input') as HTMLInputElement | null)
          void onSend?.(input?.value ?? '')
        }}
      >
        Send
      </button>
    </div>
  )
}

export function AppApiProvider({ children }: { children: ReactNode }) {
  return children
}
