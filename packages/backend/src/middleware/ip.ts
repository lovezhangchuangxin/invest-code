import { Context, Next } from 'koa'

/**
 * 记录 ip
 */
export const recordIp = async (ctx: Context, next: Next) => {
  await next()

  const ips = ctx.request.headers['x-forwarded-for'] || ctx.request.ip
  const ip = ips instanceof Array ? ips[0] : ips
}
