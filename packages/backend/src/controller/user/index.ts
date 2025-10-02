import { Context } from 'koa'
import { User } from '../../db'
import { ErrorCode } from '../../error/ErrorCode'
import { GameError } from '../../error/GameError'
import UserService from '../../service/user'
import { Validator } from '../../utils/validator'

export default class UserController {
  /**
   * 注册
   */
  static async register(ctx: Context) {
    const { user: { username, password, email } = {}, verification } = ctx
      .request.body as {
      user?: Partial<User>
      verification?: string
    }

    if (!username || !password || !email || !verification) {
      throw new GameError(ErrorCode.PARAM_ERROR)
    }

    // 检验数据格式
    if (
      !Validator.isUsername(username) ||
      !Validator.isPassword(password) ||
      !Validator.isEmail(email)
    ) {
      throw new GameError(ErrorCode.PARAM_ERROR)
    }

    ctx.body = await UserService.register(
      username,
      password,
      email,
      verification,
    )
  }

  /**
   * 登录
   */
  static async login(ctx: Context) {
    const { username, password } = ctx.request.body as {
      username?: string
      password?: string
    }

    if (!username || !password) {
      throw new GameError(ErrorCode.PARAM_ERROR)
    }

    ctx.body = await UserService.login(username, password)
  }

  /**
   * 发送验证码
   */
  static async sendVerification(ctx: Context) {
    const { email } = ctx.request.body as {
      email?: string
    }

    if (!email) {
      throw new GameError(ErrorCode.PARAM_ERROR)
    }

    ctx.body = await UserService.sendVerification(email)
  }

  /**
   * 查看所有玩家
   */
  static async getAllUsers(ctx: Context) {
    ctx.body = await UserService.getAllUsers()
  }

  /**
   * 获取我的信息
   */
  static async getMyInfo(ctx: Context) {
    const user = ctx.state.user.data as Partial<User> | undefined
    if (!user) {
      throw new GameError(ErrorCode.USER_NOT_EXIST)
    }

    ctx.body = await UserService.getUserById(user.id!)
  }

  /**
   * 上传脚本
   */
  static async uploadScript(ctx: Context) {
    const user = ctx.state.user.data as Partial<User> | undefined
    if (!user) {
      throw new GameError(ErrorCode.USER_NOT_EXIST)
    }

    const { script } = ctx.request.body as { script?: string }
    if (typeof script !== 'string') {
      throw new GameError(ErrorCode.PARAM_ERROR)
    }

    if (script.length > 100000) {
      throw new GameError(ErrorCode.SCRIPT_TOO_LONG)
    }

    ctx.body = await UserService.uploadScript(user.id!, script)
  }
}
