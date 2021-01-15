const app = require('./src/app')
const pool = require('./src/pool')

pool.connect({
  host: 'localhost',
  port: 5432,
  database: 'socialnetwork',
  user: 'sergeyankarenko',
  password: ''
})
.then(() => {
  const PORT = 3005

  app().listen(PORT, () => {
    console.log(`Listening on port ${PORT}`)
  })
})


