import { EventEmitter } from "eventemitter3";
import logger from "./logger";

export class EncodingQueue extends EventEmitter {
  private _queue: Blob[] = [];
  private _processing: boolean = false;
  private _abort: boolean: false;

  constructor() {
    super();
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
    this._abort = true;
    this._queue = [];
  }

  private async doNextTask(): void {
    if (this.size === 0) return;
    if (this.processing) return;

    this._processing = true;

    const blob = this.queue.shift();

    try {
      const arrayBuffer = await blob.arrayBuffer();
      this._processing = false;
      if (this._abort) return;
      this.emit('done', arrayBuffer);
      this.doNextTask();
    } catch (e) {
      logger.error(`EncodingQueue error:`, e);
      this._processing = false;
      this.destroy();
      this.emit('error', e);
    }
  }
}
