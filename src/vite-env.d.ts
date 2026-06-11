/// <reference types="vite/client" />

interface ViteTypeOptions {
  // Disallow reading env keys that aren't declared below.
  strictImportMetaEnv: unknown
}

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
