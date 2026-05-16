# Aura 测试操作指引

本文档详细介绍如何运行、编写和管理 Aura 项目的自动化测试。

## 目录

1. [快速开始](#快速开始)
2. [测试环境配置](#测试环境配置)
3. [运行测试](#运行测试)
4. [查看测试报告](#查看测试报告)
5. [编写测试](#编写测试)
6. [测试最佳实践](#测试最佳实践)
7. [故障排除](#故障排除)

---

## 快速开始

### 一键运行所有测试

```bash
# 安装依赖（首次运行）
pnpm install

# 运行所有单元测试
pnpm test

# 运行测试并生成覆盖率报告
pnpm test:coverage
```

### 运行特定测试

```bash
# 运行单个文件
pnpm test tests/unit/services/email.service.test.ts

# 运行匹配模式的测试
pnpm test -- --grep "AuthService"

# 监听模式（文件变化自动重新运行）
pnpm test:watch
```

---

## 测试环境配置

### 依赖安装

测试依赖已包含在 `package.json` 中：

```json
{
  "devDependencies": {
    "vitest": "^2.1.1",           // 单元测试框架
    "@playwright/test": "^1.47.2", // E2E 测试框架
    "@testing-library/react": "^16.0.1", // React 组件测试
    "jsdom": "^25.0.1"            // DOM 模拟环境
  }
}
```

### 测试配置文件

| 文件 | 用途 |
|------|------|
| `vitest.config.ts` | Vitest 单元测试配置 |
| `playwright.config.ts` | Playwright E2E 测试配置 |
| `tests/setup.ts` | 测试环境全局设置 |

### 环境变量（可选）

创建 `.env.test` 文件配置测试环境变量：

```bash
# 测试用的 AI API（可选）
TEST_AI_API_KEY=sk-test-xxx

# 测试用的 RPC
TEST_RPC_URL=https://eth-mainnet.example.com
```

---

## 运行测试

### 单元测试

```bash
# 运行所有单元测试
pnpm test

# 运行并监视变化
pnpm test:watch

# 运行并生成覆盖率
pnpm test:coverage

# 运行特定目录
pnpm test tests/unit/services/

# 运行特定文件
pnpm test crypto.service.test.ts

# 并行运行（默认）
pnpm test -- --parallel

# 串行运行（调试用）
pnpm test -- --no-parallel
```

### 集成测试

```bash
# 运行集成测试
pnpm test tests/integration/

# 运行特定集成测试
pnpm test tests/integration/email-ipc.integration.test.ts
```

### E2E 测试

```bash
# 首次运行需要安装浏览器
pnpm exec playwright install

# 运行 E2E 测试（headless 模式）
pnpm test:e2e

# 运行 E2E 测试（可视化模式，用于调试）
pnpm test:e2e --headed

# 运行特定 E2E 测试
pnpm test:e2e -- --grep "Login"

# 调试模式
pnpm test:e2e -- --debug

# 生成测试代码（通过录制）
pnpm exec playwright codegen
```

### 完整测试流程

```bash
# 1. 代码检查
pnpm lint
pnpm typecheck

# 2. 单元测试
pnpm test:coverage

# 3. 构建应用（E2E 测试需要）
pnpm build

# 4. E2E 测试
pnpm test:e2e
```

---

## 查看测试报告

### 覆盖率报告

运行 `pnpm test:coverage` 后，查看：

```bash
# 打开 HTML 覆盖率报告
open coverage/lcov-report/index.html
```

覆盖率报告包含：
- 语句覆盖率 (Statements)
- 分支覆盖率 (Branches)
- 函数覆盖率 (Functions)
- 行覆盖率 (Lines)

### E2E 测试报告

运行 `pnpm test:e2e` 后，查看：

```bash
# 打开 Playwright HTML 报告
open playwright-report/index.html
```

E2E 报告包含：
- 测试执行视频
- 截图（失败时）
- 执行追踪

### JUnit XML 报告

用于 CI/CD 集成：

```bash
# 测试结果输出到
test-results/junit.xml
test-results/e2e-junit.xml
```

---

## 编写测试

### 测试文件命名规范

| 类型 | 命名规则 | 示例 |
|------|----------|------|
| 单元测试 | `*.test.ts` | `email.service.test.ts` |
| 组件测试 | `*.test.tsx` | `Button.test.tsx` |
| 集成测试 | `*.integration.test.ts` | `email-ipc.integration.test.ts` |
| E2E 测试 | `*.e2e.test.ts` | `login.e2e.test.ts` |

### 单元测试模板

```typescript
// tests/unit/services/example.service.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ExampleService } from '@/main/services/example.service'

describe('ExampleService', () => {
  let service: ExampleService

  beforeEach(() => {
    service = new ExampleService()
  })

  describe('methodName', () => {
    it('should return expected result for valid input', async () => {
      // Arrange
      const input = 'valid-input'

      // Act
      const result = await service.methodName(input)

      // Assert
      expect(result).toBe('expected-output')
    })

    it('should throw error for invalid input', async () => {
      // Arrange
      const input = 'invalid-input'

      // Act & Assert
      await expect(service.methodName(input)).rejects.toThrow('ERROR_CODE')
    })
  })
})
```

### 使用测试数据工厂

```typescript
import { EmailFactory, AccountFactory } from '../../factories/email.factory'

describe('Email Tests', () => {
  it('should create email with factory', () => {
    // 创建单个邮件
    const email = EmailFactory.build({ subject: 'Test Email' })

    // 创建多个邮件
    const emails = EmailFactory.buildMany(10)

    // 创建 Gmail 账户
    const gmailAccount = AccountFactory.buildGmail()

    expect(email.subject).toBe('Test Email')
  })
})
```

### 使用 Mock 服务

```typescript
import { mockEmailService, resetAllMocks } from '../../mocks/services.mock'

describe('With Mock', () => {
  beforeEach(() => {
    resetAllMocks()
  })

  it('should mock email service', async () => {
    // 设置 Mock 返回值
    mockEmailService.sendEmail.mockResolvedValue({
      messageId: 'test-msg-id',
      status: 'sent',
    })

    // 调用使用 Mock 的函数
    const result = await someFunctionThatUsesEmail()

    // 验证 Mock 被调用
    expect(mockEmailService.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: expect.any(Array),
        subject: expect.any(String),
      })
    )
  })
})
```

### 集成测试模板

```typescript
// tests/integration/example.integration.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { registerIpcHandler, clearIpcHandlers, mockIpcRenderer } from '../mocks/electron.mock'

describe('IPC Integration', () => {
  beforeEach(() => {
    clearIpcHandlers()
  })

  it('should handle IPC request correctly', async () => {
    // 注册 IPC Handler
    registerIpcHandler('module:action', async (request) => {
      return {
        success: true,
        data: { result: 'ok' },
      }
    })

    // 调用 IPC
    const response = await mockIpcRenderer.invoke('module:action', { param: 'value' })

    // 验证响应
    expect(response.success).toBe(true)
    expect(response.data.result).toBe('ok')
  })
})
```

### E2E 测试模板

```typescript
// tests/e2e/example.e2e.test.ts
import { test, expect } from '../helpers/electron-test-helper'

test.describe('User Flow', () => {
  test('should complete user flow', async ({ page }) => {
    // 导航到页面
    await page.click('[data-testid="start-btn"]')

    // 等待元素出现
    await expect(page.locator('[data-testid="result"]')).toBeVisible()

    // 验证内容
    const text = await page.locator('[data-testid="result"]').textContent()
    expect(text).toContain('Expected Text')
  })

  test('should handle error case', async ({ page }) => {
    // 触发错误
    await page.click('[data-testid="error-trigger"]')

    // 验证错误提示
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
  })
})
```

---

## 测试最佳实践

### 1. AAA 模式

使用 Arrange-Act-Assert 模式组织测试：

```typescript
it('should calculate total correctly', () => {
  // Arrange - 准备测试数据
  const items = [{ price: 10 }, { price: 20 }]

  // Act - 执行被测代码
  const total = calculateTotal(items)

  // Assert - 验证结果
  expect(total).toBe(30)
})
```

### 2. 测试隔离

每个测试应该独立，不依赖其他测试：

```typescript
describe('Isolated Tests', () => {
  let service: MyService

  // 每个测试前重新创建实例
  beforeEach(() => {
    service = new MyService()
  })

  // 每个测试后清理
  afterEach(() => {
    service.cleanup()
  })
})
```

### 3. 有意义的测试名称

```typescript
// 好的命名
it('should return empty array when no emails found', () => {})
it('should throw ValidationError when email format is invalid', () => {})

// 不好的命名
it('works', () => {})
it('test1', () => {})
```

### 4. 测试边界条件

```typescript
describe('Input Validation', () => {
  it('should handle empty input', () => {})
  it('should handle null input', () => {})
  it('should handle undefined input', () => {})
  it('should handle very long input', () => {})
  it('should handle special characters', () => {})
})
```

### 5. 使用 vi.fn() 进行断言

```typescript
it('should call callback with result', () => {
  const callback = vi.fn()

  service.doSomething(callback)

  expect(callback).toHaveBeenCalledTimes(1)
  expect(callback).toHaveBeenCalledWith({ status: 'success' })
})
```

---

## 故障排除

### 常见问题

#### 1. 测试超时

```bash
# 增加超时时间
pnpm test -- --test-timeout=30000
```

或在配置中设置：

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    testTimeout: 30000,
  },
})
```

#### 2. Mock 不生效

确保在使用 Mock 前清除：

```typescript
beforeEach(() => {
  vi.clearAllMocks()
})
```

#### 3. E2E 测试找不到元素

```typescript
// 使用更宽松的选择器
await page.locator('text=Submit').click()

// 等待元素出现
await page.waitForSelector('[data-testid="element"]')

// 增加超时
await expect(page.locator('.slow-element')).toBeVisible({ timeout: 10000 })
```

#### 4. 内存泄漏

运行测试时监控内存：

```bash
# 使用 Node.js 内存限制
NODE_OPTIONS="--max-old-space-size=4096" pnpm test
```

#### 5. 并行测试冲突

对于有冲突的测试，使用串行运行：

```typescript
describe.serial('Sequential Tests', () => {
  // 这些测试会按顺序运行
})
```

### 调试技巧

#### 1. 只运行特定测试

```typescript
it.only('focus on this test', () => {
  // 只有这个测试会运行
})

it.skip('skip this test', () => {
  // 这个测试会被跳过
})
```

#### 2. 打印调试信息

```typescript
it('debug test', () => {
  const result = someFunction()
  console.log('Debug:', result)
  expect(result).toBeDefined()
})
```

#### 3. 使用 Playwright Inspector

```bash
# 启动调试模式
pnpm test:e2e -- --debug

# 或使用 PWDEBUG 环境变量
PWDEBUG=1 pnpm test:e2e
```

#### 4. 查看测试详细输出

```bash
# 详细模式
pnpm test -- --reporter=verbose
```

---

## CI/CD 集成

### GitHub Actions 配置

测试自动在 CI 中运行：

```yaml
# .github/workflows/test.yml
- name: Run tests
  run: pnpm test:coverage

- name: Upload coverage
  uses: codecov/codecov-action@v4
```

### 本地预览 CI 测试

```bash
# 使用 act 运行 GitHub Actions（需要安装 act）
act -j test

# 或直接运行测试脚本
pnpm test:coverage && pnpm test:e2e
```

---

## 测试命令速查

| 命令 | 说明 |
|------|------|
| `pnpm test` | 运行所有单元测试 |
| `pnpm test:watch` | 监听模式运行测试 |
| `pnpm test:coverage` | 运行测试并生成覆盖率 |
| `pnpm test:e2e` | 运行 E2E 测试 |
| `pnpm test:e2e --headed` | 可视化模式运行 E2E |
| `pnpm test -- --grep "pattern"` | 运行匹配的测试 |
| `pnpm test path/to/file.test.ts` | 运行特定文件 |

---

## 联系与支持

如有测试相关问题，请：

1. 查阅本文档和 [测试用例文档](./test-cases.md)
2. 搜索 [GitHub Issues](https://github.com/AuraEmail/aura/issues)
3. 创建新的 Issue 并附上：
   - 测试命令
   - 错误信息
   - 预期行为
   - 实际行为
