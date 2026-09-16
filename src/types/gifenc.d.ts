declare module 'gifenc' {
  export interface QuantizeOptions {
    format?: 'rgb565' | 'rgb444' | 'rgba4444';
    oneBitAlpha?: boolean | number;
    clearAlpha?: boolean;
    clearAlphaThreshold?: number;
    clearAlphaColor?: number;
  }

  export interface WriteFrameOptions {
    palette?: number[][] | Uint8Array | number[];
    delay?: number;
    repeat?: number;
    transparent?: boolean;
    transparentIndex?: number;
    dispose?: number;
  }

  export interface GIFEncoderInstance {
    writeFrame: (
      index: Uint8Array | number[],
      width: number,
      height: number,
      opts?: WriteFrameOptions
    ) => void;
    finish: () => void;
    bytes: () => Uint8Array;
    bytesView: () => Uint8Array;
    reset: () => void;
  }

  export function GIFEncoder(opts?: { auto?: boolean; initialCapacity?: number }): GIFEncoderInstance;

  export function quantize(
    rgba: Uint8Array | Uint8ClampedArray,
    maxColors: number,
    opts?: QuantizeOptions
  ): number[][];

  export function applyPalette(
    rgba: Uint8Array | Uint8ClampedArray,
    palette: number[][] | Uint8Array | number[],
    format?: 'rgb565' | 'rgb444' | 'rgba4444'
  ): Uint8Array;

  export function nearestColorIndex(
    palette: number[][],
    r: number,
    g: number,
    b: number
  ): number;
}
