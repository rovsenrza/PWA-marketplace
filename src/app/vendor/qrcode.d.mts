//---------------------------------------------------------------------
//
// Types for qrcode.mjs (qrcode-generator 2.0.4, dist/qrcode.mjs, unmodified, sha256 ea91d711…b7c0).
// Derived from the package's own dist/qrcode.d.ts: that file only declares the module name
// 'qrcode-generator', and here the library is imported by path, so the same shapes are exported instead.
//
// QR Code Generator for JavaScript - TypeScript Declaration File
//
// Copyright (c) 2016 Kazuhiko Arase
//
// URL: http://www.d-project.com/
//
// Licensed under the MIT license:
//  http://www.opensource.org/licenses/mit-license.php
//
// The word 'QR Code' is registered trademark of
// DENSO WAVE INCORPORATED
//  http://www.denso-wave.com/qrcode/faqpatent-e.html
//
//---------------------------------------------------------------------

export type TypeNumber =
  | 0 // Automatic type number
  | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
  | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20
  | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30
  | 31 | 32 | 33 | 34 | 35 | 36 | 37 | 38 | 39 | 40;

export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

export type Mode = 'Numeric' | 'Alphanumeric' | 'Byte' /* Default */ | 'Kanji';

export interface QRCode {
  addData(data: string, mode?: Mode): void;
  make(): void;
  getModuleCount(): number;
  isDark(row: number, col: number): boolean;
  createImgTag(cellSize?: number, margin?: number): string;
  createSvgTag(cellSize?: number, margin?: number): string;
  createSvgTag(opts?: { cellSize?: number; margin?: number; scalable?: boolean }): string;
  createDataURL(cellSize?: number, margin?: number): string;
  createTableTag(cellSize?: number, margin?: number): string;
  createASCII(cellSize?: number, margin?: number): string;
  renderTo2dContext(context: CanvasRenderingContext2D, cellSize?: number): void;
}

export interface QRCodeFactory {
  (typeNumber: TypeNumber, errorCorrectionLevel: ErrorCorrectionLevel): QRCode;
  stringToBytes(s: string): number[];
  stringToBytesFuncs: { [encoding: string]: (s: string) => number[] };
  createStringToBytes(unicodeData: string, numChars: number): (s: string) => number[];
}

declare const qrcode: QRCodeFactory;
export { qrcode };
export default qrcode;
export const stringToBytes: QRCodeFactory['stringToBytes'];
