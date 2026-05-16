// IPC Types
export interface IpcResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: unknown
  }
}

export type IpcChannel =
  | 'auth:connect'
  | 'auth:sign'
  | 'auth:disconnect'
  | 'account:list'
  | 'account:add'
  | 'account:update'
  | 'account:delete'
  | 'account:verify'
  | 'email:sync'
  | 'email:send'
  | 'email:list'
  | 'email:get'
  | 'email:get_folders'
  | 'email:mark_read'
  | 'email:delete'
  | 'signature:create'
  | 'signature:list'
  | 'signature:update'
  | 'signature:delete'
  | 'ai:generate'
  | 'ai:refine'
  | 'ai:classify_email'
  | 'ai:providers'
  | 'tag:create'
  | 'tag:list'
  | 'tag:apply'
  | 'tag:auto_apply'
  | 'tag:smart_folders'
  | 'chat:init'
  | 'chat:send'
  | 'chat:get_messages'
  | 'chat:get_conversations'
