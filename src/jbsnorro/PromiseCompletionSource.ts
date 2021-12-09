/**
 * I've never been able to remember this pattern, and just wanted to build it
 * such that I can use it like a TaskCompletionSource{T}
 */
export class PromiseCompletionSource<T> {
    public readonly promise: Promise<T>;
    public readonly resolve: (value: T | PromiseLike<T>) => void;
    public readonly reject: (reason?: any) => void;

    constructor() {
        let promiseResolve;
        let promiseReject;

        this.promise = new Promise((resolve, reject) => {
            promiseResolve = resolve;
            promiseReject = reject;
        });
        // @ts-ignore
        this.resolve = promiseResolve;
        // @ts-ignore
        this.reject = promiseReject;
    }
}
