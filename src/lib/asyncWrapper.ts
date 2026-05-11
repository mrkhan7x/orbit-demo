import { logger } from "./logger";
import { useToastStore } from "@/stores/toastStore";

export interface AsyncState {
  isLoading: boolean;
  error: string | null;
}

export const initialAsyncState: AsyncState = {
  isLoading: false,
  error: null,
};

/**
 * Standardized wrapper for Zustand async actions.
 * Handles loading states, error catching, logging, and toast notifications.
 */
export async function runAsyncAction<T>(
  module: string,
  actionName: string,
  set: (updater: (state: T) => Partial<T> | T) => void,
  action: () => Promise<void>,
  rollback?: () => void
) {
  set((state: any) => ({ ...state, isLoading: true, error: null }));
  
  try {
    logger.info(module, `Starting action: ${actionName}`);
    await action();
    logger.info(module, `Successfully completed: ${actionName}`);
  } catch (err: any) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    logger.error(module, `Failed action: ${actionName}`, err);
    
    // Add toast notification
    useToastStore.getState().addToast({
      title: "Action Failed",
      message: errorMsg,
      type: "error",
    });

    if (rollback) {
      logger.info(module, `Rolling back: ${actionName}`);
      rollback();
    }
    
    set((state: any) => ({ ...state, error: errorMsg }));
  } finally {
    set((state: any) => ({ ...state, isLoading: false }));
  }
}
