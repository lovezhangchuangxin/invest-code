import { Context, Next } from 'koa'
import { Result } from '../utils/result'
import { GameError } from './GameError'

export const globalErrorHandler = async (ctx: Context, next: Next) => {
  try {
    await next()
  } catch (error) {
    if (error instanceof GameError) {
      ctx.body = Result.error(error.getCode(), error.getMsg())
      return
    }

    if ((error as { status: number }).status === 401) {
      ctx.status = 200
      ctx.body = Result.error(401, 'token 无效 或 过期')
      return
    }

    if ((error as { status: number }).status === 403) {
      ctx.status = 200
      ctx.body = Result.error(403, '您没有权限')
      return
    }

    // 请勿删除该 log！否则无法捕获到未处理的错误
    console.log(error)

    ctx.body = Result.error(500, '未知错误')
    return
  }
}
