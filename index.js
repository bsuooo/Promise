"use strict";
// 状态
var Status;
(function (Status) {
    Status["PENDING"] = "pending";
    Status["FULFILLED"] = "fulfilled";
    Status["REJECTED"] = "rejected";
})(Status || (Status = {}));
var isFunction = function (value) { return typeof value === 'function'; };
var MyPromise = /** @class */ (function () {
    function MyPromise(fn) {
        // 将状态设置pending
        this.status = Status.PENDING;
        // 成功的回调函数队列
        this.onFulfilledCallback = [];
        // 失败的回调函数队列
        this.onRejectedCallback = [];
        try {
            // 为了保证this指向正确，使用bind绑定this fn是promise中运行的函数
            fn(this._resolve.bind(this), this._reject.bind(this));
        }
        catch (e) {
            // 函数报错直接reject
            this._reject(e);
        }
    }
    MyPromise.prototype._resolve = function (value) {
        var _this = this;
        try {
            setTimeout(function () {
                if (_this.status === Status.PENDING) {
                    // resolve时 promise成功 promise状态变为fulfilled
                    _this.status = Status.FULFILLED;
                    _this.value = value;
                    // 清空成功队列中的回调函数
                    _this.onFulfilledCallback.forEach(function (cb) { return cb(_this.value); });
                }
            });
        }
        catch (error) {
            this._reject(error);
        }
    };
    MyPromise.prototype._reject = function (reason) {
        var _this = this;
        setTimeout(function () {
            if (_this.status === Status.PENDING) {
                _this.status = Status.REJECTED;
                _this.reason = reason;
                _this.onRejectedCallback.forEach(function (cb) { return cb(_this.reason); });
            }
        });
    };
    MyPromise.prototype.then = function (onFulfilled, onRejected) {
        var _this = this;
        onFulfilled = isFunction(onFulfilled) ? onFulfilled : function (value) { return value; };
        onRejected = isFunction(onRejected) ? onRejected : function (reason) {
            throw reason;
        };
        var promise2 = new MyPromise(function (resolve, reject) {
            if (_this.status === Status.FULFILLED) {
                setTimeout(function () {
                    try {
                        var x = onFulfilled === null || onFulfilled === void 0 ? void 0 : onFulfilled(_this.value);
                        resolvePromise(promise2, x, resolve, reject);
                    }
                    catch (error) {
                        reject === null || reject === void 0 ? void 0 : reject(error);
                    }
                });
            }
            if (_this.status === Status.REJECTED) {
                setTimeout(function () {
                    try {
                        var x = onRejected === null || onRejected === void 0 ? void 0 : onRejected(_this.reason);
                        resolvePromise(promise2, x, resolve, reject);
                    }
                    catch (e) {
                        reject === null || reject === void 0 ? void 0 : reject(e);
                    }
                });
            }
            if (_this.status === Status.PENDING) {
                _this.onFulfilledCallback.push(function () {
                    setTimeout(function () {
                        try {
                            var x = onFulfilled === null || onFulfilled === void 0 ? void 0 : onFulfilled(_this.value);
                            resolvePromise(promise2, x, resolve, reject);
                        }
                        catch (e) {
                            reject === null || reject === void 0 ? void 0 : reject(e);
                        }
                    });
                });
                _this.onRejectedCallback.push(function () {
                    setTimeout(function () {
                        try {
                            var x = onRejected === null || onRejected === void 0 ? void 0 : onRejected(_this.reason);
                            resolvePromise(promise2, x, resolve, reject);
                        }
                        catch (e) {
                            reject === null || reject === void 0 ? void 0 : reject(e);
                        }
                    });
                });
            }
        });
        return promise2;
    };
    return MyPromise;
}());
var resolvePromise = function (promise2, x, resolve, reject) {
    if (promise2 === x) {
        return reject === null || reject === void 0 ? void 0 : reject(new TypeError('Chaining cycle detected for promise #<Promise>'));
    }
    if (x instanceof MyPromise) {
        if (x.status === Status.PENDING) {
            x.then(function (res) {
                resolvePromise(promise2, res, resolve, reject);
            }, reject);
        }
        if (x.status === Status.FULFILLED) {
            resolve === null || resolve === void 0 ? void 0 : resolve(x.value);
        }
        if (x.status === Status.REJECTED) {
            reject === null || reject === void 0 ? void 0 : reject(x.reason);
        }
    }
    else if (x !== null && (typeof x === 'object' || typeof x === 'function')) {
        var then = void 0;
        try {
            then = x.then;
        }
        catch (error) {
            return reject === null || reject === void 0 ? void 0 : reject(error);
        }
        if (typeof then === 'function') {
            var called_1 = false;
            try {
                then.call(x, function (y) {
                    if (called_1)
                        return;
                    called_1 = true;
                    resolvePromise(promise2, y, resolve, reject);
                }, function (r) {
                    if (called_1)
                        return;
                    called_1 = true;
                    reject === null || reject === void 0 ? void 0 : reject(r);
                });
            }
            catch (error) {
                if (called_1)
                    return;
                called_1 = true;
                reject === null || reject === void 0 ? void 0 : reject(error);
            }
        }
        else {
            resolve === null || resolve === void 0 ? void 0 : resolve(x);
        }
    }
    else {
        resolve === null || resolve === void 0 ? void 0 : resolve(x);
    }
};
// export default MyPromise
// 忽略 typescript 校验
// @ts-ignore
MyPromise.defer = MyPromise.deferred = function () {
    var dfd = {};
    dfd.promise = new MyPromise(function (resolve, reject) {
        dfd.resolve = resolve;
        dfd.reject = reject;
    });
    return dfd;
};
module.exports = MyPromise;
