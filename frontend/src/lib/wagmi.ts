import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { polygon, polygonAmoy } from 'wagmi/chains'

export const wagmiConfig = getDefaultConfig({
  appName: 'FuelLink',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID ?? 'fuellink_dev',
  chains: [polygon, polygonAmoy],
  ssr: true,
})
