export const logger = {
  info: (module: string, message: string, data?: any) => {
    console.log(`[Orbit::${module}] ${message}`, data ? data : "");
  },
  warn: (module: string, message: string, data?: any) => {
    console.warn(`[Orbit::${module}] ⚠️ ${message}`, data ? data : "");
  },
  error: (module: string, message: string, error?: any) => {
    console.error(`[Orbit::${module}] ❌ ${message}`, error ? error : "");
  },
};
