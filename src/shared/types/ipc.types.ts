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
  | 'auth:unlock'
  | 'auth:sign'
  | 'auth:disconnect'
  | 'auth:current_wallet'
  | 'account:list'
  | 'account:add'
  | 'account:update'
  | 'account:delete'
  | 'account:verify'
  | 'account:list_providers'
  | 'account:detect_provider'
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
  | 'ai:configure_provider'
  | 'tag:create'
  | 'tag:list'
  | 'tag:update'
  | 'tag:apply'
  | 'tag:auto_apply'
  | 'tag:smart_folders'
  | 'tag:delete'
  | 'skill:create'
  | 'skill:list'
  | 'skill:get'
  | 'skill:update'
  | 'skill:delete'
  | 'skill:incr_use'
  | 'agent:create'
  | 'agent:list'
  | 'agent:get'
  | 'agent:update'
  | 'agent:delete'
  | 'agent:incr_use'
  | 'chat:init'
  | 'chat:send'
  | 'chat:get_messages'
  | 'chat:get_conversations'
