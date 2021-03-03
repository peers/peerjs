import { EventEmitter } from "eventemitter3";
import logger from "./logger";

export class EncodingQueue extends EventEmitter {
  readonly fileReader: FileReader = new FileReader();

  private _queue: Blob[] = [];
  private _processing: boolean = false;

  constructor() {
    super();

    this.fileReader.onload = (evt) => {
      this._processing = false;

      if (evt.target) {
        this.emit('done', evt.target.result as ArrayBuffer);
      }

      this.doNextTask();
    };

    this.fileReader.onerror = (evt) => {
      logger.error(`EncodingQueue error:`, evt);
      this._processing = false;
      this.destroy();
      this.emit('error', evt);
    }
  }

  get queue(): Blob[] {
    return this._queue;
  }

  get size(): number {
    return this.queue.length;
  }

  get processing(): boolean {
    return this._processing;
  }

  enque(blob: Blob): void {
    this.queue.push(blob);

    if (this.processing) return;

    this.doNextTask();
  }

  destroy(): void {
    this.fileReader.abort();
    this._queue = [];
  }

  private doNextTask(): void {
    if (this.size === 0) return;
    if (this.processing) return;

    this._processing = true;

    this.fileReader.readAsArrayBuffer(this.queue.shift());
  }
}