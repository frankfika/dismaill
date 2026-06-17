import { useState, useEffect, useCallback, useRef } from 'react'
import { invoke } from '../lib/ipc'

export interface Signature {
  id: string
  emailAccountId: string
  name: string
  contentHtml: string
  contentText?: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateSignatureInput {
  accountId: string
  name: string
  content: string
  isDefault?: boolean
}

export interface UpdateSignatureInput {
  id: string
  name?: string
  content?: string
  isDefault?: boolean
}

export function useSignatures(accountId?: string) {
  const [signatures, setSignatures] = useState<Signature[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const accountIdRef = useRef(accountId)

  useEffect(() => {
    accountIdRef.current = accountId
  }, [accountId])

  const fetchSignatures = useCallback(async () => {
    if (!accountId) {
      setSignatures([])
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const result = await invoke<Signature[]>('signature:list', { emailAccountId: accountId })
      setSignatures(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch signatures')
      console.error('Failed to fetch signatures:', err)
    } finally {
      setIsLoading(false)
    }
  }, [accountId])

  useEffect(() => {
    fetchSignatures()
  }, [fetchSignatures])

  const createSignature = useCallback(
    async (input: CreateSignatureInput): Promise<Signature | null> => {
      setIsLoading(true)
      setError(null)
      try {
        const result = await invoke<{ id: string }>('signature:create', {
          emailAccountId: input.accountId,
          name: input.name,
          contentHtml: input.content,
          contentText: null,
          isDefault: input.isDefault ?? false,
        })
        const newSignature: Signature = {
          id: result.id,
          emailAccountId: input.accountId,
          name: input.name,
          contentHtml: input.content,
          contentText: input.content.replace(/<[^>]*>/g, '').trim(),
          isDefault: input.isDefault ?? false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        setSignatures((prev) => {
          if (newSignature.isDefault) {
            return [...prev.map((s) => ({ ...s, isDefault: false })), newSignature]
          }
          return [...prev, newSignature]
        })
        return newSignature
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create signature')
        console.error('Failed to create signature:', err)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  const updateSignature = useCallback(
    async (input: UpdateSignatureInput): Promise<boolean> => {
      try {
        await invoke('signature:update', {
          id: input.id,
          name: input.name ?? null,
          contentHtml: input.content ?? null,
          contentText: null,
          isDefault: input.isDefault ?? null,
        })
        setSignatures((prev) =>
          prev.map((sig) => {
            if (sig.id === input.id) {
              return {
                ...sig,
                name: input.name ?? sig.name,
                contentHtml: input.content ?? sig.contentHtml,
                contentText: input.content
                  ? input.content.replace(/<[^>]*>/g, '').trim()
                  : sig.contentText,
                isDefault: input.isDefault ?? sig.isDefault,
                updatedAt: new Date().toISOString(),
              }
            }
            if (input.isDefault && sig.id !== input.id) {
              return { ...sig, isDefault: false }
            }
            return sig
          }),
        )
        return true
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update signature')
        console.error('Failed to update signature:', err)
        return false
      }
    },
    [],
  )

  const deleteSignature = useCallback(async (signatureId: string): Promise<boolean> => {
    try {
      await invoke('signature:delete', { id: signatureId })
      setSignatures((prev) => prev.filter((sig) => sig.id !== signatureId))
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete signature')
      console.error('Failed to delete signature:', err)
      return false
    }
  }, [])

  const getDefaultSignature = useCallback((): Signature | null => {
    if (isLoading) return null
    if (signatures.length === 0) return null
    if (signatures[0].emailAccountId !== accountIdRef.current) return null
    return signatures.find((s) => s.isDefault) || signatures[0] || null
  }, [signatures, isLoading])

  return {
    signatures,
    isLoading,
    error,
    fetchSignatures,
    createSignature,
    updateSignature,
    deleteSignature,
    getDefaultSignature,
  }
}
