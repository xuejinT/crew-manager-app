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

export function ChatEmbed({ onSend }: { onSend?: (message: string) => Promise<void> }) {
  return (
    <button type="button" onClick={() => void onSend?.('What changed?')}>
      Ask Conductor
    </button>
  )
}

export function AppApiProvider({ children }: { children: ReactNode }) {
  return children
}
