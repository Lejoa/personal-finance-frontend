export const environment = {
  production: false,
  // 10.0.2.2 es el alias que el emulador de Android usa para localhost del host machine.
  // Esto permite que la app en el emulador alcance el backend Symfony corriendo en tu PC.
  apiUrl: 'http://10.0.2.2:8000',
  isNative: true,
  platform: 'android' as const
};
