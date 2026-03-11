declare module "expo-in-app-updates" {
  export function checkAndStartUpdate(immediate?: boolean): Promise<void>;
  export function checkForUpdate(): Promise<{ updateAvailable: boolean }>;
  export function startUpdate(): Promise<void>;
}
