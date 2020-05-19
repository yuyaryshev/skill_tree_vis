export const unused94023 = 0;

// @ts-ignore-start
const Observable = require("rxjs").Observable as any;
let originalObservableSubscribe = Observable.prototype.subscribe;
let newObservableSubscribe = function(o: any, ...args: any[]) {
    if (o.finally) {
        let oldError = o.error;
        o.error = oldError
            ? (e: any) => {
                  let r = oldError(e);
                  if (r instanceof Promise)
                      return (async () => {
                          await r;
                          await o.finally(e);
                      })();
                  return o.finally(e);
              }
            : o.finally;

        let oldComplete = o.complete;
        o.complete = oldComplete
            ? (e: any) => {
                  let r = oldComplete();
                  if (r instanceof Promise)
                      return (async () => {
                          await r;
                          await o.finally();
                      })();
                  return o.finally();
              }
            : o.finally;
    }
    // @ts-ignore
    return originalObservableSubscribe.call(this, o, ...args);
};
if (Observable.prototype.subscribe !== newObservableSubscribe) Observable.prototype.$subscribe = newObservableSubscribe;
