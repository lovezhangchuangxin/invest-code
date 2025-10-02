import 'socket.io'
import { User } from '../db'

declare module 'socket.io' {
  interface Socket {
    userId: number
    userInfo?: Partial<User>
  }
}
