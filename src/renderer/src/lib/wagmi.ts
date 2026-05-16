import { createConfig, http } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors'

// WalletConnect Project ID - 用户应该替换为自己的
const projectId = import.meta.env.VITE_WC_PROJECT_ID || 'YOUR_PROJECT_ID'

export const config = createConfig({
  chains: [mainnet, sepolia],
  connectors: [
    injected({ target: 'metaMask' }),
    walletConnect({
      projectId,
      metadata: {
        name: 'Aura Email Client',
        description: 'Decentralized AI Email Client',
        url: 'https://aura.email',
        icons: ['https://aura.email/icon.png'],
      },
    }),
    coinbaseWallet({
      appName: 'Aura Email Client',
      appLogoUrl: 'https://aura.email/icon.png',
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
})

export type WalletType = 'metamask' | 'walletconnect' | 'coinbase'

export function getConnectorByType(type: WalletType) {
  switch (type) {
    case 'metamask':
      return injected({ target: 'metaMask' })
    case 'walletconnect':
      return walletConnect({
        projectId,
        metadata: {
          name: 'Aura Email Client',
          description: 'Decentralized AI Email Client',
          url: 'https://aura.email',
          icons: ['https://aura.email/icon.png'],
        },
      })
    case 'coinbase':
      return coinbaseWallet({
        appName: 'Aura Email Client',
        appLogoUrl: 'https://aura.email/icon.png',
      })
    default:
      return injected()
  }
}
