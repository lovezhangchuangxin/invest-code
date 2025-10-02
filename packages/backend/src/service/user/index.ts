import { game } from '@/core'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { gameData, saveGameData, User } from '../../db'
import { ErrorCode } from '../../error/ErrorCode'
import { GameError } from '../../error/GameError'
import { TimeCache } from '../../utils/cache'
import { generateCode } from '../../utils/common'
import { MailUtil } from '../../utils/mail'
import { Result } from '../../utils/result'

export default class UserService {
  /**
   * 验证码缓存
   */
  static verificationCache = new TimeCache()

  /**
   * 注册
   */
  static async register(
    username: string,
    password: string,
    email: string,
    verification: string,
  ) {
    // 先检查验证码
    const cacheVerification = UserService.verificationCache.get(email)
    const enableVerification =
      !!process.env.MAIL_PASSWORD &&
      process.env.MAIL_PASSWORD.split('').some((c) => c !== 'x')
    if (enableVerification && cacheVerification !== verification) {
      throw new GameError(ErrorCode.VERIFICATION_ERROR)
    }

    // 检查用户名和邮箱是否已被注册
    if (
      Object.values(gameData.users).find(
        (u) => u.username === username || u.email === email,
      )
    ) {
      throw new GameError(ErrorCode.USER_EXIST)
    }

    // 密码加密
    password = bcrypt.hashSync(password, bcrypt.genSaltSync(10))
    const userInfo = {
      id: UserService.generateUserId(),
      username,
      password,
      email,
      gold: 100, // 初始金币
      history: [],
      code: `
function run() {
    return 0
}
      `, // 用户脚本
    } satisfies User

    gameData.users[userInfo.id] = userInfo
    saveGameData()

    const user = {
      id: userInfo.id,
      username: userInfo.username,
      email: userInfo.email,
    }
    // 生成 jwt
    const token = jwt.sign(
      {
        data: user,
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' },
    )
    UserService.verificationCache.delete(email)
    return Result.success({ token, user })
  }

  /**
   * 登录
   */
  static async login(username: string, password: string) {
    const user = Object.values(gameData.users).find(
      (u) => u.username === username,
    )
    if (!user || !bcrypt.compareSync(password, user.password)) {
      throw new GameError(ErrorCode.USERNAME_OR_PASSWORD_ERROR)
    }

    const { password: _, history: __, ...safeUserInfo } = user
    const token = jwt.sign(
      {
        data: safeUserInfo,
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' },
    )

    // 保存 ip
    return Result.success({ token, user: safeUserInfo })
  }

  /**
   * 发送验证码
   */
  static async sendVerification(email: string) {
    // 先看是否有缓存的验证码
    const cacheVerification = UserService.verificationCache.get(email)
    if (cacheVerification) {
      return Result.success({})
    }

    const verification = generateCode()
    try {
      await MailUtil.sendMail({
        from: process.env.MAIL_USERNAME,
        to: email,
        subject: '《STAR-GAME》的验证码',
        text: `你好!您的验证码为：${verification}
验证码5分钟内有效。

我们已收到您要求获得帐户所用验证码的申请，请仅在官方网站上输入此代码。
不要与任何人共享。我们绝不会在官方平台之外索要它。

谢谢！
《STAR-GAME》游戏团队。`,
      })
      // 缓存验证码，5分钟有效
      UserService.verificationCache.set(email, verification, 5 * 60 * 1000)
      // 配置了邮箱密码则能发送邮件，不返回验证码
      if (process.env.MAIL_PASSWORD) {
        return Result.success({})
      }
      return Result.success({ verification })
    } catch (error) {
      // 兜底：邮件发送失败则直接返回验证码
      // 缓存验证码，5分钟有效
      UserService.verificationCache.set(email, verification, 5 * 60 * 1000)
      throw new GameError(ErrorCode.VERIFICATION_CODE_SEND_FAILED)
    }
  }

  /**
   * 查看所有玩家
   */
  static async getAllUsers() {
    const users: Partial<User>[] = Object.values(gameData.users).map(
      (user) => ({
        id: user.id,
        username: user.username,
        gold: user.gold,
      }),
    )
    return Result.success(users)
  }

  /**
   * 根据 ID 获取用户
   */
  static async getUserById(id: number) {
    const user = gameData.users[id]
    if (!user) {
      throw new GameError(ErrorCode.USER_NOT_EXIST)
    }
    const { password: _, ...safeUserInfo } = user
    return Result.success(safeUserInfo)
  }

  /**
   * 上传脚本
   */
  static async uploadScript(id: number, script: string) {
    const user = gameData.users[id]
    if (!user) {
      throw new GameError(ErrorCode.USER_NOT_EXIST)
    }

    user.code = script
    saveGameData()
    game.updatePlayerCode(id, script)
    return Result.success({})
  }

  /**
   * 生成用户 id
   */
  static generateUserId() {
    let maxId = 0
    Object.values(gameData.users).forEach((user) => {
      if (user.id > maxId) {
        maxId = user.id
      }
    })
    return maxId + 1
  }
}
