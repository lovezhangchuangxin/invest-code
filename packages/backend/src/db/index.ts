import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

// 数据目录
export const DATA_FILE_DIR = resolve('./data')
// 数据文件路径
export const DATA_FILE_PATH = resolve(DATA_FILE_DIR, 'game-data.json')

// 如果目录不存在，则创建目录
if (!existsSync(DATA_FILE_DIR)) {
  mkdirSync(DATA_FILE_DIR, { recursive: true })
}

/**
 * 读取游戏数据
 */
export const readGameData = (): GameData => {
  if (existsSync(DATA_FILE_PATH)) {
    const data = readFileSync(DATA_FILE_PATH, 'utf-8')
    return JSON.parse(data)
  }
  return { tick: 1, users: {}, history: [] }
}

/**
 * 游戏数据
 */
export const gameData: GameData = readGameData()

/**
 * 保存游戏数据
 */
export const saveGameData = () => {
  const jsonData = JSON.stringify(gameData, null, 2)
  writeFileSync(DATA_FILE_PATH, jsonData, 'utf-8')
}

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
  id: number
  /** 用户ID */
  userId: number
  /** 投资金额 */
  amount: number
  /** 收益 */
  profit: number
  /** 游戏时间 */
  tick: number
}
