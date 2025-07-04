import fs from 'node:fs';
import path from 'node:path';
import { FileStorage } from './file-storage.interface';
import { Readable } from 'stream';
import { AppConfig } from '../config';
import { Inject } from '@nestjs/common';
import { ConfigSymbol } from '../global.constants';

export class FsFileStorage implements FileStorage {
  private readonly basePath: string;

  constructor(@Inject(ConfigSymbol) config: AppConfig) {
    this.basePath = path.resolve(config.uploadsFolder);
    fs.mkdirSync(this.basePath, { recursive: true });
  }

  writeFile(fileName: string, data: Buffer): Promise<void | Error> {
    const filePath = path.join(this.basePath, fileName);
    return fs.promises.writeFile(filePath, data).catch((err) => err as Error);
  }

  readFile(fileName: string): Readable | null {
    const filePath = path.join(this.basePath, fileName);
    try {
      return fs.createReadStream(filePath);
      // TODO: update eslint
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      return null;
    }
  }

  async deleteFiles(...filePaths: string[]): Promise<void> {
    await Promise.allSettled(filePaths.map(fs.promises.unlink));
  }
}
