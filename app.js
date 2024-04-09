let express = require('express')
let app = express()
let {open} = require('sqlite')
let path = require('path')
let dbpath = path.join(__dirname, 'todoApplication.db')
let sqlite3 = require('sqlite3')
app.use(express.json())
const {format, isValid} = require('date-fns')

let db = null
let initializeDBandServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('server running')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}
initializeDBandServer()

//MIDDLEWARE
function verifying(request, response, next) {
  let {status, priority, category} = request.query
  if (!['TO DO', 'IN PROGRESS', 'DONE', undefined].includes(status)) {
    response.status(400)
    response.send('Invalid Todo Status')
  } else if (!['HIGH', 'MEDIUM', 'LOW', undefined].includes(priority)) {
    response.status(400)
    response.send('Invalid Todo Priority')
  } else if (!['WORK', 'HOME', 'LEARNING', undefined].includes(category)) {
    response.status(400)
    response.send('Invalid Todo Category')
  } else {
    next()
  }
}

function dateValidater(request, response, next) {
  let {date} = request.query
  const result = isValid(new Date(date))
  if (result) {
    next()
  } else {
    response.status(400)
    response.send('Invalid Due Date')
  }
}

function verifying_2(request, response, next) {
  let {status, priority, category, dueDate} = request.body
  if (!['TO DO', 'IN PROGRESS', 'DONE'].includes(status)) {
    response.status(400)
    response.send('Invalid Todo Status')
  } else if (!['HIGH', 'MEDIUM', 'LOW'].includes(priority)) {
    response.status(400)
    response.send('Invalid Todo Priority')
  } else if (!['WORK', 'HOME', 'LEARNING'].includes(category)) {
    response.status(400)
    response.send('Invalid Todo Category')
  } else if (!isValid(new Date(dueDate))) {
    response.status(400)
    response.send('Invalid Due Date')
  } else {
    next()
  }
}

function verifying_3(request, response, next) {
  let {status, priority, category, dueDate} = request.body
  if (!['TO DO', 'IN PROGRESS', 'DONE', undefined].includes(status)) {
    response.status(400)
    response.send('Invalid Todo Status')
  } else if (!['HIGH', 'MEDIUM', 'LOW', undefined].includes(priority)) {
    response.status(400)
    response.send('Invalid Todo Priority')
  } else if (!['WORK', 'HOME', 'LEARNING', undefined].includes(category)) {
    response.status(400)
    response.send('Invalid Todo Category')
  } else {
    if (dueDate === undefined) {
      next()
    } else if (isValid(new Date(dueDate))) {
      next()
    } else {
      response.status(400)
      response.send('Invalid Due Date')
    }
  }
}

//API-1
app.get('/todos/', verifying, async (request, response) => {
  let {status = '', priority = '', category = '', search_q = ''} = request.query
  let dbquery = `
    select * 
    from todo
    where 
    ((status LIKE '%${status}%') and 
    (priority LIKE '%${priority}%') and
    (category LIKE '%${category}%') and 
    (todo LIKE '%${search_q}%'));`
  let dbresponse = await db.all(dbquery)
  for (let i of dbresponse) {
    i.dueDate = i.due_date
    delete i.due_date
  }
  response.send(dbresponse)
})

//API-2
app.get('/todos/:todoId/', async (request, response) => {
  let {todoId} = request.params
  let dbquery = `
  select *
  from todo
  where id = ${todoId};`
  let dbresponse = await db.get(dbquery)
  dbresponse.dueDate = dbresponse.due_date
  delete dbresponse.due_date
  response.send(dbresponse)
})

//API-3
app.get('/agenda/', dateValidater, async (request, response) => {
  let {date} = request.query
  let newD = format(new Date(date), 'yyyy-MM-dd')
  let dbquery = `
  select * 
  from todo
  where due_date = '${newD}';`
  let dbresponse = await db.all(dbquery)
  for (let i of dbresponse) {
    i.dueDate = i.due_date
    delete i.due_date
  }
  response.send(dbresponse)
})

//API-4
app.post('/todos/', verifying_2, async (request, response) => {
  let {id, todo, priority, status, category, dueDate} = request.body
  let dbquery = `
  insert into todo( id, todo, category, priority, status, due_date)
  values ( '${id}','${todo}','${priority}','${status}','${category}','${dueDate}');`
  await db.run(dbquery)
  response.send('Todo Successfully Added')
})

//API-5
app.put('/todos/:todoId/', verifying_3, async (request, response) => {
  let {todoId} = request.params
  let dbquery_1 = `
  select * 
  from todo 
  where id = ${todoId};`
  let row = await db.get(dbquery_1)
  let mango = request.body
  let {
    id = row.id,
    todo = row.todo,
    category = row.category,
    priority = row.priority,
    status = row.status,
    dueDate = row.due_date,
  } = mango
  let dbquery = `
  update todo 
  set 
  id = ${id},
  todo = '${todo}',
  category = '${category}',
  priority = '${priority}',
  status = '${status}',
  due_date = '${dueDate}' 
  where id = ${id};`
  await db.run(dbquery)
  let d = ''
  if (mango.status !== undefined) {
    d = 'Status Updated'
  } else if (mango.priority !== undefined) {
    d = 'Priority Updated'
  } else if (mango.todo !== undefined) {
    d = 'Todo Updated'
  } else if (mango.category !== undefined) {
    d = 'Category Updated'
  } else {
    d = 'Due Date Updated'
  }
  response.send(d)
})

//API-6
app.delete('/todos/:todoId/', async (request, response) => {
  let {todoId} = request.params
  let dbquery = `
  delete from todo 
  where id = ${todoId};`
  await db.run(dbquery)
  response.send('Todo Deleted')
})

module.exports = app
