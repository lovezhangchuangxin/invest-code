import http from 'http'
import { Server, Socket } from 'socket.io'
import { createConnection, userSocketIds } from '../socket/connection'
import app from './app'

const server = http.createServer(app.callback())

// 配置 socket
const io = new Server(server, {
  cors: {
    origin: '*',
  },
  path: '/ws',
})

createConnection(io)

export { io, server }

/**
 * 获取玩家所有的 socket
 */
export const getUserSockets = (userId: number) => {
  const socketIds = userSocketIds.get(userId) || []
  return Array.from(socketIds)
    .map((id) => io.sockets.sockets.get(id))
    .filter(Boolean) as Socket[]
}

/**
 * 遍历玩家的所有 socket
 */
export const forEachUserSocket = (
  userId: number,
  callback: (socket: Socket) => void,
) => {
  getUserSockets(userId).forEach(callback)
}
