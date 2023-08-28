import MyPromise from "..";

new MyPromise((resolve, reject) => {
  resolve('testSuccess')
}).then(res => {
  console.log(res);
}, (err) => {
  console.log(err);
})


new MyPromise((resolve, reject) => {
  reject('testReject')
}).then(res => {
  console.log(res);
}, (err) => {
  console.log(err);
})

// testSuccess
// testReject