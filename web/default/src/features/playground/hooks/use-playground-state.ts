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
import { useCallback, useMemo, useState } from 'react'
import { nanoid } from 'nanoid'
import { DEFAULT_CONFIG, DEFAULT_PARAMETER_ENABLED } from '../constants'
import {
  clearPlaygroundData,
  createConversationSession,
  deleteSession,
  loadActiveSessionId,
  loadConfig,
  loadParameterEnabled,
  loadSessions,
  saveActiveSessionId,
  saveConfig,
  saveParameterEnabled,
  saveSessions,
  updateSessionMessages,
  updateSessionPinned,
  updateSessionTitle,
} from '../lib'
import type {
  Message,
  PlaygroundConfig,
  ParameterEnabled,
  ModelOption,
  GroupOption,
  PlaygroundSession,
} from '../types'

function getInitialSessionState() {
  const sessions = loadSessions()
  const savedActiveSessionId = loadActiveSessionId()
  const activeSessionId =
    (savedActiveSessionId &&
      sessions.some((session) => session.id === savedActiveSessionId) &&
      savedActiveSessionId) ||
    sessions[0]?.id ||
    createConversationSession().id

  return {
    sessions,
    activeSessionId,
  }
}

function sortSessionsByRecency(sessions: PlaygroundSession[]) {
  return [...sessions].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    if (b.updatedAt !== a.updatedAt) return b.updatedAt - a.updatedAt
    return b.createdAt - a.createdAt
  })
}

function ensureActiveSession(
  sessions: PlaygroundSession[],
  activeSessionId: string
) {
  const activeSession =
    sessions.find((session) => session.id === activeSessionId) ?? sessions[0]

  if (activeSession) {
    return activeSession
  }

  return createConversationSession()
}

/**
 * Main state management hook for playground
 */
export function usePlaygroundState() {
  const [config, setConfig] = useState<PlaygroundConfig>(() => {
    const savedConfig = loadConfig()
    return { ...DEFAULT_CONFIG, ...savedConfig }
  })

  const [parameterEnabled, setParameterEnabled] = useState<ParameterEnabled>(
    () => {
      const saved = loadParameterEnabled()
      return { ...DEFAULT_PARAMETER_ENABLED, ...saved }
    }
  )

  const initialSessionState = useMemo(() => getInitialSessionState(), [])
  const [sessions, setSessions] = useState<PlaygroundSession[]>(
    initialSessionState.sessions
  )
  const [activeSessionId, setActiveSessionId] = useState<string>(
    initialSessionState.activeSessionId
  )
  const [models, setModels] = useState<ModelOption[]>([])
  const [groups, setGroups] = useState<GroupOption[]>([])

  const activeSession = useMemo(
    () => ensureActiveSession(sessions, activeSessionId),
    [sessions, activeSessionId]
  )

  const persistSessions = useCallback(
    (updater: (prev: PlaygroundSession[]) => PlaygroundSession[]) => {
      setSessions((prev) => {
        const next = updater(prev)
        saveSessions(next)
        return next
      })
    },
    []
  )

  const updateConfig = useCallback(
    <K extends keyof PlaygroundConfig>(key: K, value: PlaygroundConfig[K]) => {
      setConfig((prev) => {
        const updated = { ...prev, [key]: value }
        saveConfig(updated)
        return updated
      })
    },
    []
  )

  const updateParameterEnabled = useCallback(
    (key: keyof ParameterEnabled, value: boolean) => {
      setParameterEnabled((prev) => {
        const updated = { ...prev, [key]: value }
        saveParameterEnabled(updated)
        return updated
      })
    },
    []
  )

  const updateMessages = useCallback(
    (updater: Message[] | ((prev: Message[]) => Message[])) => {
      setSessions((prevSessions) => {
        const current = ensureActiveSession(prevSessions, activeSessionId)
        const nextMessages =
          typeof updater === 'function' ? updater(current.messages) : updater
        const nextSessions = updateSessionMessages(
          prevSessions,
          current.id,
          nextMessages
        )
        saveSessions(nextSessions)
        return nextSessions
      })
    },
    [activeSessionId]
  )

  const createNewConversation = useCallback(() => {
    const session = createConversationSession()
    setSessions((prev) => {
      const next = sortSessionsByRecency([session, ...prev])
      saveSessions(next)
      return next
    })
    setActiveSessionId(session.id)
    saveActiveSessionId(session.id)
  }, [])

  const selectConversation = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId)
    saveActiveSessionId(sessionId)
  }, [])

  const renameConversation = useCallback(
    (sessionId: string, title: string) => {
      persistSessions((prev) => updateSessionTitle(prev, sessionId, title))
    },
    [persistSessions]
  )

  const togglePinConversation = useCallback(
    (sessionId: string) => {
      persistSessions((prev) => {
        const target = prev.find((session) => session.id === sessionId)
        if (!target) return prev
        const next = updateSessionPinned(prev, sessionId, !target.pinned)
        return sortSessionsByRecency(next)
      })
    },
    [persistSessions]
  )

  const removeConversation = useCallback(
    (sessionId: string) => {
      setSessions((prev) => {
        const next = deleteSession(prev, sessionId)
        saveSessions(next)

        if (sessionId === activeSessionId) {
          const fallback = next[0]?.id ?? nanoid()
          setActiveSessionId(fallback)
          saveActiveSessionId(fallback)
        }

        return next
      })
    },
    [activeSessionId]
  )

  const clearMessages = useCallback(() => {
    updateMessages([])
  }, [updateMessages])

  const resetConfig = useCallback(() => {
    setConfig(DEFAULT_CONFIG)
    setParameterEnabled(DEFAULT_PARAMETER_ENABLED)
    saveConfig(DEFAULT_CONFIG)
    saveParameterEnabled(DEFAULT_PARAMETER_ENABLED)
  }, [])

  const clearAllPlaygroundData = useCallback(() => {
    clearPlaygroundData()
    const freshSession = createConversationSession()
    setConfig(DEFAULT_CONFIG)
    setParameterEnabled(DEFAULT_PARAMETER_ENABLED)
    setSessions([freshSession])
    setActiveSessionId(freshSession.id)
    saveConfig(DEFAULT_CONFIG)
    saveParameterEnabled(DEFAULT_PARAMETER_ENABLED)
    saveSessions([freshSession])
    saveActiveSessionId(freshSession.id)
  }, [])

  return {
    // State
    config,
    parameterEnabled,
    messages: activeSession.messages,
    sessions,
    activeSessionId,
    activeSession,
    models,
    groups,

    // Setters
    setModels,
    setGroups,

    // Actions
    updateConfig,
    updateParameterEnabled,
    updateMessages,
    clearMessages,
    resetConfig,
    createNewConversation,
    selectConversation,
    renameConversation,
    togglePinConversation,
    removeConversation,
    clearAllPlaygroundData,
  }
}
