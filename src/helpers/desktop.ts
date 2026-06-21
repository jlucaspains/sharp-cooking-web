import { Greet } from "../../wailsjs/go/main/App"


declare global {
  interface Window {
    runtime: any;
    go: any;
  }
}

export function isWailsApp(): boolean {
  return typeof window !== 'undefined' && !(window.runtime == undefined);
}
