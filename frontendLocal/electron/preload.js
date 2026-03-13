import { contextBridge } from 'electron'

const appPlatform = globalThis.process?.platform ?? 'unknown'
const appVersions = globalThis.process?.versions ?? {}

contextBridge.exposeInMainWorld('electronAPI', {
  app: {
    platform: appPlatform,
    versions: appVersions,
  },
})
