import { getUserSockets, io } from '@/app/server'
import { gameData, Investment, saveGameData } from '@/db'
import { Context, Isolate } from 'isolated-vm'

const PLAYER_HISTORY_SIZE = parseInt(process.env.PLAYER_HISTORY_SIZE || '100')
const CODE_TIME_LIMIT = parseInt(process.env.CODE_TIME_LIMIT || '20')
const CODE_MEMORY_LIMIT = parseInt(process.env.CODE_MEMORY_LIMIT || '32')
const GAME_GLOBAL_HISTORY_SIZE = parseInt(
  process.env.GAME_GLOBAL_HISTORY_SIZE || '1000',
)
const GAME_MAX_INVEST = Number(process.env.GAME_MAX_INVEST || '1e8')
const GAME_TICK = parseInt(process.env.GAME_TICK || '1000')
const GOLD_AUTO_INCREASE_MAX = Number(
  process.env.GOLD_AUTO_INCREASE_MAX || '1000',
)
const GOLD_AUTO_INCREASE_NUM = Number(
  process.env.GOLD_AUTO_INCREASE_NUM || '10',
)

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
  // 当前 tick 的全局 rate
  public static rate: number = 1

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
    this.isolate = new Isolate({ memoryLimit: CODE_MEMORY_LIMIT })
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
    // jail.setSync('getAllHistory', this.getAllHistoryRef)
    // 不提供获取全局历史记录的 api，getAllHistory = getMyHistory，为了兼容旧版代码
    jail.setSync('getAllHistory', () => {
      const user = gameData.users[this.id]
      return user.history
    })

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
        timeout: CODE_TIME_LIMIT,
        result: { promise: true },
      })
      let invest = Math.floor(Number(result))
      if (isNaN(invest) || invest < 0) invest = 0
      invest = Math.min(invest, this.gold, GAME_MAX_INVEST)
      this.gold -= invest
      const rate = Player.rate
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
   * 计算一个随机的收益率（乘数），使用加权随机实现
   * 收益率范围：0-10倍
   * 期望收益：1.0020
   */
  public static calculateReturnRate() {
    // 定义收益区间和权重
    const ranges: [number, number, number][] = [
      [0.0, 0.5, 39], // 0.0-0.5倍，权重34
      [0.5, 1.0, 29], // 0.5-1.0倍，权重28
      [1.0, 1.5, 27], // 1.0-1.5倍，权重21
      [1.5, 2.5, 11], // 1.5-2.5倍，权重11
      [2.5, 5.0, 5], // 2.5-5.0倍，权重5
      [5.0, 7.5, 1], // 5.0-7.5倍，权重1
      [7.5, 10.0, 0], // 7.5-10.0倍，权重0（保留区间但不分配权重）
    ]

    // 计算总权重
    const totalWeight = ranges.reduce((sum, [, , weight]) => sum + weight, 0)

    // 生成随机值
    const randVal = Math.random() * totalWeight

    // 根据权重选择区间并生成具体数值
    let currentWeight = 0
    for (const [rMin, rMax, weight] of ranges) {
      currentWeight += weight
      if (randVal <= currentWeight) {
        // 在选定区间内生成随机数
        const rewardMultiplier = Math.random() * (rMax - rMin) + rMin
        return parseFloat(rewardMultiplier.toFixed(1))
      }
    }

    // 理论上不会执行到这里，但为了防止意外，返回默认值
    return 1.0
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
    Player.rate = Player.calculateReturnRate()
    try {
      for (const player of this.players) {
        const user = gameData.users[player.id]
        if (!user) {
          this.removePlayer(player.id)
          continue
        }

        // 自然增长
        if (player.gold < GOLD_AUTO_INCREASE_MAX) {
          player.gold += GOLD_AUTO_INCREASE_NUM
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
          user.history.push(investRecord)
          user.history = user.history.slice(-PLAYER_HISTORY_SIZE)
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
      this.history = this.history.slice(-GAME_GLOBAL_HISTORY_SIZE)
      gameData.history = this.history
    } catch (error) {
      this.error = (error as Error).stack || (error as Error).message
    }
    this.tick++
    gameData.tick = this.tick
    const allUsers = Object.values(gameData.users)
      .map((user) => {
        return {
          id: user.id,
          username: user.username,
          gold: user.gold,
        }
      })
      .sort((a, b) => b.gold - a.gold)
    io.sockets.emit('allUsers', allUsers)
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
    }, GAME_TICK)
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
