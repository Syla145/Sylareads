/** Saves text as a file (export of progress, an unreadable copy). */
export function downloadText(fileName: string, text: string, type = 'application/json') {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** The progress exactly as stored in this browser (works even when the app itself cannot read it). */
export function storedProgressText(): string | null {
  try {
    return window.localStorage.getItem('sylareads.progress');
  } catch {
    return null;
  }
}
