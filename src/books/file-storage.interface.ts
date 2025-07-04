import { Readable } from 'node:stream';

export interface FileStorage {
  writeFile(fileName: string, data: Buffer): Promise<void | Error>;
  readFile(filePath: string): Readable | null;
  deleteFiles(...filePaths: string[]): Promise<void>;
}

export const FileStorageSymbol = Symbol('FileStorage');
