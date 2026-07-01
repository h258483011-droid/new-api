/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { nanoid } from 'nanoid'
import { STORAGE_KEYS, MESSAGE_ROLES } from '../constants'
import type {
  Message,
  ParameterEnabled,
  PlaygroundConfig,
  PlaygroundSession,
} from '../types'
import { getUserId } from '@/features/auth/lib/storage'
import { getCurrentVersion, sanitizeMessagesOnLoad } from './message-utils'

const LEGACY_STORAGE_KEYS = {
  MESSAGES: 'playground_messages',
} as const

const STORAGE_NAMESPACE_PREFIX = 'playground'

function getStorageNamespace(): string {
  const userId = getUserId()
  return userId ? `${STORAGE_NAMESPACE_PREFIX}:uid:${userId}` : `${STORAGE_NAMESPACE_PREFIX}:guest`
}

function makeNamespacedKey(key: string): string {
  return `${getStorageNamespace()}:${key}`
}

function readJson<T>(key: string): T | null {
  try {
    const saved = localStorage.getItem(key)
    if (!saved) return null
    return JSON.parse(saved) as T
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Failed to read ${key}:`, error)
    return null
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Failed to write ${key}:`, error)
  }
}

function truncateTitle(text: string, maxLength = 28): string {
  const normalized = text.trim().replace(/\s+/g, ' ')
  if (!normalized) return '新對話'
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, maxLength).trimEnd()}…`
}

export function deriveConversationTitle(messages: Message[]): string {
  const firstUserMessage = messages.find(
    (message) =>
      message.from === MESSAGE_ROLES.USER &&
      getCurrentVersion(message).content.trim()
  )

  if (!firstUserMessage) return '新對話'

  return truncateTitle(getCurrentVersion(firstUserMessage).content)
}

function normalizeSession(session: Partial<PlaygroundSession>): PlaygroundSession {
  const messages = Array.isArray(session.messages)
    ? sanitizeMessagesOnLoad(session.messages as Message[])
    : []
  const createdAt = Number(session.createdAt || Date.now())
  const updatedAt = Number(session.updatedAt || createdAt)
  const title =
    typeof session.title === 'string' && session.title.trim()
      ? session.title.trim()
      : deriveConversationTitle(messages)

  return {
    id:
      typeof session.id === 'string' && session.id.trim()
        ? session.id
        : nanoid(),
    title,
    pinned: Boolean(session.pinned),
    createdAt,
    updatedAt,
    messages,
  }
}

function sortSessions(sessions: PlaygroundSession[]): PlaygroundSession[] {
  return [...sessions].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    if (b.updatedAt !== a.updatedAt) return b.updatedAt - a.updatedAt
    return b.createdAt - a.createdAt
  })
}

export function createConversationSession(
  messages: Message[] = [],
  title?: string
): PlaygroundSession {
  const normalizedMessages = sanitizeMessagesOnLoad(messages)
  const now = Date.now()
  return {
    id: nanoid(),
    title: title?.trim() || deriveConversationTitle(normalizedMessages),
    pinned: false,
    createdAt: now,
    updatedAt: now,
    messages: normalizedMessages,
  }
}

export function loadSessions(): PlaygroundSession[] {
  migrateLegacyPlaygroundStorage()

  const namespacedSessionsKey = makeNamespacedKey(STORAGE_KEYS.SESSIONS)

  const rawSessions = readJson<Partial<PlaygroundSession>[]>(namespacedSessionsKey)

  if (Array.isArray(rawSessions) && rawSessions.length > 0) {
    const sessions = rawSessions.map((session) => normalizeSession(session))
    const sorted = sortSessions(sessions)
    return sorted
  }

  const legacyMessages = readJson<Message[]>(LEGACY_STORAGE_KEYS.MESSAGES)
  if (Array.isArray(legacyMessages) && legacyMessages.length > 0) {
    const session = createConversationSession(legacyMessages)
    const sessions = [session]
    saveSessions(sessions)
    try {
      localStorage.removeItem(LEGACY_STORAGE_KEYS.MESSAGES)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to clear legacy playground messages:', error)
    }
    return sessions
  }

  return [createConversationSession()]
}

export function saveSessions(sessions: PlaygroundSession[]): void {
  writeJson(makeNamespacedKey(STORAGE_KEYS.SESSIONS), sortSessions(sessions))
}

export function loadActiveSessionId(): string | null {
  migrateLegacyPlaygroundStorage()

  try {
    return localStorage.getItem(makeNamespacedKey(STORAGE_KEYS.ACTIVE_SESSION_ID))
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to load active session id:', error)
    return null
  }
}

export function saveActiveSessionId(sessionId: string): void {
  try {
    localStorage.setItem(makeNamespacedKey(STORAGE_KEYS.ACTIVE_SESSION_ID), sessionId)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to save active session id:', error)
  }
}

export function loadConfig(): Partial<PlaygroundConfig> {
  migrateLegacyPlaygroundStorage()

  return readJson<Partial<PlaygroundConfig>>(makeNamespacedKey(STORAGE_KEYS.CONFIG)) || {}
}

export function saveConfig(config: Partial<PlaygroundConfig>): void {
  writeJson(makeNamespacedKey(STORAGE_KEYS.CONFIG), config)
}

export function loadParameterEnabled(): Partial<ParameterEnabled> {
  migrateLegacyPlaygroundStorage()

  return readJson<Partial<ParameterEnabled>>(makeNamespacedKey(STORAGE_KEYS.PARAMETER_ENABLED)) || {}
}

export function saveParameterEnabled(
  parameterEnabled: Partial<ParameterEnabled>
): void {
  writeJson(makeNamespacedKey(STORAGE_KEYS.PARAMETER_ENABLED), parameterEnabled)
}

export function clearPlaygroundData(): void {
  try {
    localStorage.removeItem(makeNamespacedKey(STORAGE_KEYS.CONFIG))
    localStorage.removeItem(makeNamespacedKey(STORAGE_KEYS.PARAMETER_ENABLED))
    localStorage.removeItem(makeNamespacedKey(STORAGE_KEYS.SESSIONS))
    localStorage.removeItem(makeNamespacedKey(STORAGE_KEYS.ACTIVE_SESSION_ID))
    localStorage.removeItem(LEGACY_STORAGE_KEYS.MESSAGES)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to clear playground data:', error)
  }
}

export function updateSessionMessages(
  sessions: PlaygroundSession[],
  sessionId: string,
  messages: Message[]
): PlaygroundSession[] {
  const now = Date.now()
  const updated = sessions.map((session) => {
    if (session.id !== sessionId) return session

    const shouldAutoTitle =
      session.title === '新對話' || !session.title.trim().length
    const nextTitle = shouldAutoTitle
      ? deriveConversationTitle(messages)
      : session.title

    return {
      ...session,
      title: nextTitle,
      updatedAt: now,
      // Runtime updates must preserve in-flight streaming messages.
      // Only legacy/load-time recovery should sanitize incomplete responses.
      messages,
    }
  })
  return sortSessions(updated)
}

export function migrateLegacyPlaygroundStorage(): void {
  const namespacedSessionsKey = makeNamespacedKey(STORAGE_KEYS.SESSIONS)
  const hasNamespacedSessions = readJson<unknown>(namespacedSessionsKey)
  if (hasNamespacedSessions) {
    return
  }

  const legacySessions = readJson<unknown>(STORAGE_KEYS.SESSIONS)
  const legacyActiveSessionId = readJson<unknown>(
    STORAGE_KEYS.ACTIVE_SESSION_ID
  )
  const legacyConfig = readJson<unknown>(STORAGE_KEYS.CONFIG)
  const legacyParameterEnabled = readJson<unknown>(
    STORAGE_KEYS.PARAMETER_ENABLED
  )

  if (legacySessions !== null) {
    writeJson(namespacedSessionsKey, legacySessions)
    localStorage.removeItem(STORAGE_KEYS.SESSIONS)
  }

  if (legacyActiveSessionId !== null) {
    writeJson(
      makeNamespacedKey(STORAGE_KEYS.ACTIVE_SESSION_ID),
      legacyActiveSessionId
    )
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION_ID)
  }

  if (legacyConfig !== null) {
    writeJson(makeNamespacedKey(STORAGE_KEYS.CONFIG), legacyConfig)
    localStorage.removeItem(STORAGE_KEYS.CONFIG)
  }

  if (legacyParameterEnabled !== null) {
    writeJson(
      makeNamespacedKey(STORAGE_KEYS.PARAMETER_ENABLED),
      legacyParameterEnabled
    )
    localStorage.removeItem(STORAGE_KEYS.PARAMETER_ENABLED)
  }
}

export function updateSessionTitle(
  sessions: PlaygroundSession[],
  sessionId: string,
  title: string
): PlaygroundSession[] {
  const nextTitle = truncateTitle(title, 48)
  const updated = sessions.map((session) =>
    session.id === sessionId
      ? {
          ...session,
          title: nextTitle || '新對話',
          updatedAt: Date.now(),
        }
      : session
  )
  return sortSessions(updated)
}

export function updateSessionPinned(
  sessions: PlaygroundSession[],
  sessionId: string,
  pinned: boolean
): PlaygroundSession[] {
  const updated = sessions.map((session) =>
    session.id === sessionId ? { ...session, pinned } : session
  )
  return sortSessions(updated)
}

export function deleteSession(
  sessions: PlaygroundSession[],
  sessionId: string
): PlaygroundSession[] {
  const remaining = sessions.filter((session) => session.id !== sessionId)
  return remaining.length > 0 ? sortSessions(remaining) : [createConversationSession()]
}
