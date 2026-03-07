import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.univalle.personalfinance',
  appName: 'Personal Finance',
  webDir: 'dist/personal-finance-frontend/browser',
  server: {
    androidScheme: 'https'
  }
};

export default config;
