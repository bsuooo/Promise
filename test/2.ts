import MyPromise from "..";

new MyPromise((resolve, reject) => {
  setTimeout(() => {
    resolve('5000ms')
  }, 5000)
}).then(res => {
  console.log(res);
}, (err) => {
  console.log(err);
})

setTimeout(() => {
  console.log(1);
})

setTimeout(() => {
  console.log('4000ms');
}, 4000)

console.log(3);


// 3 1 4000ms 50000ms