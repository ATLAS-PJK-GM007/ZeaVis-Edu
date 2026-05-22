declare module 'pngjs' {
  export class PNG {
    width: number;
    height: number;
    data: Buffer;
    parse(data: Buffer, callback: (err: Error | null) => void): void;
  }
}
