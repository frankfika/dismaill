// IPC Channel 常量定义
// 命名规范: "模块:动作"

export const IPC_CHANNELS = {
  // 认证相关
  AUTH: {
    CONNECT: 'auth:connect',
    SIGN: 'auth:sign',
    DISCONNECT: 'auth:disconnect',
  },

  // 邮件相关
  EMAIL: {
    SYNC: 'email:sync',
    SEND: 'email:send',
    LIST: 'email:list',
    GET: 'email:get',
    GET_FOLDERS: 'email:get_folders',
    MARK_READ: 'email:mark_read',
    DELETE: 'email:delete',
  },

  // 签名相关
  SIGNATURE: {
    CREATE: 'signature:create',
    LIST: 'signature:list',
    UPDATE: 'signature:update',
    DELETE: 'signature:delete',
  },

  // AI 相关
  AI: {
    GENERATE: 'ai:generate',
    REFINE: 'ai:refine',
    CLASSIFY_EMAIL: 'ai:classify_email',
    PROVIDERS: 'ai:providers',
  },

  // 标签相关
  TAG: {
    CREATE: 'tag:create',
    LIST: 'tag:list',
    APPLY: 'tag:apply',
    AUTO_APPLY: 'tag:auto_apply',
    SMART_FOLDERS: 'tag:smart_folders',
  },

  // 聊天相关 (V2.0)
  CHAT: {
    INIT: 'chat:init',
    SEND: 'chat:send',
    GET_MESSAGES: 'chat:get_messages',
    GET_CONVERSATIONS: 'chat:get_conversations',
  },

  // 账户相关
  ACCOUNT: {
    ADD: 'account:add',
    LIST: 'account:list',
    UPDATE: 'account:update',
    DELETE: 'account:delete',
    VERIFY: 'account:verify',
  },
} as const

export type IpcChannelType = typeof IPC_CHANNELS
