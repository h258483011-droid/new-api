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
import { useEffect, useMemo, useState } from 'react'
import { MoreVertical, PencilLine, Pin, PinOff, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { cn } from '@/lib/utils'
import type { PlaygroundSession } from '../types'

type PlaygroundHistorySidebarProps = {
  sessions: PlaygroundSession[]
  activeSessionId: string
  onCreateConversation: () => void
  onSelectConversation: (sessionId: string) => void
  onTogglePinConversation: (sessionId: string) => void
  onRenameConversation: (sessionId: string, title: string) => void
  onDeleteConversation: (sessionId: string) => void
}

function formatRelativeTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp
  const diffMinutes = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMinutes < 1) return '剛剛'
  if (diffMinutes < 60) return `${diffMinutes} 分`
  if (diffHours < 24) return `${diffHours} 小時`
  if (diffDays < 7) return `${diffDays} 天`

  return new Date(timestamp).toLocaleDateString('zh-TW', {
    month: 'short',
    day: 'numeric',
  })
}

export function PlaygroundHistorySidebar({
  sessions,
  activeSessionId,
  onCreateConversation,
  onSelectConversation,
  onTogglePinConversation,
  onRenameConversation,
  onDeleteConversation,
}: PlaygroundHistorySidebarProps) {
  const [renameSession, setRenameSession] = useState<PlaygroundSession | null>(
    null
  )
  const [renameText, setRenameText] = useState('')
  const [deleteSession, setDeleteSession] = useState<PlaygroundSession | null>(
    null
  )

  useEffect(() => {
    if (!renameSession) return
    setRenameText(renameSession.title)
  }, [renameSession])

  const orderedSessions = useMemo(
    () =>
      [...sessions].sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
        if (b.updatedAt !== a.updatedAt) return b.updatedAt - a.updatedAt
        return b.createdAt - a.createdAt
      }),
    [sessions]
  )

  const submitRename = () => {
    const title = renameText.trim()
    if (!renameSession || !title) return
    onRenameConversation(renameSession.id, title)
    setRenameSession(null)
  }

  const deleteConversationTitle = deleteSession?.title || '新對話'

  return (
    <aside className='border-border/60 bg-background/80 flex h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl border shadow-sm backdrop-blur'>
      <div className='border-border/60 flex items-center justify-between gap-2 border-b px-3 py-2'>
        <div className='min-w-0'>
          <p className='truncate text-sm font-semibold'>對話紀錄</p>
        </div>
        <Button onClick={onCreateConversation} size='xs' type='button'>
          <Plus className='mr-1 size-3.5' />
          新對話
        </Button>
      </div>

      <ScrollArea className='min-h-0 flex-1'>
        <div className='space-y-1 p-1.5'>
          {orderedSessions.length === 0 ? (
            <div className='text-muted-foreground flex min-h-24 flex-col items-center justify-center gap-1 px-3 py-3 text-center'>
              <p className='text-xs'>目前還沒有對話紀錄</p>
              <Button onClick={onCreateConversation} size='xs' type='button'>
                建立第一個對話
              </Button>
            </div>
          ) : (
            orderedSessions.map((session) => {
              const isActive = session.id === activeSessionId

              return (
                <div
                  className={cn(
                    'group border-border/60 hover:bg-accent/60 flex items-center gap-1.5 rounded-lg border px-2 py-1.5 transition-colors',
                    isActive && 'bg-accent border-accent-foreground/10'
                  )}
                  key={session.id}
                >
                  <button
                    className='flex min-w-0 flex-1 flex-col gap-0.5 rounded-md px-1 py-0.5 text-left'
                    onClick={() => onSelectConversation(session.id)}
                    type='button'
                  >
                    <div className='flex items-center gap-1.5'>
                      <p className='truncate text-xs font-medium'>
                        {session.title || '新對話'}
                      </p>
                      {session.pinned && (
                        <Pin className='text-muted-foreground size-3 shrink-0' />
                      )}
                    </div>
                  </button>

                  <span className='text-muted-foreground shrink-0 text-[10px] tabular-nums'>
                    {formatRelativeTime(session.updatedAt)}
                  </span>

                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          className='opacity-100 md:opacity-0 md:group-hover:opacity-100'
                          onClick={(event) => event.stopPropagation()}
                          size='icon-xs'
                          type='button'
                          variant='ghost'
                        />
                      }
                    >
                      <MoreVertical className='size-3.5' />
                      <span className='sr-only'>更多</span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align='end'
                      onClick={(event) => event.stopPropagation()}
                    >
                      <DropdownMenuItem
                        onSelect={() => onTogglePinConversation(session.id)}
                      >
                        {session.pinned ? (
                          <PinOff className='mr-2 size-4' />
                        ) : (
                          <Pin className='mr-2 size-4' />
                        )}
                        {session.pinned ? '取消釘選' : '釘選'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => setRenameSession(session)}>
                        <PencilLine className='mr-2 size-4' />
                        重新命名
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className='text-destructive focus:text-destructive'
                        onSelect={() => setDeleteSession(session)}
                      >
                        <Trash2 className='mr-2 size-4' />
                        刪除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )
            })
          )}
        </div>
      </ScrollArea>

      <Dialog
        onOpenChange={(open) => {
          if (!open) setRenameSession(null)
        }}
        open={renameSession !== null}
      >
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>重新命名對話</DialogTitle>
            <DialogDescription>幫這段對話取一個好記的名稱。</DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            maxLength={64}
            onChange={(event) => setRenameText(event.target.value)}
            placeholder='輸入新名稱'
            value={renameText}
          />
          <DialogFooter>
            <Button
              onClick={() => setRenameSession(null)}
              type='button'
              variant='outline'
            >
              取消
            </Button>
            <Button
              disabled={!renameText.trim()}
              onClick={submitRename}
              type='button'
            >
              確定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteSession !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteSession(null)
        }}
        title='刪除對話'
        desc={`確定要刪除「${deleteConversationTitle}」嗎？`}
        destructive
        cancelBtnText='取消'
        confirmText='刪除'
        handleConfirm={() => {
          if (!deleteSession) return
          onDeleteConversation(deleteSession.id)
          setDeleteSession(null)
        }}
      />
    </aside>
  )
}
