// @ts-nocheck
export function TimedoutException(message = "Timed out") {
    this.message = message;
    // Use V8's native method if available, otherwise fallback
    if ("captureStackTrace" in Error)
        Error.captureStackTrace(this, TimedoutException);
    else
        this.stack = (new Error()).stack;
}

TimedoutException.prototype = Object.create(Error.prototype);
TimedoutException.prototype.name = "TimedoutException";
TimedoutException.prototype.constructor = TimedoutException;
