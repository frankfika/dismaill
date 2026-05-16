# Aura — 测试用例文档

## 目录

1. [测试策略概述](#1-测试策略概述)
2. [UX 测试用例](#2-ux-测试用例)
3. [单元测试用例](#3-单元测试用例)
4. [集成测试用例](#4-集成测试用例)
5. [E2E 测试用例](#5-e2e-测试用例)
6. [性能测试用例](#6-性能测试用例)

---

## 1. 测试策略概述

### 1.1 测试金字塔

```
                    /\
                   /  \
                  / E2E\        10% - 端到端测试
                 /______\
                /        \
               / Integration\   20% - 集成测试
              /______________\
             /                \
            /    Unit Tests    \ 70% - 单元测试
           /____________________\
```

### 1.2 覆盖率目标

| 模块 | 单元测试 | 集成测试 | E2E 测试 |
|------|----------|----------|----------|
| 认证模块 | > 90% | > 80% | 核心流程 |
| 邮件服务 | > 85% | > 75% | 核心流程 |
| AI 服务 | > 80% | > 70% | 主要场景 |
| 标签服务 | > 85% | > 75% | 主要场景 |
| 聊天服务 | > 80% | > 70% | 核心流程 |
| UI 组件 | > 75% | - | 交互场景 |

### 1.3 测试工具

| 类型 | 工具 | 用途 |
|------|------|------|
| 单元测试 | Vitest | 快速执行，覆盖率报告 |
| 组件测试 | Vitest + React Testing Library | UI 组件测试 |
| 集成测试 | Vitest | IPC 完整链路测试 |
| E2E 测试 | Playwright for Electron | 用户流程模拟 |
| Mock | vi.fn() + vi.mock() | 外部依赖模拟 |

---

## 2. UX 测试用例

### 2.1 登录模块 UX 测试

#### TC-UX-001: 首次钱包连接体验

| 项目 | 内容 |
|------|------|
| **测试目标** | 验证首次用户钱包连接流程的流畅性和直观性 |
| **前置条件** | 用户已安装 MetaMask，未使用过 Aura |
| **测试步骤** | 1. 启动 Aura 应用<br>2. 观察登录页面布局和提示<br>3. 点击 "连接钱包" 按钮<br>4. 在 MetaMask 弹窗中确认连接<br>5. 观察身份验证过程<br>6. 验证登录成功后的页面跳转 |
| **验收标准** | - 登录页面简洁直观，动画流畅<br>- 钱包连接按钮明显，有清晰的引导提示<br>- MetaMask 弹窗正常，签名请求有明确说明<br>- 整个流程 < 10 秒完成<br>- 首次登录后正确引导到邮箱添加页面 |
| **优先级** | P0 |
| **测试类型** | 冒烟测试 |

#### TC-UX-002: 钱包连接失败处理

| 项目 | 内容 |
|------|------|
| **测试目标** | 验证钱包连接失败时的用户体验 |
| **前置条件** | 用户未安装钱包扩展 |
| **测试步骤** | 1. 在未安装钱包的环境启动 Aura<br>2. 点击 "连接钱包" 按钮<br>3. 观察错误提示 |
| **验收标准** | - 显示友好的错误提示，非技术报错<br>- 提供钱包下载链接或安装指导<br>- 用户可以重试或选择其他连接方式 |
| **优先级** | P0 |

#### TC-UX-003: ENS 域名展示

| 项目 | 内容 |
|------|------|
| **测试目标** | 验证 ENS 域名和头像正确展示 |
| **前置条件** | 用户钱包有 ENS 域名和头像 |
| **测试步骤** | 1. 使用有 ENS 的钱包登录<br>2. 检查用户信息展示区域<br>3. 验证 ENS 名称和头像 |
| **验收标准** | - ENS 域名正确显示（如 alice.eth）<br>- 头像正确加载<br>- 钱包地址缩写显示正确<br>- 无 ENS 时显示缩写地址 |
| **优先级** | P1 |

#### TC-UX-004: 多钱包切换

| 项目 | 内容 |
|------|------|
| **测试目标** | 验证多钱包切换的流畅性 |
| **前置条件** | 用户在 MetaMask 中有多个账户 |
| **测试步骤** | 1. 在 MetaMask 中切换账户<br>2. 观察 Aura 的响应<br>3. 验证数据隔离 |
| **验收标准** | - Aura 正确识别账户切换<br>- 自动刷新为新账户的数据<br>- 原账户数据不被泄露<br>- 切换过程 < 2 秒 |
| **优先级** | P1 |

---

### 2.2 邮箱账户管理 UX 测试

#### TC-UX-010: 添加 Gmail 账户

| 项目 | 内容 |
|------|------|
| **测试目标** | 验证 Gmail 账户添加流程的易用性 |
| **前置条件** | 用户已登录，在设置页面 |
| **测试步骤** | 1. 点击 "添加邮箱账户"<br>2. 输入 Gmail 地址<br>3. 验证自动识别服务商<br>4. 完成 OAuth 授权<br>5. 验证账户添加成功 |
| **验收标准** | - 输入邮箱后自动识别为 Gmail<br>- 自动填充 IMAP/SMTP 配置<br>- OAuth 流程顺畅，有明确引导<br>- 添加成功后显示同步状态<br>- 整个流程有进度指示 |
| **优先级** | P0 |

#### TC-UX-011: 添加自定义邮箱

| 项目 | 内容 |
|------|------|
| **测试目标** | 验证自定义邮箱配置流程 |
| **前置条件** | 用户有企业邮箱账户 |
| **测试步骤** | 1. 选择 "自定义邮箱"<br>2. 手动输入 IMAP/SMTP 配置<br>3. 输入用户名密码<br>4. 测试连接<br>5. 保存配置 |
| **验收标准** | - 配置表单布局合理，标签清晰<br>- 有配置示例和帮助提示<br>- 测试连接按钮有即时反馈<br>- 连接失败时有明确错误说明<br>- 密码输入框可切换显示/隐藏 |
| **优先级** | P0 |

#### TC-UX-012: 账户列表管理

| 项目 | 内容 |
|------|------|
| **测试目标** | 验证多邮箱账户管理体验 |
| **前置条件** | 用户已添加 3 个邮箱账户 |
| **测试步骤** | 1. 查看账户列表<br>2. 测试启用/禁用账户<br>3. 编辑账户配置<br>4. 删除账户 |
| **验收标准** | - 账户列表清晰展示邮箱和同步状态<br>- 启用/禁用开关即时生效<br>- 编辑操作有确认机制<br>- 删除操作有二次确认<br>- 删除前提示数据清理范围 |
| **优先级** | P1 |

---

### 2.3 邮件列表 UX 测试

#### TC-UX-020: 收件箱浏览体验

| 项目 | 内容 |
|------|------|
| **测试目标** | 验证邮件列表浏览的流畅性和可读性 |
| **前置条件** | 收件箱有 100+ 封邮件 |
| **测试步骤** | 1. 进入收件箱<br>2. 滚动浏览邮件列表<br>3. 测试快速预览<br>4. 切换排序方式 |
| **验收标准** | - 列表滚动流畅，无明显卡顿<br>- 发件人头像清晰显示<br>- 未读邮件有明显视觉区分<br>- 鼠标悬停显示预览<br>- 排序切换即时生效 |
| **优先级** | P0 |

#### TC-UX-021: 邮件多选操作

| 项目 | 内容 |
|------|------|
| **测试目标** | 验证批量操作邮件的便捷性 |
| **前置条件** | 收件箱有多封邮件 |
| **测试步骤** | 1. 进入多选模式<br>2. 选择多封邮件<br>3. 执行批量标记已读<br>4. 执行批量移动<br>5. 执行批量删除 |
| **验收标准** | - 多选模式入口明显<br>- 支持全选/反选<br>- 选中状态视觉反馈清晰<br>- 批量操作有确认提示<br>- 操作完成后有成功反馈 |
| **优先级** | P1 |

#### TC-UX-022: 邮件搜索体验

| 项目 | 内容 |
|------|------|
| **测试目标** | 验证邮件搜索的响应和准确性 |
| **前置条件** | 有大量历史邮件 |
| **测试步骤** | 1. 打开搜索框<br>2. 输入关键词搜索<br>3. 使用高级筛选<br>4. 查看搜索结果 |
| **验收标准** | - 搜索框位置显眼，快捷键可用<br>- 搜索响应 < 500ms<br>- 结果按相关性排序<br>- 高亮显示匹配内容<br>- 支持按发件人/时间筛选 |
| **优先级** | P0 |

#### TC-UX-023: 手势操作（macOS 触控板）

| 项目 | 内容 |
|------|------|
| **测试目标** | 验证触控板手势操作体验 |
| **前置条件** | 在 macOS 上使用 |
| **测试步骤** | 1. 在邮件列表左滑<br>2. 右滑邮件<br>3. 双指缩放<br>4. 测试其他手势 |
| **验收标准** | - 左滑显示归档/删除按钮<br>- 手势响应灵敏<br>- 有手势动画反馈<br>- 可在设置中禁用手势 |
| **优先级** | P2 |

---

### 2.4 邮件编辑 UX 测试

#### TC-UX-030: Markdown 编辑体验

| 项目 | 内容 |
|------|------|
| **测试目标** | 验证 Markdown 编辑器的易用性 |
| **前置条件** | 在撰写邮件页面 |
| **测试步骤** | 1. 输入 Markdown 格式文本<br>2. 观察实时预览<br>3. 使用代码块<br>4. 插入表格<br>5. 添加链接和图片 |
| **验收标准** | - Markdown 语法正确解析<br>- 实时预览与最终渲染一致<br>- 代码块有语法高亮<br>- 工具栏常用操作便捷<br>- 支持撤销/重做 |
| **优先级** | P0 |

#### TC-UX-031: AI 内容粘贴

| 项目 | 内容 |
|------|------|
| **测试目标** | 验证从 AI 工具粘贴内容的体验 |
| **前置条件** | 准备好 ChatGPT 生成的内容 |
| **测试步骤** | 1. 从 ChatGPT 复制带格式内容<br>2. 粘贴到编辑器<br>3. 检查格式保留情况 |
| **验收标准** | - 代码块格式完整保留<br>- 列表结构正确<br>- 表格不变形<br>- 标题层级正确<br>- 无多余空白或乱码 |
| **优先级** | P0 |

#### TC-UX-032: 签名选择器

| 项目 | 内容 |
|------|------|
| **测试目标** | 验证邮件签名切换体验 |
| **前置条件** | 已配置多个签名 |
| **测试步骤** | 1. 撰写新邮件<br>2. 打开签名选择器<br>3. 预览不同签名<br>4. 选择并应用签名 |
| **验收标准** | - 签名选择器入口明显<br>- 签名预览即时显示<br>- 切换签名无延迟<br>- 默认签名自动应用<br>- 支持搜索签名 |
| **优先级** | P1 |

#### TC-UX-033: 附件管理

| 项目 | 内容 |
|------|------|
| **测试目标** | 验证附件添加和管理体验 |
| **前置条件** | 在撰写邮件页面 |
| **测试步骤** | 1. 点击添加附件<br>2. 选择多个文件<br>3. 拖拽文件到编辑区<br>4. 删除附件<br>5. 预览附件 |
| **验收标准** | - 支持拖拽和点击两种方式<br>- 显示文件名、大小、类型图标<br>- 大文件有上传进度<br>- 支持删除和重新排序<br>- 图片附件可预览 |
| **优先级** | P1 |

---

### 2.5 AI 助手 UX 测试

#### TC-UX-040: AI Agent 选择

| 项目 | 内容 |
|------|------|
| **测试目标** | 验证 AI Agent 选择和使用的便捷性 |
| **前置条件** | 已配置 AI 服务，在撰写页面 |
| **测试步骤** | 1. 打开 AI 助手面板<br>2. 浏览预设 Agent 列表<br>3. 选择 "专业回复" Agent<br>4. 输入简要需求<br>5. 查看生成结果 |
| **验收标准** | - Agent 列表分类清晰<br>- 每个 Agent 有简短说明<br>- 选择后立即显示输入框<br>- 生成过程有加载动画<br>- 结果可一键应用或修改 |
| **优先级** | P0 |

#### TC-UX-041: 对话式优化

| 项目 | 内容 |
|------|------|
| **测试目标** | 验证多轮对话优化邮件的体验 |
| **前置条件** | AI 已生成邮件草稿 |
| **测试步骤** | 1. 查看生成的草稿<br>2. 输入 "让语气更正式"<br>3. 查看优化结果<br>4. 继续调整 "缩短到 200 字以内"<br>5. 确认最终内容 |
| **验收标准** | - 对话历史清晰展示<br>- 每轮修改有明确对比<br>- 可回退到之前版本<br>- 支持 "润色/缩短/扩展" 快捷操作<br>- 响应时间 < 3 秒 |
| **优先级** | P0 |

#### TC-UX-042: AI 服务配置

| 项目 | 内容 |
|------|------|
| **测试目标** | 验证 AI 服务配置流程 |
| **前置条件** | 在设置页面 |
| **测试步骤** | 1. 进入 AI 设置<br>2. 选择 AI Provider<br>3. 输入 API Key<br>4. 测试连接<br>5. 保存配置 |
| **验收标准** | - Provider 列表清晰展示各选项<br>- API Key 输入框自动遮蔽<br>- 连接测试有即时反馈<br>- 支持多个 Provider 配置<br>- 本地 LLM 配置有引导说明 |
| **优先级** | P1 |

---

### 2.6 智能标签 UX 测试

#### TC-UX-050: 标签创建与管理

| 项目 | 内容 |
|------|------|
| **测试目标** | 验证标签创建和管理体验 |
| **前置条件** | 在标签管理页面 |
| **测试步骤** | 1. 创建新标签<br>2. 设置名称、颜色、描述<br>3. 编辑已有标签<br>4. 删除标签<br>5. 拖拽排序 |
| **验收标准** | - 创建标签表单简洁<br>- 颜色选择器直观<br>- 描述可选但有提示作用<br>- 删除时提示关联邮件处理方式<br>- 拖拽排序流畅 |
| **优先级** | P1 |

#### TC-UX-051: AI 自动分类

| 项目 | 内容 |
|------|------|
| **测试目标** | 验证 AI 自动分类邮件的体验 |
| **前置条件** | 已创建多个标签，启用 AI 分类 |
| **测试步骤** | 1. 收到新邮件<br>2. 观察 AI 分类提示<br>3. 确认或修改推荐标签<br>4. 查看智能文件夹 |
| **验收标准** | - 新邮件有 AI 分类提示角标<br>- 推荐标签显示置信度<br>- 用户可一键应用或修改<br>- 误分类可标记纠正<br>- 智能文件夹实时更新 |
| **优先级** | P1 |

---

### 2.7 离线体验 UX 测试

#### TC-UX-060: 离线浏览邮件

| 项目 | 内容 |
|------|------|
| **测试目标** | 验证离线状态下浏览邮件的体验 |
| **前置条件** | 有已同步的邮件 |
| **测试步骤** | 1. 断开网络连接<br>2. 启动 Aura<br>3. 浏览收件箱<br>4. 打开邮件详情<br>5. 搜索邮件 |
| **验收标准** | - 应用正常启动<br>- 已有邮件完整显示<br>- 搜索功能正常<br>- 显示离线状态指示<br>- 体验与在线一致 |
| **优先级** | P0 |

#### TC-UX-061: 离线撰写和发送

| 项目 | 内容 |
|------|------|
| **测试目标** | 验证离线状态下撰写和发送邮件的体验 |
| **前置条件** | 离线状态 |
| **测试步骤** | 1. 撰写新邮件<br>2. 点击发送<br>3. 查看发件队列状态<br>4. 恢复网络<br>5. 验证自动发送 |
| **验收标准** | - 离线可正常撰写邮件<br>- 发送时提示 "已加入发件队列"<br>- 显示待发送邮件列表<br>- 网络恢复后自动发送<br>- 发送成功有通知 |
| **优先级** | P0 |

---

### 2.8 错误处理 UX 测试

#### TC-UX-070: 网络错误处理

| 项目 | 内容 |
|------|------|
| **测试目标** | 验证网络错误的友好提示 |
| **前置条件** | 模拟网络不稳定 |
| **测试步骤** | 1. 同步邮件时断网<br>2. 观察错误提示<br>3. 恢复网络<br>4. 验证自动重连 |
| **验收标准** | - 显示 "网络连接不稳定，正在重试..."<br>- 有重试倒计时显示<br>- 非技术性错误码<br>- 网络恢复后自动继续<br>- 不崩溃、不丢失数据 |
| **优先级** | P0 |

#### TC-UX-071: 认证失败处理

| 项目 | 内容 |
|------|------|
| **测试目标** | 验证邮箱认证失败的提示和引导 |
| **前置条件** | 使用错误密码配置邮箱 |
| **测试步骤** | 1. 添加邮箱账户<br>2. 输入错误密码<br>3. 观察错误提示<br>4. 按引导修正 |
| **验收标准** | - 明确提示 "用户名或密码错误"<br>- 提供可能的解决方案<br>- 支持重新输入密码<br>- 不暴露技术细节 |
| **优先级** | P0 |

#### TC-UX-072: AI 服务错误

| 项目 | 内容 |
|------|------|
| **测试目标** | 验证 AI 服务异常时的用户体验 |
| **前置条件** | AI API Key 无效或超限 |
| **测试步骤** | 1. 尝试使用 AI 生成<br>2. 观察错误提示<br>3. 检查降级处理 |
| **验收标准** | - 友好提示 "AI 服务暂时不可用"<br>- 说明可能原因<br>- 提供检查 API Key 的入口<br>- 支持切换其他 Provider |
| **优先级** | P1 |

---

### 2.9 跨平台 UX 测试

#### TC-UX-080: macOS 原生体验

| 项目 | 内容 |
|------|------|
| **测试目标** | 验证 macOS 平台的原生体验 |
| **前置条件** | 在 macOS 上运行 |
| **测试步骤** | 1. 检查窗口控件（红绿灯）<br>2. 测试 Touch Bar（如有）<br>3. 验证毛玻璃效果<br>4. 测试键盘快捷键 |
| **验收标准** | - 窗口控件符合 macOS 规范<br>- Touch Bar 显示常用操作<br>- 毛玻璃效果正常<br>- 支持 Cmd+Q/W/N 等快捷键 |
| **优先级** | P1 |

#### TC-UX-081: Windows 11 体验

| 项目 | 内容 |
|------|------|
| **测试目标** | 验证 Windows 11 平台体验 |
| **前置条件** | 在 Windows 11 上运行 |
| **测试步骤** | 1. 检查 Mica 材质效果<br>2. 测试 Snap Layouts<br>3. 验证 Windows Hello<br>4. 测试键盘快捷键 |
| **验收标准** | - Mica 材质效果正常<br>- 支持 Snap Layouts<br>- Windows Hello 可用于解锁<br>- 支持 Ctrl+快捷键 |
| **优先级** | P1 |

---

## 3. 单元测试用例

### 3.1 认证模块单元测试

#### TC-UNIT-AUTH-001: 钱包签名验证

```typescript
describe('AuthService', () => {
  describe('verifySignature', () => {
    it('should verify valid signature correctly', async () => {
      // Arrange
      const message = 'Sign this message to verify your identity';
      const address = '0x1234...';
      const signature = '0xabc...';

      // Act
      const result = await authService.verifySignature(message, address, signature);

      // Assert
      expect(result.success).toBe(true);
      expect(result.address).toBe(address);
    });

    it('should reject invalid signature', async () => {
      const result = await authService.verifySignature(message, address, 'invalid');

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('AUTH_SIGN_FAILED');
    });

    it('should reject mismatched address', async () => {
      const result = await authService.verifySignature(message, '0xwrong', validSignature);

      expect(result.success).toBe(false);
    });
  });
});
```

#### TC-UNIT-AUTH-002: ENS 域名解析

```typescript
describe('ENSService', () => {
  describe('resolveENS', () => {
    it('should resolve ENS name to address', async () => {
      const result = await ensService.resolveENS('alice.eth');

      expect(result.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(result.avatar).toBeDefined();
    });

    it('should return null for non-existent ENS', async () => {
      const result = await ensService.resolveENS('nonexistent12345.eth');

      expect(result).toBeNull();
    });

    it('should handle network timeout gracefully', async () => {
      // Mock timeout
      vi.spyOn(viemClient, 'getEnsAddress').mockImplementation(() =>
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 100))
      );

      const result = await ensService.resolveENS('test.eth');

      expect(result).toBeNull();
    });
  });
});
```

#### TC-UNIT-AUTH-003: 加密密钥派生

```typescript
describe('CryptoService', () => {
  describe('deriveKeyFromSignature', () => {
    it('should derive consistent key from signature', () => {
      const signature = '0xabc...';
      const key1 = cryptoService.deriveKeyFromSignature(signature);
      const key2 = cryptoService.deriveKeyFromSignature(signature);

      expect(key1).toBe(key2);
      expect(key1.length).toBe(32);
    });

    it('should derive different keys for different signatures', () => {
      const key1 = cryptoService.deriveKeyFromSignature('0xabc...');
      const key2 = cryptoService.deriveKeyFromSignature('0xdef...');

      expect(key1).not.toBe(key2);
    });
  });

  describe('encrypt/decrypt', () => {
    it('should encrypt and decrypt data correctly', () => {
      const plaintext = 'sensitive password';
      const key = cryptoService.generateKey();

      const encrypted = cryptoService.encrypt(plaintext, key);
      const decrypted = cryptoService.decrypt(encrypted, key);

      expect(decrypted).toBe(plaintext);
      expect(encrypted).not.toBe(plaintext);
    });

    it('should fail decryption with wrong key', () => {
      const encrypted = cryptoService.encrypt('data', key1);

      expect(() => cryptoService.decrypt(encrypted, key2)).toThrow();
    });
  });
});
```

---

### 3.2 邮件服务单元测试

#### TC-UNIT-EMAIL-001: 邮件发送

```typescript
describe('EmailService', () => {
  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      const request: EmailSendRequest = {
        accountId: 'acc-001',
        to: ['recipient@example.com'],
        subject: 'Test Subject',
        body: 'Test body content',
      };

      const result = await emailService.sendEmail(request);

      expect(result.status).toBe('sent');
      expect(result.messageId).toBeDefined();
    });

    it('should queue email when offline', async () => {
      // Mock offline state
      vi.spyOn(networkService, 'isOnline').mockReturnValue(false);

      const result = await emailService.sendEmail(request);

      expect(result.status).toBe('queued');
      expect(result.queueId).toBeDefined();
    });

    it('should validate recipient email format', async () => {
      const request = {
        ...validRequest,
        to: ['invalid-email'],
      };

      await expect(emailService.sendEmail(request)).rejects.toThrow('EMAIL_INVALID_RECIPIENT');
    });

    it('should handle SMTP auth failure', async () => {
      vi.spyOn(nodemailer, 'send').mockRejectedValue(new Error('Invalid credentials'));

      await expect(emailService.sendEmail(request)).rejects.toThrow('EMAIL_SMTP_AUTH_FAILED');
    });
  });
});
```

#### TC-UNIT-EMAIL-002: 邮件同步

```typescript
describe('EmailService', () => {
  describe('syncEmails', () => {
    it('should sync new emails correctly', async () => {
      const result = await emailService.syncEmails({ accountId: 'acc-001' });

      expect(result.newCount).toBeGreaterThan(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle IMAP connection failure', async () => {
      vi.spyOn(imapflow, 'connect').mockRejectedValue(new Error('Connection refused'));

      const result = await emailService.syncEmails({ accountId: 'acc-001' });

      expect(result.errors[0].errorCode).toBe('EMAIL_IMAP_AUTH_FAILED');
    });

    it('should respect rate limits', async () => {
      // Simulate rate limit scenario
      vi.spyOn(rateLimiter, 'checkLimit').mockReturnValue(false);

      const result = await emailService.syncEmails({ accountId: 'acc-001' });

      expect(result.errors[0].errorCode).toBe('EMAIL_RATE_LIMITED');
    });
  });
});
```

#### TC-UNIT-EMAIL-003: Connection Manager

```typescript
describe('ConnectionManager', () => {
  describe('reconnect', () => {
    it('should use exponential backoff', async () => {
      const manager = new ConnectionManager();

      const startTimes: number[] = [];
      vi.spyOn(manager, 'attemptReconnect').mockImplementation(async () => {
        startTimes.push(Date.now());
        throw new Error('Failed');
      });

      await manager.reconnectWithBackoff();

      // Verify delays: 1s, 2s, 4s, 8s...
      expect(startTimes[1] - startTimes[0]).toBeGreaterThanOrEqual(1000);
      expect(startTimes[2] - startTimes[1]).toBeGreaterThanOrEqual(2000);
    });

    it('should max out at 30 seconds delay', async () => {
      const manager = new ConnectionManager();
      const delays: number[] = [];

      vi.spyOn(manager, 'getBackoffDelay').mockImplementation((attempt) => {
        delays.push(manager.calculateDelay(attempt));
        return delays[delays.length - 1];
      });

      for (let i = 0; i < 10; i++) {
        manager.getBackoffDelay(i);
      }

      expect(Math.max(...delays)).toBeLessThanOrEqual(30000);
    });
  });

  describe('healthCheck', () => {
    it('should detect unhealthy connection', async () => {
      const connection = manager.getConnection('acc-001');
      vi.spyOn(connection, 'ping').mockResolvedValue(false);

      const isHealthy = await manager.checkHealth('acc-001');

      expect(isHealthy).toBe(false);
    });

    it('should trigger reconnect on unhealthy connection', async () => {
      vi.spyOn(manager, 'checkHealth').mockResolvedValue(false);
      vi.spyOn(manager, 'reconnect').mockResolvedValue(undefined);

      await manager.monitorConnection('acc-001');

      expect(manager.reconnect).toHaveBeenCalledWith('acc-001');
    });
  });
});
```

---

### 3.3 数据库仓库单元测试

#### TC-UNIT-DB-001: Email Repository

```typescript
describe('EmailRepository', () => {
  beforeEach(async () => {
    // Use in-memory database for tests
    db = new Database(':memory:');
    await runMigrations(db);
  });

  describe('create', () => {
    it('should insert email correctly', async () => {
      const email = {
        id: 'email-001',
        emailAccountId: 'acc-001',
        messageId: '<msg@example.com>',
        subject: 'Test Subject',
        sender: 'sender@example.com',
        bodyText: 'Body content',
        receivedAt: new Date().toISOString(),
      };

      await emailRepo.create(email);

      const saved = await emailRepo.findById('email-001');
      expect(saved).toMatchObject(email);
    });

    it('should prevent duplicate message IDs', async () => {
      await emailRepo.create(email1);

      await expect(emailRepo.create(emailWithSameMessageId)).rejects.toThrow();
    });
  });

  describe('search', () => {
    it('should search by subject using FTS5', async () => {
      await emailRepo.create({ ...email, subject: 'Important Meeting' });
      await emailRepo.create({ ...email, subject: 'Daily Report' });

      const results = await emailRepo.search('Important');

      expect(results).toHaveLength(1);
      expect(results[0].subject).toBe('Important Meeting');
    });

    it('should search by sender name', async () => {
      await emailRepo.create({ ...email, senderName: 'John Doe' });

      const results = await emailRepo.search('John');

      expect(results).toHaveLength(1);
    });

    it('should return empty for no matches', async () => {
      const results = await emailRepo.search('nonexistent');

      expect(results).toHaveLength(0);
    });
  });

  describe('list', () => {
    it('should paginate correctly', async () => {
      for (let i = 0; i < 100; i++) {
        await emailRepo.create({ ...email, id: `email-${i}` });
      }

      const page1 = await emailRepo.list({ page: 1, pageSize: 20 });
      const page2 = await emailRepo.list({ page: 2, pageSize: 20 });

      expect(page1.emails).toHaveLength(20);
      expect(page2.emails).toHaveLength(20);
      expect(page1.emails[0].id).not.toBe(page2.emails[0].id);
    });

    it('should filter by folder', async () => {
      await emailRepo.create({ ...email, folder: 'INBOX' });
      await emailRepo.create({ ...email, folder: 'Sent' });

      const inbox = await emailRepo.list({ folder: 'INBOX' });

      expect(inbox.emails).toHaveLength(1);
      expect(inbox.emails[0].folder).toBe('INBOX');
    });
  });
});
```

#### TC-UNIT-DB-002: Tag Repository

```typescript
describe('TagRepository', () => {
  describe('applyToEmail', () => {
    it('should create email-tag relationship', async () => {
      await tagRepo.applyToEmail('email-001', 'tag-001', { isAiApplied: true, confidence: 0.85 });

      const tags = await tagRepo.getEmailTags('email-001');
      expect(tags).toHaveLength(1);
      expect(tags[0].confidenceScore).toBe(0.85);
    });

    it('should prevent duplicate tag applications', async () => {
      await tagRepo.applyToEmail('email-001', 'tag-001');

      await expect(tagRepo.applyToEmail('email-001', 'tag-001')).resolves.not.toThrow();

      const tags = await tagRepo.getEmailTags('email-001');
      expect(tags).toHaveLength(1);
    });
  });

  describe('getSmartFolders', () => {
    it('should aggregate emails by tag', async () => {
      await tagRepo.create({ id: 'work', name: 'Work', color: '#FF0000' });
      await tagRepo.applyToEmail('email-001', 'work');
      await tagRepo.applyToEmail('email-002', 'work');

      const folders = await tagRepo.getSmartFolders();

      const workFolder = folders.find(f => f.tagId === 'work');
      expect(workFolder.totalCount).toBe(2);
    });
  });
});
```

---

### 3.4 AI 服务单元测试

#### TC-UNIT-AI-001: AI Provider 抽象

```typescript
describe('AIService', () => {
  describe('generateEmail', () => {
    it('should generate email with OpenAI provider', async () => {
      vi.spyOn(openaiProvider, 'generate').mockResolvedValue({
        content: 'Generated email content',
        tokensUsed: 150,
      });

      const result = await aiService.generateEmail({
        prompt: 'Write a professional reply',
        provider: 'openai',
      });

      expect(result.content).toContain('Generated email content');
      expect(result.provider).toBe('openai');
    });

    it('should fallback to next provider on failure', async () => {
      vi.spyOn(openaiProvider, 'generate').mockRejectedValue(new Error('API Error'));
      vi.spyOn(claudeProvider, 'generate').mockResolvedValue({
        content: 'Claude response',
        tokensUsed: 100,
      });

      const result = await aiService.generateEmail({
        prompt: 'Test',
        provider: 'openai',
        fallbackProviders: ['claude'],
      });

      expect(result.provider).toBe('claude');
    });

    it('should stream response when requested', async () => {
      const chunks: string[] = [];
      vi.spyOn(openaiProvider, 'stream').mockImplementation(async function* () {
        yield 'Hello';
        yield ' World';
      });

      for await (const chunk of aiService.generateEmailStream({ prompt: 'Test' })) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(['Hello', ' World']);
    });
  });

  describe('refineText', () => {
    it('should polish text', async () => {
      vi.spyOn(aiProvider, 'refine').mockResolvedValue({
        content: 'Polished version',
        diff: 'Changed grammar',
      });

      const result = await aiService.refineText({
        content: 'rough text',
        action: 'polish',
      });

      expect(result.content).toBe('Polished version');
      expect(result.diff).toBeDefined();
    });

    it('should translate text', async () => {
      vi.spyOn(aiProvider, 'refine').mockResolvedValue({
        content: 'Translated content',
      });

      const result = await aiService.refineText({
        content: 'English text',
        action: 'translate',
        targetLanguage: 'zh-CN',
      });

      expect(result.content).toBe('Translated content');
    });
  });
});
```

#### TC-UNIT-AI-002: 邮件分类

```typescript
describe('TagService', () => {
  describe('classifyEmail', () => {
    it('should suggest relevant tags', async () => {
      const tags = [
        { id: 'work', name: 'Work', description: 'Work-related emails' },
        { id: 'personal', name: 'Personal', description: 'Personal emails' },
      ];

      vi.spyOn(aiProvider, 'classify').mockResolvedValue({
        suggestions: [
          { tagId: 'work', confidence: 0.92, reason: 'Contains work keywords' },
        ],
      });

      const result = await tagService.classifyEmail({
        emailId: 'email-001',
        availableTags: tags,
      });

      expect(result.suggestions[0].tagId).toBe('work');
      expect(result.suggestions[0].confidence).toBeGreaterThan(0.7);
    });

    it('should not suggest tags below confidence threshold', async () => {
      vi.spyOn(aiProvider, 'classify').mockResolvedValue({
        suggestions: [
          { tagId: 'work', confidence: 0.3, reason: 'Low confidence' },
        ],
      });

      const result = await tagService.classifyEmail({
        emailId: 'email-001',
        availableTags: tags,
        minConfidence: 0.7,
      });

      expect(result.suggestions).toHaveLength(0);
    });
  });

  describe('learnFromCorrection', () => {
    it('should update model with user correction', async () => {
      await tagService.learnFromCorrection({
        emailId: 'email-001',
        suggestedTag: 'work',
        actualTag: 'personal',
      });

      const model = await tagRepo.getAiModel();
      expect(model.trainingExamples).toContainEqual({
        emailId: 'email-001',
        correctTag: 'personal',
      });
    });
  });
});
```

---

### 3.5 工具函数单元测试

#### TC-UNIT-UTIL-001: 邮箱服务商识别

```typescript
describe('EmailProviderDetector', () => {
  it('should detect Gmail', () => {
    const config = detectProvider('user@gmail.com');

    expect(config.provider).toBe('gmail');
    expect(config.imapHost).toBe('imap.gmail.com');
    expect(config.smtpHost).toBe('smtp.gmail.com');
  });

  it('should detect Outlook', () => {
    const config = detectProvider('user@outlook.com');

    expect(config.provider).toBe('outlook');
  });

  it('should detect iCloud', () => {
    const config = detectProvider('user@icloud.com');

    expect(config.provider).toBe('icloud');
  });

  it('should return custom for unknown domains', () => {
    const config = detectProvider('user@company.com');

    expect(config.provider).toBe('custom');
    expect(config.imapHost).toBeUndefined();
  });
});
```

#### TC-UNIT-UTIL-002: 错误码转换

```typescript
describe('ErrorMapper', () => {
  it('should map IMAP auth error to user-friendly message', () => {
    const error = new Error('Invalid credentials');
    const message = mapErrorToUserMessage(error, 'IMAP');

    expect(message).toBe('邮箱登录失败，请检查用户名和密码');
    expect(message).not.toContain('IMAP');
    expect(message).not.toContain('credentials');
  });

  it('should map rate limit error', () => {
    const error = new Error('Too many requests');
    const message = mapErrorToUserMessage(error);

    expect(message).toContain('请求过于频繁');
  });

  it('should map unknown errors to generic message', () => {
    const error = new Error('Some random error');
    const message = mapErrorToUserMessage(error);

    expect(message).toBe('操作失败，请稍后重试');
  });
});
```

#### TC-UNIT-UTIL-003: Markdown 转换

```typescript
describe('MarkdownConverter', () => {
  it('should convert markdown to HTML', () => {
    const md = '# Title\n\n**Bold** text';
    const html = markdownToHtml(md);

    expect(html).toContain('<h1>Title</h1>');
    expect(html).toContain('<strong>Bold</strong>');
  });

  it('should preserve code blocks with language', () => {
    const md = '```typescript\nconst x = 1;\n```';
    const html = markdownToHtml(md);

    expect(html).toContain('<pre');
    expect(html).toContain('class="language-typescript"');
  });

  it('should handle tables correctly', () => {
    const md = '| A | B |\n|---|---|\n| 1 | 2 |';
    const html = markdownToHtml(md);

    expect(html).toContain('<table>');
    expect(html).toContain('<th>A</th>');
  });
});
```

---

## 4. 集成测试用例

### 4.1 IPC 集成测试

#### TC-INT-001: 邮件发送完整链路

```typescript
describe('Email IPC Integration', () => {
  it('should handle email:send through full stack', async () => {
    // This test runs in Electron with real IPC
    const request: EmailSendRequest = {
      accountId: 'test-account',
      to: ['test@example.com'],
      subject: 'Integration Test',
      body: 'Test body',
    };

    const response = await ipcRenderer.invoke('email:send', request);

    expect(response.success).toBe(true);
    expect(response.data.messageId).toBeDefined();
  });

  it('should persist email to database after send', async () => {
    const response = await ipcRenderer.invoke('email:send', request);

    const emails = await ipcRenderer.invoke('email:list', {
      folder: 'Sent',
    });

    expect(emails.data.emails).toContainEqual(
      expect.objectContaining({ subject: request.subject })
    );
  });
});
```

#### TC-INT-002: 认证流程集成

```typescript
describe('Auth IPC Integration', () => {
  it('should complete full auth flow', async () => {
    // 1. Connect wallet
    const connectResult = await ipcRenderer.invoke('auth:connect', {
      walletType: 'metamask',
    });

    expect(connectResult.success).toBe(true);

    // 2. Sign message
    const signResult = await ipcRenderer.invoke('auth:sign', {
      message: 'Sign to verify',
      purpose: 'verify',
    });

    expect(signResult.success).toBe(true);

    // 3. Verify wallet is stored
    const wallet = await ipcRenderer.invoke('auth:getCurrentWallet');

    expect(wallet.address).toBe(connectResult.data.address);
  });
});
```

---

## 5. E2E 测试用例

### 5.1 核心流程 E2E 测试

#### TC-E2E-001: 首次使用完整流程

```typescript
test('first-time user onboarding flow', async ({ page }) => {
  // Launch app
  const electronApp = await electron.launch({ args: ['.'] });
  const window = await electronApp.firstWindow();

  // 1. Verify login page
  await expect(window.locator('[data-testid="login-page"]')).toBeVisible();

  // 2. Connect wallet
  await window.click('[data-testid="connect-wallet"]');
  // Mock wallet connection
  await mockWalletConnect(window, testWallet);

  // 3. Verify redirected to add email
  await expect(window.locator('[data-testid="add-email-page"]')).toBeVisible();

  // 4. Add email account
  await window.fill('[data-testid="email-input"]', 'test@gmail.com');
  await window.click('[data-testid="continue-btn"]');
  // Mock OAuth
  await mockOAuth(window);

  // 5. Verify inbox loads
  await expect(window.locator('[data-testid="inbox-page"]')).toBeVisible();

  await electronApp.close();
});
```

#### TC-E2E-002: 邮件收发流程

```typescript
test('send and receive email flow', async ({ page }) => {
  const electronApp = await electron.launch({ args: ['.'] });
  const window = await electronApp.firstWindow();

  // Login
  await loginWithWallet(window, testWallet);

  // Compose new email
  await window.click('[data-testid="compose-btn"]');
  await window.fill('[data-testid="to-input"]', 'recipient@test.com');
  await window.fill('[data-testid="subject-input"]', 'E2E Test Subject');
  await window.fill('[data-testid="body-editor"]', 'This is a test email.');

  // Send
  await window.click('[data-testid="send-btn"]');

  // Verify success toast
  await expect(window.locator('[data-testid="toast-success"]')).toBeVisible();

  // Verify email in Sent folder
  await window.click('[data-testid="folder-sent"]');
  await expect(window.locator('text=E2E Test Subject')).toBeVisible();

  await electronApp.close();
});
```

#### TC-E2E-003: AI 辅助撰写流程

```typescript
test('AI-assisted email composition', async ({ page }) => {
  const electronApp = await electron.launch({ args: ['.'] });
  const window = await electronApp.firstWindow();

  await loginWithWallet(window, testWallet);

  // Open compose
  await window.click('[data-testid="compose-btn"]');

  // Open AI panel
  await window.click('[data-testid="ai-assistant-btn"]');

  // Select agent
  await window.click('[data-testid="agent-professional-reply"]');

  // Enter prompt
  await window.fill('[data-testid="ai-prompt-input"]', 'Reply to a meeting invitation');
  await window.click('[data-testid="ai-generate-btn"]');

  // Wait for generation
  await expect(window.locator('[data-testid="ai-result"]')).toBeVisible({ timeout: 10000 });

  // Apply result
  await window.click('[data-testid="apply-ai-result"]');

  // Verify content in editor
  const editorContent = await window.locator('[data-testid="body-editor"]').textContent();
  expect(editorContent.length).toBeGreaterThan(50);

  await electronApp.close();
});
```

#### TC-E2E-004: 离线模式流程

```typescript
test('offline mode and sync', async ({ page }) => {
  const electronApp = await electron.launch({ args: ['.'] });
  const window = await electronApp.firstWindow();

  await loginWithWallet(window, testWallet);

  // Go offline
  await electronApp.context().setOffline(true);

  // Verify offline indicator
  await expect(window.locator('[data-testid="offline-indicator"]')).toBeVisible();

  // Compose email offline
  await window.click('[data-testid="compose-btn"]');
  await window.fill('[data-testid="to-input"]', 'offline@test.com');
  await window.fill('[data-testid="subject-input"]', 'Offline Email');
  await window.click('[data-testid="send-btn"]');

  // Verify queued status
  await expect(window.locator('text=已加入发件队列')).toBeVisible();

  // Go online
  await electronApp.context().setOffline(false);

  // Verify auto-sync
  await expect(window.locator('[data-testid="sync-complete"]')).toBeVisible({ timeout: 30000 });

  await electronApp.close();
});
```

---

## 6. 性能测试用例

### 6.1 启动性能测试

#### TC-PERF-001: 冷启动时间

```typescript
describe('Performance Tests', () => {
  it('should cold start in under 3 seconds', async () => {
    const start = Date.now();

    const electronApp = await electron.launch({ args: ['.'] });
    const window = await electronApp.firstWindow();

    await window.waitForSelector('[data-testid="app-ready"]');

    const duration = Date.now() - start;

    expect(duration).toBeLessThan(3000);

    await electronApp.close();
  });
});
```

#### TC-PERF-002: 邮件列表渲染

```typescript
it('should render 1000 emails in under 200ms', async () => {
  // Seed 1000 emails
  await seedEmails(1000);

  const window = await electronApp.firstWindow();

  const start = Date.now();
  await window.click('[data-testid="folder-inbox"]');
  await window.waitForSelector('[data-testid="email-list-loaded"]');
  const duration = Date.now() - start;

  expect(duration).toBeLessThan(200);
});
```

#### TC-PERF-003: 搜索性能

```typescript
it('should search 100k emails in under 100ms', async () => {
  await seedEmails(100000);

  const start = Date.now();
  const results = await emailRepo.search('important keyword');
  const duration = Date.now() - start;

  expect(duration).toBeLessThan(100);
});
```

### 6.2 内存测试

#### TC-PERF-010: 内存占用

```typescript
it('should use less than 300MB memory during normal use', async () => {
  const electronApp = await electron.launch({ args: ['.'] });

  // Simulate normal use
  await performNormalOperations(electronApp);

  const metrics = await electronApp.metrics();
  expect(metrics.memory).toBeLessThan(300 * 1024 * 1024); // 300MB

  await electronApp.close();
});
```

---

## 7. 测试数据管理

### 7.1 测试数据工厂

```typescript
// tests/factories/email.factory.ts
export const EmailFactory = {
  build: (overrides = {}) => ({
    id: uuid(),
    emailAccountId: 'test-account',
    messageId: `<${uuid()}@test.com>`,
    subject: 'Test Subject',
    sender: 'sender@test.com',
    senderName: 'Test Sender',
    bodyText: 'Test body content',
    receivedAt: new Date().toISOString(),
    isRead: false,
    ...overrides,
  }),

  buildMany: (count: number, overrides = {}) =>
    Array.from({ length: count }, () => EmailFactory.build(overrides)),
};

// tests/factories/account.factory.ts
export const AccountFactory = {
  build: (overrides = {}) => ({
    id: uuid(),
    emailAddress: `test${Date.now()}@gmail.com`,
    provider: 'gmail',
    imapHost: 'imap.gmail.com',
    smtpHost: 'smtp.gmail.com',
    ...overrides,
  }),
};
```

### 7.2 Mock 服务

```typescript
// tests/mocks/wallet.mock.ts
export const mockWalletConnect = async (window, wallet) => {
  await window.evaluate((w) => {
    window.__mockWallet = {
      address: w.address,
      signMessage: async (msg) => `signature-${msg}`,
    };
  }, wallet);
};

// tests/mocks/ai.mock.ts
export const mockAIService = () => ({
  generate: vi.fn().mockResolvedValue({
    content: 'Mock AI generated content',
    tokensUsed: 100,
  }),
  classify: vi.fn().mockResolvedValue({
    suggestions: [{ tagId: 'work', confidence: 0.9 }],
  }),
});
```

---

## 8. 测试执行策略

### 8.1 CI 测试矩阵

| 阶段 | 测试类型 | 触发条件 | 超时时间 |
|------|----------|----------|----------|
| Pre-commit | Lint + 单元测试 | git push | 5 min |
| PR | 单元测试 + 集成测试 | PR 创建 | 15 min |
| Merge | 全量测试 | 合并到 main | 30 min |
| Release | 全量 + E2E | Tag 创建 | 60 min |

### 8.2 测试命令

```bash
# 运行所有单元测试
pnpm test

# 运行带覆盖率
pnpm test:coverage

# 运行特定文件
pnpm test email.service.test.ts

# 运行 E2E 测试
pnpm test:e2e

# 运行 E2E 测试（headed 模式）
pnpm test:e2e --headed

# 更新快照
pnpm test -u
```

### 8.3 测试报告

测试完成后生成以下报告：
- **Coverage Report**: `coverage/lcov-report/index.html`
- **JUnit XML**: `test-results/junit.xml`（用于 CI 集成）
- **Playwright Report**: `playwright-report/index.html`
