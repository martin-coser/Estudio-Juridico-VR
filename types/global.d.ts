export {};

declare global {
  interface Window {
    initPushNotifications: () => Promise<boolean>;
  }
}