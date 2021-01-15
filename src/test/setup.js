const pool = require('../pool')
const Context = require('./context')

let context

beforeAll(async () => {
  context = await Context.build()
})

beforeEach(async () => {
  await context.reset()
})

afterAll(async () => {
  await context.close()
})
