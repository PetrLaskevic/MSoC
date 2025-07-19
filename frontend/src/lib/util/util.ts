import { env } from './env';
// import { loadDataFromUrl } from './fileLoaders/loader';
// import { initLoading } from './loading';
// import { applyMigrations } from './migrations';
import { initURLSubscription, loadState, updateCodeStore, verifyState } from './state';
// import { initAnalytics, plausible } from './stats';

export const loadStateFromURL = (): void => {
  loadState(window.location.hash.slice(1));
};

export const syncDiagram = (): void => {
  updateCodeStore({
    updateDiagram: true
  });
};

export const initHandler = async (): Promise<void> => {
//   applyMigrations();
  //decodes a mermaid graph text from the url (its base64/pako) encoded there
  loadStateFromURL();
  //alternative load from some server I specify in the `?code=` query parameter I specify in the URL with `?config=` from same url
  //if loadStateFromURL was successful (url had base64), I don't need it
  // await initLoading('Loading Gist...', loadDataFromUrl().catch(console.error));

  //sets `updateDiagram = true` on the `inputStateStore` 
  syncDiagram();
  //I suppose make it so the URL changes based on changes on the view and diagram text
  //in the URL, apart from the diagram text is:
  // "panZoom":true,"rough":false,"updateDiagram":true,"renderCount":5,"pan":{"x":308.4346686767414,"y":49.269445733896156},"zoom":0.8775959610939025}
  initURLSubscription();

  //dont need that
  // await initAnalytics();
  //also analytics
  // plausible?.trackPageview({ url: window.location.origin + window.location.pathname });

  //sets `panZoom = true` if it wasn't before or if the property didn't exist
  verifyState();
};

export const isMac = navigator.platform.toUpperCase().includes('MAC');
export const cmdKey = isMac ? 'Cmd' : 'Ctrl';
export const MCBaseURL = env.isEnabledMermaidChartLinks
  ? 'https://mermaidchart.com' // 'http://localhost:5174'
  : 'https://example.com';

let count = 0;
export const errorDebug = (limit = 1000) => {
  count += 1;
  if (count > limit) {
    console.log(count, limit);
    // eslint-disable-next-line no-debugger
    debugger;
  }
};

export const formatJSON = (data: unknown): string => JSON.stringify(data, undefined, 2);
export const fetchJSON = async <T>(url: string): Promise<T> => {
  const res = await fetch(url);
  return res.json() as T;
};
export const fetchText = async (url: string): Promise<string> => {
  const res = await fetch(url);
  return res.text();
};

export const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    fallbackCopyToClipboard(text);
  }
};

function fallbackCopyToClipboard(text: string) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  // Make the textarea out of viewport
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  textArea.style.top = '-999999px';
  document.body.append(textArea);

  textArea.focus();
  textArea.select();

  try {
    // The deprecated but widely supported method
    document.execCommand('copy');
  } catch (error) {
    console.error('Failed to copy:', error);
    throw error;
  } finally {
    textArea.remove();
  }
}
