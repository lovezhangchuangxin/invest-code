import { getUserSockets } from '@/app/server'
import { gameData, Investment, saveGameData } from '@/db'
import { Context, Isolate } from 'isolated-vm'

export class Player {
  public id: number
  public code: string
  public gold: number
  public myHistory: Investment[]
  public getAllHistoryRef: () => Investment[]
  public isolate: Isolate
  public context: Context
  // 代码执行报错结果
  public codeError: string | null = null
  // run 方法执行报错
  public runError: string | null = null

  constructor(
    id: number,
    code: string,
    initialGold: number,
    initialHistory: Investment[],
    getAllHistoryRef: () => Investment[],
  ) {
    this.id = id
    this.code = code
    this.gold = initialGold
    this.myHistory = initialHistory
    this.getAllHistoryRef = getAllHistoryRef
    this.isolate = new Isolate({ memoryLimit: 32 })
    this.context = this.isolate.createContextSync()
    this.setupSandbox()
  }

  public setupSandbox() {
    const jail = this.context.global
    jail.setSync('global', jail.derefInto())
    // 设置获取金币的函数
    jail.setSync('getGold', () => this.gold)
    // 设置获取自己历史记录的函数
    jail.setSync('getMyHistory', () => this.myHistory)
    // 设置获取全局历史记录的函数
    jail.setSync('getAllHistory', this.getAllHistoryRef)
    // 设置游戏函数
    jail.setSync('run', 'undefined')
    // 执行代码
    try {
      this.context.evalSync(this.code)
    } catch (error) {
      this.codeError = (error as Error).stack || (error as Error).message
    }
  }

  // 执行玩家run函数进行投资，run 的返回值为投资金额
  public async executeRun(tick: number) {
    this.runError = null
    try {
      const run = await this.context.global.get('run', { reference: true })
      const result = await run.apply(undefined, [], {
        timeout: 20,
        result: { promise: true },
      })
      let invest = Math.floor(Number(result))
      if (isNaN(invest) || invest < 0) invest = 0
      invest = Math.min(invest, this.gold)
      this.gold -= invest
      const rate = Player.calculateReturnRate()
      const profit = Math.floor(invest * rate)
      this.gold += profit
      // 自然增长 10
      this.gold += 10
      const investRecord: Investment = {
        id: Date.now(),
        userId: this.id,
        amount: invest,
        profit,
        tick,
      }
      this.myHistory.push(investRecord)
      return investRecord
    } catch (e) {
      this.runError = (e as Error).stack || (e as Error).message
      return
    }
  }

  /**
   * 计算一个随机的收益率，范围 0 ~ 5，期望值约为 0.8
   */
  public static calculateReturnRate() {
    // 使用正态分布近似，均值为0.8，标准差为0.7
    // 这样可以确保大部分结果在0-5范围内，且期望值为0.8
    const mean = 0.8
    const stdDev = 0.7

    // Box-Muller变换生成正态分布随机数
    const u1 = Math.random()
    const u2 = Math.random()
    const randomNormal =
      Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)

    // 转换为指定均值和标准差的正态分布
    let result = mean + stdDev * randomNormal

    // 确保结果在0-5范围内
    result = Math.max(0, Math.min(5, result))

    return result
  }
}

export class Game {
  public tick: number
  public players: Player[]
  public history: Investment[] = []
  public error: string | null = null
  public timer: NodeJS.Timeout | null = null

  constructor(tick: number, players: Player[], history: Investment[]) {
    this.tick = tick
    this.players = players
    this.history = history
  }

  public async runTick() {
    console.log(`Tick ${this.tick} start`)
    try {
      for (const player of this.players) {
        const user = gameData.users[player.id]
        if (!user) {
          this.removePlayer(player.id)
          continue
        }

        if (!player.code.trim()) {
          continue
        }

        if (player.codeError) {
          getUserSockets(user.id).forEach((socket) => {
            socket.emit('codeError', {
              tick: this.tick + 1,
              error: player.codeError,
            })
          })
        }

        const investRecord = await player.executeRun(this.tick)
        if (investRecord) {
          this.history.push(investRecord)
          console.log(
            `User ${player.id} invested ${investRecord.amount} and got profit ${investRecord.profit}`,
          )
          player.myHistory.push(investRecord)
          user.history.push(investRecord)
          user.gold = player.gold
        }
        getUserSockets(user.id).forEach((socket) => {
          if (player.runError) {
            socket.emit('runError', {
              tick: this.tick + 1,
              error: player.runError,
            })
          }
          socket.emit('tick', {
            tick: this.tick + 1,
            investment: investRecord,
            gold: player.gold,
          })
        })
      }
      this.history = this.history.slice(-1000)
      gameData.history = this.history
    } catch (error) {
      this.error = (error as Error).stack || (error as Error).message
    }
    this.tick++
    gameData.tick = this.tick
  }

  /**
   * 添加玩家
   */
  public addPlayer(player: Player) {
    const exists = this.players.find((p) => p.id === player.id)
    if (exists) return
    this.players.push(player)
  }

  /**
   * 移除玩家
   */
  public removePlayer(playerId: number) {
    this.players = this.players.filter((p) => p.id !== playerId)
  }

  /**
   * 更新玩家代码
   */
  public updatePlayerCode(playerId: number, code: string) {
    this.removePlayer(playerId)
    const user = gameData.users[playerId]
    if (!user) {
      return
    }
    const player = new Player(
      playerId,
      code,
      user.gold,
      user.history,
      () => gameData.history,
    )
    this.addPlayer(player)
  }

  public start() {
    this.timer = setTimeout(() => {
      this.runTick().finally(() => this.start())
    }, +(process.env.GAME_TICK || 1000))
  }

  public dispose() {
    if (this.timer) {
      clearTimeout(this.timer)
    }
    saveGameData()
  }
}

const users = Object.values(gameData.users)
const players = users.map((user) => {
  return new Player(
    user.id,
    user.code,
    user.gold,
    user.history,
    () => gameData.history,
  )
})
export const game = new Game(gameData.tick, players, gameData.history)
