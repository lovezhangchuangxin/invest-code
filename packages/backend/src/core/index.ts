import { getUserSockets } from '@/app/server'
import { gameData, Investment, saveGameData } from '@/db'
import { Context, Isolate } from 'isolated-vm'

export class Player {
  public id: number
  public code: string
  public gold: number
  public getAllHistoryRef: () => Investment[]
  public isolate: Isolate
  public context: Context
  // 代码执行报错结果
  public codeError: string | null = null
  // run 方法执行报错
  public runError: string | null = null
  // 用户输出
  public output: string = ''

  constructor(
    id: number,
    code: string,
    initialGold: number,
    getAllHistoryRef: () => Investment[],
  ) {
    this.id = id
    this.code = code
    this.gold = initialGold
    this.getAllHistoryRef = getAllHistoryRef
    this.isolate = new Isolate({ memoryLimit: 32 })
    this.context = this.isolate.createContextSync()
    this.setupSandbox()
  }

  public setupSandbox() {
    const jail = this.context.global
    jail.setSync('global', jail.derefInto())
    // 设置获取当前 tick 的函数
    jail.setSync('getTick', () => gameData.tick)
    // 设置获取金币的函数
    jail.setSync('getGold', () => this.gold)
    // 设置获取自己历史记录的函数
    jail.setSync('getMyHistory', () => {
      const user = gameData.users[this.id]
      return user.history
    })
    // 设置获取全局历史记录的函数
    jail.setSync('getAllHistory', this.getAllHistoryRef)
    // 设置游戏函数
    jail.setSync('run', 'undefined')

    // 直接在沙箱中创建console对象，将输出存储在全局变量中
    this.context.evalSync(`
      const __output = [];
      const console = {
        log(...args) {
          __output.push(args.map(arg => {
            if (typeof arg === 'object') {
              try {
                return JSON.stringify(arg);
              } catch (e) {
                return String(arg);
              }
            }
            return String(arg);
          }).join(' '));
        },
        getOutput() {
          return __output.join('\\n');
        },
        clearOutput() {
          __output.length = 0;
        }
      };
      // 将console对象和输出数组设置到全局作用域
      global.console = console;
      global.__output = __output;
    `)

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
    // 清空之前的输出
    this.output = ''

    try {
      // 清空console输出缓存
      await this.context.evalSync('console.clearOutput();')

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
      const investRecord: Investment = {
        id: Date.now(),
        userId: this.id,
        amount: invest,
        profit,
        tick,
      }

      // 获取用户输出
      try {
        const outputResult = await this.context.evalSync('console.getOutput();')
        if (typeof outputResult === 'string') {
          // 截取前 100000 个字符
          this.output = outputResult.slice(0, 100000)
        }
      } catch (consoleError) {
        // 忽略获取输出时的错误
      }

      return investRecord
    } catch (e) {
      this.runError = (e as Error).stack || (e as Error).message

      // 即使出错也尝试获取输出
      try {
        const outputResult = await this.context.evalSync('console.getOutput();')
        if (typeof outputResult === 'string') {
          this.output = outputResult
        }
      } catch (consoleError) {
        // 忽略获取输出时的错误
      }

      return
    }
  }

  /**
   * 计算一个随机的收益率（乘数），引入“市场情景”混合分布：
   * - 熊市（约30%）：回报偏向亏损，波动相对较小
   * - 常态（约50%）：回报围绕1倍附近小幅波动
   * - 牛市（约20%）：回报偏向盈利，尾部受控
   *
   * 使用截断对数正态分布来保证非负且控制长尾；最终裁剪到合理区间 [0.4, 3.0]
   * 期望值约略在 1.05~1.15 之间（随采样随机浮动），更贴近投资常识。
   */
  public static calculateReturnRate() {
    // 情景权重（可调整）
    const pBear = 0.3
    const pNormal = 0.5
    const pBull = 0.2

    // 截断区间，避免极端值
    const minRate = 0.4
    const maxRate = 3.0

    // 采样情景
    const r = Math.random()
    let mu: number
    let sigma: number
    if (r < pBear) {
      // 熊市：中位数约 0.85，波动较小
      mu = Math.log(0.85)
      sigma = 0.18
    } else if (r < pBear + pNormal) {
      // 常态：中位数约 1.02，轻微波动
      mu = Math.log(1.02)
      sigma = 0.12
    } else {
      // 牛市：中位数约 1.30，波动略大但受控
      mu = Math.log(1.3)
      sigma = 0.22
    }

    // 采样截断对数正态
    const sampleTruncatedLogNormal = (
      muVal: number,
      sigmaVal: number,
      minVal: number,
      maxVal: number,
    ) => {
      // Box-Muller 生成标准正态
      const u1 = Math.random() || Number.MIN_VALUE
      const u2 = Math.random()
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
      const logNorm = Math.exp(muVal + sigmaVal * z)
      // 裁剪以控制尾部
      return Math.min(maxVal, Math.max(minVal, logNorm))
    }

    const rate = sampleTruncatedLogNormal(mu, sigma, minRate, maxRate)
    return rate
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

        // 自然增长
        player.gold += 10
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
          user.history.push(investRecord)
          user.history = user.history.slice(-100)
          user.gold = player.gold
        }
        getUserSockets(user.id).forEach((socket) => {
          if (player.output) {
            socket.emit('output', {
              tick: this.tick + 1,
              output: player.output,
            })
          }

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
      this.history = this.history.slice(-100)
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
    const player = new Player(playerId, code, user.gold, () => gameData.history)
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
  return new Player(user.id, user.code, user.gold, () => gameData.history)
})
export const game = new Game(gameData.tick, players, gameData.history)
