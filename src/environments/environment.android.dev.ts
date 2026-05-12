export const environment = {
  production: false,
  // ngrok tunnel for development with a physical device.
  // ngrok exposes the local backend under a public HTTPS domain accepted by Google OAuth.
  // This URL changes every time ngrok restarts (free plan) — update and rebuild after each restart.
  apiUrl: 'https://338a-186-86-52-17.ngrok-free.app',
  isNative: true,
  platform: 'android' as const
};
