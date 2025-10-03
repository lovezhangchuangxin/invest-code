const { copyFileSync, readFileSync, writeFileSync } = require('fs')
const { resolve } = require('path')

// 游戏数据目录
const DATA_DIR = resolve(__dirname, '../data')
// 游戏数据文件
const DATA_FILE = resolve(DATA_DIR, 'game-data.json')
// 备份文件名
const BACKUP_FILE = 'data.json'

/**
 * 重置数据
 */
function resetData() {
  // 先备份数据
  backupData()
  // 读取数据文件
  const str = readFileSync(DATA_FILE)
  /** @type {import('../src/db/index').GameData} */
  const data = JSON.parse(str)
  Object.values(data.users).forEach((user) => {
    user.gold = 100
    user.history = []
  })
  // 重新写入文件
  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
}

/**
 * 备份游戏数据
 */
function backupData() {
  // 备份文件名，时间戳 + 文件名
  const backupFileName = `${Date.now()}-${BACKUP_FILE}`
  copyFileSync(DATA_FILE, resolve(DATA_DIR, backupFileName))
}

resetData()
console.log('数据重置成功')
