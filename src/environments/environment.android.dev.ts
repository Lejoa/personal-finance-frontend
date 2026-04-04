export const environment = {
  production: false,
  // Túnel ngrok para desarrollo con dispositivo físico.
  // ngrok expone el backend local con un dominio HTTPS público que Google OAuth acepta.
  // Esta URL cambia cada vez que se reinicia ngrok (plan gratuito) — actualizar y rebuild.
  apiUrl: 'https://62e3-186-86-52-17.ngrok-free.app',
  isNative: true,
  platform: 'android' as const
};
