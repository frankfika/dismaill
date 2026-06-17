import { useState } from 'react'
import { invoke } from '../../lib/ipc'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '../../components/ui/tabs'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '../../components/ui/card'

export function AISettings() {
  const [isLoading, setIsLoading] = useState(false)
  const [configs, setConfigs] = useState({
    openai: { apiKey: '', model: 'gpt-4o-mini' },
    claude: { apiKey: '', model: 'claude-3-sonnet-20240229' },
    ollama: { baseUrl: 'http://localhost:11434', model: 'llama3' },
  })
  const [activeProvider, setActiveProvider] = useState('openai')

  const saveConfig = async (providerId: string) => {
    setIsLoading(true)
    try {
      const cfg = configs[providerId as keyof typeof configs]
      await invoke('ai:configure_provider', {
        providerId,
        apiKey: 'apiKey' in cfg ? cfg.apiKey : null,
        baseUrl: 'baseUrl' in cfg ? cfg.baseUrl : null,
      })
      alert('配置已保存')
    } catch (err) {
      alert('保存失败: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-foreground">AI 设置</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">配置云端模型与本地模型的协作策略</p>
      </div>

      <Tabs value={activeProvider} onValueChange={setActiveProvider} className="space-y-4">
        <TabsList className="bg-muted h-auto rounded-md p-1">
          <TabsTrigger value="openai">OpenAI</TabsTrigger>
          <TabsTrigger value="claude">Claude</TabsTrigger>
          <TabsTrigger value="ollama">Ollama</TabsTrigger>
        </TabsList>

        <TabsContent value="openai" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">OpenAI 配置</CardTitle>
              <CardDescription className="text-xs">配置 OpenAI API Key 以使用 GPT 模型</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs">API Key</Label>
                <Input
                  type="password"
                  value={configs.openai.apiKey}
                  onChange={(e) => setConfigs({ ...configs, openai: { ...configs.openai, apiKey: e.target.value } })}
                  placeholder="sk-..."
                  className="rounded-md mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">默认模型</Label>
                <select
                  value={configs.openai.model}
                  onChange={(e) => setConfigs({ ...configs, openai: { ...configs.openai, model: e.target.value } })}
                  className="w-full mt-1 px-3 py-2 border border-border bg-background rounded-md text-sm"
                >
                  <option value="gpt-4o">GPT-4o</option>
                  <option value="gpt-4o-mini">GPT-4o Mini</option>
                </select>
              </div>
              <Button onClick={() => saveConfig('openai')} disabled={isLoading} size="sm" className="rounded-md">
                保存配置
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="claude" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Claude (Anthropic) 配置</CardTitle>
              <CardDescription className="text-xs">配置 Anthropic API Key 以使用 Claude 模型</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs">API Key</Label>
                <Input
                  type="password"
                  value={configs.claude.apiKey}
                  onChange={(e) => setConfigs({ ...configs, claude: { ...configs.claude, apiKey: e.target.value } })}
                  placeholder="sk-ant-..."
                  className="rounded-md mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">默认模型</Label>
                <select
                  value={configs.claude.model}
                  onChange={(e) => setConfigs({ ...configs, claude: { ...configs.claude, model: e.target.value } })}
                  className="w-full mt-1 px-3 py-2 border border-border bg-background rounded-md text-sm"
                >
                  <option value="claude-3-opus-20240229">Claude 3 Opus</option>
                  <option value="claude-3-sonnet-20240229">Claude 3 Sonnet</option>
                  <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
                </select>
              </div>
              <Button onClick={() => saveConfig('claude')} disabled={isLoading} size="sm" className="rounded-md">
                保存配置
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ollama" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Ollama (本地) 配置</CardTitle>
              <CardDescription className="text-xs">配置本地 Ollama 服务以使用开源模型</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs">服务地址</Label>
                <Input
                  type="text"
                  value={configs.ollama.baseUrl}
                  onChange={(e) => setConfigs({ ...configs, ollama: { ...configs.ollama, baseUrl: e.target.value } })}
                  placeholder="http://localhost:11434"
                  className="rounded-md mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">默认模型</Label>
                <Input
                  type="text"
                  value={configs.ollama.model}
                  onChange={(e) => setConfigs({ ...configs, ollama: { ...configs.ollama, model: e.target.value } })}
                  placeholder="llama3"
                  className="rounded-md mt-1"
                />
              </div>
              <Button onClick={() => saveConfig('ollama')} disabled={isLoading} size="sm" className="rounded-md">
                保存配置
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
