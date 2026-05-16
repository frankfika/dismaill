import { useEnsName, useEnsAvatar } from 'wagmi'
import { Avatar } from '../ui/avatar'

interface ENSDisplayProps {
  address: string
  showAvatar?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function ENSDisplay({ address, showAvatar = true, size = 'md' }: ENSDisplayProps) {
  const { data: ensName } = useEnsName({ address: address as `0x${string}` })
  const { data: ensAvatar } = useEnsAvatar({ name: ensName || undefined })

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  return (
    <div className="flex items-center gap-2">
      {showAvatar && (
        <Avatar
          src={ensAvatar || undefined}
          alt={ensName || address}
          fallback={ensName || address}
          size={size}
        />
      )}
      <span className="font-medium">
        {ensName || truncateAddress(address)}
      </span>
    </div>
  )
}
