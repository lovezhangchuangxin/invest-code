import { globalErrorHandler } from '@/error/globalErrorHandler'
import router from '@/router'
import cors from '@koa/cors'
import dotenv from 'dotenv'
import Koa from 'koa'
import bodyParser from 'koa-bodyparser'
import jwt from 'koa-jwt'
import KoaStatic from 'koa-static'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../../../../config/env/.env') })

const app = new Koa()

// 配置跨域
app.use(cors())
// 配置静态资源
app.use(KoaStatic(path.resolve(__dirname, '../static')))
// 处理全局异常
app.use(globalErrorHandler)
// 配置 jwt
app.use(
  jwt({ secret: process.env.JWT_SECRET! }).unless({
    path: [
      /^\/api\/login/,
      /^\/api\/user\/getUserName/,
      /^\/api\/user\/getPlayerInfos/,
      /^\/api\/game\/universeList/,
    ],
  }),
)
// 配置 body 解析
app.use(bodyParser())
// 配置路由
app.use(router.routes())

export default app
