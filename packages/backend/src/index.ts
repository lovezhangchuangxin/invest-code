import { server } from './app/server'
import { game } from './core'

server.listen(process.env.GAME_PORT, async () => {
  console.log(`Server is running at http://localhost:${process.env.GAME_PORT}`)
  start()
})

const handleStop = () => {
  console.log('Server is stopping...')
  server.close()
  game.dispose()
}

const start = () => {
  game.start()
}

process.on('SIGTERM', handleStop)
process.on('SIGINT', handleStop)
