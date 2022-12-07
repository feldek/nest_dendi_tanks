import { performance } from 'perf_hooks';

export const performanceTest = {
  timeExecution<T extends () => any>(callback: T) {
    const start = performance.now();
    callback();
    const end = performance.now();
    return end - start;
  },
  async timeExecutionAsync<T extends () => Promise<any>>(callback: T) {
    const start = performance.now();
    await callback();
    const end = performance.now();
    return end - start;
  },
  compare(callback1: () => any, callback2: () => any) {
    const time1 = this.timeExecution(callback1);
    const time2 = this.timeExecution(callback2);
    const diffTime = time1 - time2;
    if (diffTime > 0) {
      console.log('callback2 faster then callback1');
    } else {
      console.log('callback1 faster then callback2');
    }
    return diffTime;
  },
  async compareAsync(callback1: () => Promise<any>, callback2: () => Promise<any>) {
    const time1 = await this.timeExecution(callback1);
    const time2 = await this.timeExecution(callback2);
    const diffTime = time1 - time2;
    if (diffTime > 0) {
      console.log('callback2 faster then callback1');
    } else {
      console.log('callback1 faster then callback2');
    }
    return diffTime;
  },
};
