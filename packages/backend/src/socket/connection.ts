import jwt from 'jsonwebtoken'
import { Server } from 'socket.io'
import { User } from '../db'

const users: Map<number, Partial<User>> = new Map()

export const userSocketIds: Map<number, Set<string>> = new Map()

export const createConnection = (io: Server) => {
  io.on('connection', async (socket) => {
    const token = socket.handshake.query.token as string
    try {
      const data = (
        jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload
      )?.data as Partial<User>

      socket.userId = data.id as number
      socket.userInfo = data

      const socketNum = userSocketIds.get(socket.userId!)?.size || 0
      if (socketNum >= 5) {
        socket.emit('ws limit', 5)
        socket.disconnect()
        return
      }

      users.set(socket.userId!, data)

      if (!userSocketIds.has(socket.userId!)) {
        userSocketIds.set(socket.userId!, new Set())
      }
      userSocketIds.get(socket.userId!)?.add(socket.id)
    } catch (error) {
      socket.send('token error')
      socket.disconnect()
    }

    socket.on('disconnect', () => {
      userSocketIds.get(socket.userId!)?.delete(socket.id)
      if (userSocketIds.get(socket.userId!)?.size === 0) {
        userSocketIds.delete(socket.userId!)
        users.delete(socket.userId)
      }
    })
  })
}

/**
 * 获取在线的玩家数据
 */
export const getActiveUsers = () => {
  return users
}
