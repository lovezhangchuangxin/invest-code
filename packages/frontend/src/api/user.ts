import { req } from './req'
import type { User } from './types'

export class UserApi {
  /**
   * 注册
   */
  static async register(
    user: Pick<User, 'username' | 'password' | 'email'>,
    verification: string,
    inviter?: { universeId: number; userId: number },
  ) {
    return req<{
      token: string
      user: User
    }>('POST', '/login/register', { user, verification, inviter })
  }

  /**
   * 登录
   */
  static async login(user: Pick<User, 'username' | 'password'>) {
    return req<{
      token: string
      user: User
    }>('POST', '/login', user)
  }

  /**
   * 发送验证码
   */
  static async sendVerification(email: string) {
    return req<{ verification: string }>('POST', '/login/verification', {
      email,
    })
  }

  /**
   * 查看所有玩家
   */
  static async getAllUsers() {
    return req<Pick<User, 'id' | 'username' | 'gold'>[]>('GET', '/users')
  }

  /**
   * 获取我的信息
   */
  static async getMyInfo() {
    return req<Omit<User, 'password'>>('GET', '/users/me')
  }

  /**
   * 上传脚本
   */
  static async uploadScript(script: string) {
    return req('POST', '/users/me/script', { script })
  }
}
