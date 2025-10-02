import { isArray, isObject } from 'lodash'
import { DeepPartial } from './types'

/**
 * 防抖
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  wait: number,
  immediate = false,
) {
  let timeout: number | null = null
  return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    // eslint-disable-next-line
    const context = this
    const callNow = immediate && !timeout
    if (timeout) clearTimeout(timeout)
    timeout = window.setTimeout(() => {
      timeout = null
      if (!immediate) fn.apply(context, args)
    }, wait)
    if (callNow) fn.apply(context, args)
  } as T
}

/**
 * 节流
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  wait: number,
  immediate = false,
) {
  let timeout: number | null = null
  let initialCall = true
  return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    // eslint-disable-next-line
    const context = this
    if (initialCall) {
      if (immediate) fn.apply(context, args)
      initialCall = false
    } else {
      if (timeout) return
      timeout = window.setTimeout(() => {
        fn.apply(context, args)
        clearTimeout(timeout!)
        timeout = null
      }, wait)
    }
  } as T
}

/**
 * 生成指定长度的随机字符串
 */
export function randomString(length = 8) {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const maxPos = chars.length
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * maxPos))
  }
  return result
}

/**
 * 生成指定长度的 id，不考虑时间
 *
 * @param length id 长度
 * @param time 时间戳，可选
 */
export function generateId(length = 8, time?: number) {
  const id = randomString(length)
  if (time) {
    return `${time.toString(36)}_${id}`
  }
  return id
}

/**
 * 生成指定位数的验证码
 */
export function generateCode(length = 6) {
  // 不用易混淆的字符，如 0 O, 1 I, 2 Z
  const chars = '3456789ABCDEFGHJKLMNPQRSTUVWXY'
  // const chars = '1111111111111111111111111111111'
  const maxPos = chars.length
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * maxPos))
  }
  return result
}

/**
 * 将数字按照千分位分割
 */
export function formatNumber(num: number | string) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/**
 * 将秒数转为 HH:mm:ss 格式
 */
export function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600)
    .toString()
    .padStart(2, '0')
  const m = Math.floor((seconds % 3600) / 60)
    .toString()
    .padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${h}:${m}:${s}`
}

/**
 * 将秒数转为 HH:mm:ss 格式
 */
export function formatTime4Fleet(seconds: number) {
  const totalSeconds = Math.floor(seconds)
  const d = Math.floor(totalSeconds / 86400)
  const h = Math.floor((totalSeconds % 86400) / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  const pad = (num: number) => num.toString().padStart(2, '0')

  if (d > 0) {
    return `${d}天${pad(h)}时${pad(m)}分${pad(s)}秒`
  } else if (h > 0) {
    return `${pad(h)}时${pad(m)}分${pad(s)}秒`
  } else if (m > 0) {
    return `${pad(m)}分${pad(s)}秒`
  } else {
    return `${pad(s)}秒`
  }
}

/**
 * 将数字转为带单位的字符串
 */
export function formatNumberUnit(num: number) {
  const unitName = [
    '',
    'K',
    'M',
    'B',
    'T',
    'AA',
    'AB',
    'AC',
    'AD',
    'AE',
    'AF',
    'AG',
    'AH',
  ]

  let tempValue = num
  let unit = ''
  const bit = Math.log10(tempValue)
  const hideUnit = Math.ceil((bit - 6) / 3)
  if (hideUnit > 0) {
    unit = unitName[hideUnit]
    tempValue = Math.floor(tempValue / Math.pow(10, hideUnit * 3))
  } else {
    unit = unitName[0]
  }

  return {
    format: formatNumber(tempValue),
    unit,
    full: formatNumber(num),
    fullFormat: `${formatNumber(tempValue)}${unit}`,
  }
}

/**
 * 随机生成一个区间范围内的整数
 * [min,max)
 */
export function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min) + min)
}

/**
 * 深度应用 diff 数据，不考虑删除字段，值为数组直接合并
 */
export function applyDiff<T extends Record<string, any>>(
  origin: T,
  diff: DeepPartial<T>,
) {
  for (const key in diff) {
    const diffVal = diff[key]
    const originVal = origin[key]

    // 递归处理嵌套对象
    if (!isArray(diffVal) && isObject(diffVal) && isObject(originVal)) {
      applyDiff(originVal, diffVal)
    }
    // 直接赋值基础类型或覆盖整个对象/数组
    else {
      origin[key] = diffVal as any
    }
  }
}

/**
 * 判断时间是否为今天
 */
export function isToday(time: number): boolean {
  if (!time) return false

  const date = new Date(time)
  const now = new Date()

  // 比较年、月、日
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  )
}

/**
 * 获取对象具有不同值的键，只考虑值为基础类型
 */
export function diffKeys<T extends Record<PropertyKey, any>>(
  origin: T,
  target: T,
) {
  const obj = { ...origin, ...target }
  const keys: (keyof T)[] = []
  Object.keys(obj).forEach((key) => {
    if (origin[key] !== target[key]) {
      keys.push(key)
    }
  })
  return keys
}

/**
 * 休眠指定时间
 */
export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
