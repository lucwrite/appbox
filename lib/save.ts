interface FSWritableStream {
  write(data: string): Promise<void>;
  close(): Promise<void>;
}

interface FSFileHandle {
  createWritable(): Promise<FSWritableStream>;
}

interface FSDirectoryHandle {
  getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<FSDirectoryHandle>;
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FSFileHandle>;
}

declare global {
  interface Window {
    showDirectoryPicker?: () => Promise<FSDirectoryHandle>;
  }
}

/** True in Chromium-based browsers that support picking a real folder on disk. */
export function supportsFolderSave(): boolean {
  return typeof window !== "undefined" && typeof window.showDirectoryPicker === "function";
}

/**
 * Opens the native "choose a location" dialog, then creates `<folderName>/index.html`
 * inside the chosen location. Throws a DOMException named "AbortError" if the user cancels.
 */
export async function saveAppToFolder(html: string, folderName: string): Promise<void> {
  if (!window.showDirectoryPicker) {
    throw new Error("File System Access API not supported in this browser");
  }
  const parentHandle = await window.showDirectoryPicker();
  const appDir = await parentHandle.getDirectoryHandle(folderName, { create: true });
  const fileHandle = await appDir.getFileHandle("index.html", { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(html);
  await writable.close();
}
