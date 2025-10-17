/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_BASE_URL: string;
  readonly VITE_FLASK_URL: string;
  readonly VITE_RASA_URL: string;
  // add more env variables here
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
