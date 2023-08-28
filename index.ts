// 状态
enum Status {
  PENDING = 'pending',
  FULFILLED = 'fulfilled',
  REJECTED = 'rejected'
}

// resolve函数的类型
type Resole<T> = (value?: T | PromiseLike<T>) => void

// reject函数的类型
type Reject = (reason?: any) => void

// promise要运行的函数类型 函数接收resolve reject两个参数 
// resolve 调用时 promise状态变为fulfilled reject 调用时 promise状态变为rejected
type Fn<T> = (resolve: Resole<T>, reject: Reject) => void

// promise成功调用的回调函数类型
type onFulfilled<T, U> = ((value: T) => U | PromiseLike<U>) | undefined | null
// promise失败调用的回调函数类型
type onRejected<T> = ((reason: any) => T | PromiseLike<T>) | undefined | null
type onFinally = (() => void) | undefined | null

function isPromise(value: any): value is PromiseLike<any> {
  return (
    ((typeof value === 'object' && value !== null) ||
      typeof value === 'function') &&
    typeof value.then === 'function'
  )
}

const isFunction = (value: any): value is Function => typeof value === 'function';

class MyPromise<T> {
  // 将状态设置pending
  status: Status = Status.PENDING
  private value!: T
  private reason?: any
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


    if (this.status === Status.FULFILLED) {
      // promise已经结束
      setTimeout(() => {
        onFulfilled!(this.value)
      });
    }

    if (this.status === Status.REJECTED) {
      // promise已经结束
      setTimeout(() => {
        onRejected!(this.reason)
      });
    }

    if (this.status === Status.PENDING) {
      // 分别向成功和失败的回调函数队列中添加回调函数
      this.onFulfilledCallback.push(() => onFulfilled!(this.value))
      this.onRejectedCallback.push(() => onRejected!(this.reason))
    }

    return new MyPromise(() => {})
    
  }

}

export default MyPromise





  
  