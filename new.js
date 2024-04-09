let b = new Date('2014-03-4')
console.log(b)
const {format,isValid} = require('date-fns')
let c = format(b, 'yyyy-MM-dd')
console.log(c)
let d = {t: 6, Y: 8}
const result = isValid(2014)
console.log(result)