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
import type { PlaygroundConfig, ParameterEnabled } from './types'

export const MESSAGE_ROLES = {
  USER: 'user',
  ASSISTANT: 'assistant',
  SYSTEM: 'system',
} as const

export const MESSAGE_STATUS = {
  LOADING: 'loading',
  STREAMING: 'streaming',
  COMPLETE: 'complete',
  ERROR: 'error',
} as const

export const API_ENDPOINTS = {
  CHAT_COMPLETIONS: '/pg/chat/completions',
  USER_MODELS: '/api/user/models',
  USER_GROUPS: '/api/user/self/groups',
} as const

export const DEFAULT_GROUP = 'default' as const

export const DEFAULT_CONFIG: PlaygroundConfig = {
  model: 'gpt-4o',
  group: DEFAULT_GROUP,
  temperature: 0.7,
  top_p: 1,
  max_tokens: 4096,
  frequency_penalty: 0,
  presence_penalty: 0,
  seed: null,
  stream: true,
}

export const DEFAULT_PARAMETER_ENABLED: ParameterEnabled = {
  temperature: true,
  top_p: true,
  max_tokens: false,
  frequency_penalty: true,
  presence_penalty: true,
  seed: false,
}

export const STORAGE_KEYS = {
  CONFIG: 'playground_config',
  SESSIONS: 'playground_sessions',
  ACTIVE_SESSION_ID: 'playground_active_session_id',
  PARAMETER_ENABLED: 'playground_parameter_enabled',
} as const

export const ERROR_MESSAGES = {
  API_REQUEST_ERROR: '請求發生錯誤',
  NETWORK_ERROR: '網路連線失敗或伺服器未回應',
  PARSE_ERROR: '回應資料解析失敗',
  STREAM_START_ERROR: '建立串流連線失敗',
  CONNECTION_CLOSED: '連線已關閉',
  INTERRUPTED: '回應已中斷',
} as const

export const MESSAGE_ACTION_BUTTON_STYLES = {
  BASE: 'size-7 text-muted-foreground hover:text-foreground',
  DELETE: 'size-7 text-muted-foreground hover:text-destructive',
  ICON: 'size-4',
} as const

export const MESSAGE_ACTION_LABELS = {
  COPY: '複製',
  COPIED: '已複製',
  REGENERATE: '重新產生',
  EDIT: '編輯',
  DELETE: '刪除',
  NO_CONTENT: '目前沒有可複製的內容',
  WAIT_GENERATION: '請先等目前產生完成',
} as const
