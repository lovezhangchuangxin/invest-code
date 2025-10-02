// 接口返回数据格式
export interface ResponseData<T> {
  /**
   * 状态码，0 为成功，其他为失败
   */
  code: number
  /**
   * 状态消息
   */
  msg: string
  /**
   * 数据
   */
  data: T
}

// 默认请求方法为 GET, POST, PUT, DELETE
export type DafaultRequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

/**
 * 游戏数据
 */
export interface GameData {
  /** tick */
  tick: number
  /** 用户集合 */
  users: Record<number, User>
  /** 投资记录 */
  history: Investment[]
}

/**
 * 用户类型
 */
export interface User {
  id: number
  username: string
  password: string
  email: string
  gold: number
  code: string
  history: Investment[]
}

/**
 * 投资记录
 */
export interface Investment {
  /** 用户ID */
  userId: number
  /** 投资金额 */
  amount: number
  /** 收益 */
  profit: number
  /** 游戏时间 */
  tick: number
}
