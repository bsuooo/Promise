// 状态
enum Status {
  PENDING = 'pending',
  FULFILLED = 'fulfilled',
  REJECTED = 'rejected'
}

// resolve函数的类型
type Resolve<T> = (value?: T | PromiseLike<T>) => void

// reject函数的类型
type Reject = (reason?: any) => void

// promise要运行的函数类型 函数接收resolve reject两个参数 
// resolve 调用时 promise状态变为fulfilled reject 调用时 promise状态变为rejected
type Fn<T> = (resolve?: Resolve<T>, reject?: Reject) => void

// promise成功调用的回调函数类型
type onFulfilled<T, TResult1> = ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null
// promise失败调用的回调函数类型
type onRejected<TResult2> = ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
type onFinally = (() => void) | undefined | null
const isFunction = (value: any): value is Function => typeof value === 'function';

class MyPromise<T> {
  // 将状态设置pending
  status: Status = Status.PENDING
  public value!: T
  public reason?: any
  // 成功的回调函数队列
  private onFulfilledCallback: Array<onFulfilled<T, any>> = []
  // 失败的回调函数队列
  private onRejectedCallback: Array<onRejected<any>> = []

  constructor(fn: Fn<T>) {

    try {
      // 为了保证this指向正确，使用bind绑定this fn是promise中运行的函数
      fn(this._resolve.bind(this), this._reject.bind(this))
    } catch (e) {
      // 函数报错直接reject
      this._reject(e)
    }
  }

  private _resolve(value?: T | PromiseLike<T>) {
    try {
      setTimeout(() => {
        if (this.status === Status.PENDING) {
          // resolve时 promise成功 promise状态变为fulfilled
          this.status = Status.FULFILLED
          this.value = value as T
          // 清空成功队列中的回调函数
          this.onFulfilledCallback.forEach(cb => cb!(this.value))
        }
      })
    } catch (error) {
      this._reject(error)
    }
  }

  private _reject(reason: any) {
    setTimeout(() => {
      if (this.status === Status.PENDING) {
        this.status = Status.REJECTED
        this.reason = reason
        this.onRejectedCallback.forEach(cb => cb!(this.reason))
      }
    })
  }

  public then<TResult1 = T, TResult2 = never>(
    onFulfilled?: onFulfilled<T, TResult1>,
    onRejected?: onRejected<TResult2>
  ): MyPromise<TResult1 | TResult2> {

    onFulfilled = isFunction(onFulfilled) ? onFulfilled : (value: any) => value;

    onRejected = isFunction(onRejected) ? onRejected : (reason: any) => { 
      throw reason
    };

    const promise2 = new MyPromise<TResult1 | TResult2>((resolve, reject) => {
      if (this.status === Status.FULFILLED) {
        setTimeout(() => {
          try {
            const x = onFulfilled?.(this.value)!
            resolvePromise(promise2, x, resolve, reject)
          } catch (error) {
            reject?.(error)
          } 
        });
      }

      if (this.status === Status.REJECTED) {
        setTimeout(() => {
          try {
            const x = onRejected?.(this.reason)!;
            resolvePromise(promise2, x, resolve, reject);
          } catch (e) {
            reject?.(e);
          }
        })
      }

      if (this.status === Status.PENDING) {
        this.onFulfilledCallback.push(() => {
          setTimeout(() => {
            try {
              const x = onFulfilled?.(this.value)!;
              resolvePromise(promise2, x, resolve, reject);
            } catch (e) {
              reject?.(e);
            }
          });
        });
        this.onRejectedCallback.push(() => {
          setTimeout(() => {
            try {
              const x = onRejected?.(this.reason)!;
              resolvePromise(promise2, x, resolve, reject);
            } catch (e) {
              reject?.(e);
            }
          });
        });
      }
    })
    return promise2
  }

}

const resolvePromise = <T>
  (promise2: MyPromise<T>, x: T | PromiseLike<T>, resolve?: Resolve<T>, reject?: Reject) :void => {
  
  // 2.3.1 规范 如果 promise 和 x 指向同一对象，以 TypeError 为据因拒绝执行 reject
  if (promise2 === x) {
    return reject?.(new TypeError('Chaining cycle detected for promise #<Promise>'))
  }

  // 2.3.2 规范 如果 x 为 Promise ，则使 promise2 接受 x 的状态
  if (x instanceof MyPromise) {
    // 如果没有完成, 则等他完成后继续调用resolvePromise解析它的结果
    if (x.status === Status.PENDING) {
      x.then(res => {
        resolvePromise(promise2, res, resolve, reject)
      }, reject)
    }
    // 完成了直接取它的结果解析
    if (x.status === Status.FULFILLED) {
      resolve?.(x.value)
    }
    if (x.status === Status.REJECTED) {
      reject?.(x.reason)
    }
  } else if (x !== null && (typeof x === 'object' || typeof x === 'function')) {
    // 如果是function 且 有 'then' 函数
    let then: PromiseLike<T>['then']
    try {
      then = (x as PromiseLike<T>).then
    } catch (error) {
      return reject?.(error)
    }

    if (typeof then === 'function') {
      // 防止重复调用
      let called = false
      try {
        // call() 方法使用一个指定的 this 值和单独给出的一个或多个参数来调用一个函数。
        then.call(
          x,
          (y: T) => {
            if (called) return
            called = true
            resolvePromise(promise2, y, resolve, reject)
          },
          (r: any) => {
            if (called) return
            called = true
            reject?.(r)
          }
        )
      } catch (error) {
        if (called) return
        called = true
        reject?.(error)
      }
    } else {
      resolve?.(x)
    }
  } else {
    resolve?.(x)
  }    
}

// 忽略 typescript 校验
// @ts-ignore
MyPromise.defer = MyPromise.deferred = function () {
  let dfd: any = {}
  dfd.promise = new MyPromise((resolve, reject) => {
    dfd.resolve = resolve
    dfd.reject = reject
  })
  return dfd
}

export = MyPromise

// 参考链接https://juejin.cn/post/7084515321662406687



  
  