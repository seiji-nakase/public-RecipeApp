/*
実行例: npm run build
概要: TypeScriptがブラウザのWorker型を参照できるよう最低限の定義を提供する。
*/

declare class Worker {
  constructor(stringUrl: string | URL, options?: WorkerOptions);
  onmessage: ((this: Worker, ev: MessageEvent) => any) | null;
  onmessageerror: ((this: Worker, ev: MessageEvent) => any) | null;
  postMessage(message: any, transfer?: Transferable[]): void;
  terminate(): void;
}
