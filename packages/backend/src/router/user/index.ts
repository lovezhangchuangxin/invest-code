import KoaRouter from 'koa-router'
import UserController from '../../controller/user'

const userRouter = new KoaRouter()

userRouter.post('/login/register', UserController.register)

userRouter.post('/login', UserController.login)

userRouter.post('/login/verification', UserController.sendVerification)

userRouter.get('/users', UserController.getAllUsers)

userRouter.get('/users/me', UserController.getMyInfo)

userRouter.post('/users/me/script', UserController.uploadScript)

export default userRouter
