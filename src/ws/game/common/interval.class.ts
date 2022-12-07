export class IntervalTimer {
  public paused = false;
  private timerId: ReturnType<typeof setInterval> = null;
  private _callback: () => void;
  private _delay: number;

  constructor(callback: () => void, delay: number) {
    this._callback = callback;
    this._delay = delay;
  }

  pause() {
    if (!this.paused) {
      this.clear();
      this.paused = true;
    }
  }

  resume() {
    if (this.paused) {
      this.paused = false;
      this.start();
    }
  }

  clear() {
    clearInterval(this.timerId);
  }

  start() {
    this.clear();
    this.timerId = setInterval(() => {
      this.run();
    }, this._delay);
  }

  private run() {
    this._callback();
  }
}
