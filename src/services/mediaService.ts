/**
 * Mock media service for the Web Demo.
 * Uses object URLs since browsers cannot persist files locally.
 */
export async function getMediaDir(): Promise<string> {
  return "web_media";
}

export async function saveMediaBlob(blob: Blob, extension: string): Promise<string> {
  return URL.createObjectURL(blob);
}

export async function importMediaFile(sourcePath: string): Promise<string> {
  return sourcePath;
}
