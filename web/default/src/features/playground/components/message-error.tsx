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
import { AlertCircle, AlertTriangle, Settings } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { MESSAGE_STATUS } from '../constants'
import type { Message } from '../types'

interface MessageErrorProps {
  message: Message
  className?: string
}

export function MessageError({ message, className = '' }: MessageErrorProps) {
  const user = useAuthStore((s) => s.auth.user)
  const isAdmin = user?.role != null && user.role >= 10

  if (message.status !== MESSAGE_STATUS.ERROR) {
    return null
  }

  const errorContent = message.versions[0]?.content || '發生未預期的錯誤'
  const errorCode = message.errorCode || ''

  const parseHttpStatusTitle = (code: string) => {
    const match = /^http_(\d{3})$/.exec(code)
    if (!match) return null

    const status = Number(match[1])
    if (status === 401) return '尚未登入'
    if (status === 403) return '權限不足'
    if (status === 408) return '請求逾時'
    if (status === 429) return '請求太頻繁'
    if (status === 500) return '伺服器發生錯誤'
    if (status === 502) return '上游回應錯誤'
    if (status === 503) return '服務暫時無法使用'
    if (status === 504) return '上游回應逾時'

    return `HTTP ${status}`
  }

  const errorView = (() => {
    const httpTitle = parseHttpStatusTitle(errorCode)
    if (httpTitle) {
      return {
        variant: 'destructive' as const,
        icon: AlertCircle,
        title: httpTitle,
      }
    }

    switch (errorCode) {
      case 'model_price_error':
        return {
          variant: 'default' as const,
          icon: AlertTriangle,
          title: '模型費率尚未設定',
        }
      case 'stream_incomplete':
        return {
          variant: 'destructive' as const,
          icon: AlertCircle,
          title: '對話沒有正常結束',
        }
      case 'stream_interrupted':
      case 'connection_closed':
        return {
          variant: 'destructive' as const,
          icon: AlertCircle,
          title: '連線已中斷',
        }
      case 'do_request_failed':
        return {
          variant: 'destructive' as const,
          icon: AlertCircle,
          title: '無法連到上游',
        }
      case 'stream_start_error':
        return {
          variant: 'destructive' as const,
          icon: AlertCircle,
          title: '串流連線建立失敗',
        }
      case 'parse_error':
        return {
          variant: 'destructive' as const,
          icon: AlertCircle,
          title: '回應格式解析失敗',
        }
      case 'scanner_error':
        return {
          variant: 'destructive' as const,
          icon: AlertCircle,
          title: '串流解析失敗',
        }
      case 'ping_fail':
        return {
          variant: 'destructive' as const,
          icon: AlertCircle,
          title: '保活失敗',
        }
      case 'timeout':
        return {
          variant: 'destructive' as const,
          icon: AlertCircle,
          title: '回應逾時',
        }
      case 'client_gone':
        return {
          variant: 'destructive' as const,
          icon: AlertCircle,
          title: '連線已關閉',
        }
      case 'handler_stop':
        return {
          variant: 'destructive' as const,
          icon: AlertCircle,
          title: '回應已手動停止',
        }
      default:
        return {
          variant: 'destructive' as const,
          icon: AlertCircle,
          title: '錯誤',
        }
    }
  })()

  if (errorCode === 'model_price_error') {
    return (
      <Alert variant={errorView.variant} className={className}>
        <AlertTriangle className='text-orange-500' />
        <AlertTitle>{errorView.title}</AlertTitle>
        <AlertDescription className='space-y-2'>
          <p>{errorContent}</p>
          {isAdmin && (
            <Button
              variant='outline'
              size='sm'
              onClick={() =>
                window.open('/system-settings/billing/model-pricing', '_blank')
              }
            >
              <Settings className='mr-1 h-3.5 w-3.5' />
              前往設定
            </Button>
          )}
        </AlertDescription>
      </Alert>
    )
  }

  const Icon = errorView.icon

  return (
    <Alert variant={errorView.variant} className={className}>
      <Icon />
      <AlertTitle>{errorView.title}</AlertTitle>
      <AlertDescription>{errorContent}</AlertDescription>
    </Alert>
  )
}
