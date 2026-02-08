declare module 'qrcode/lib/browser' {
  export interface ToDataURLOptions {
    width?: number;
    margin?: number;
  }

  export function toDataURL(text: string, options?: ToDataURLOptions): Promise<string>;
}

declare module 'qrcode' {
  export interface ToDataURLOptions {
    width?: number;
    margin?: number;
  }

  export function toDataURL(text: string, options?: ToDataURLOptions): Promise<string>;
}
