<template>
  <div>
    <Splitpanes class="default-theme" style="height: 100vh; width: 100vw">
      <Pane size="40">
        <Splitpanes horizontal>
          <Pane size="60">
            <div class="leaderboard">
              <div class="leaderboard-header" @click="toggleLeaderboard">
                <h3>排行榜</h3>
                <span class="toggle-btn">{{
                  leaderboardExpand ? '收起' : '展开'
                }}</span>
              </div>
              <div class="leaderboard-content" v-show="leaderboardExpand">
                <div class="leaderboard-list">
                  <div
                    class="leaderboard-item"
                    v-for="(user, index) in leaderboard"
                    :key="user.id"
                    :class="{ 'leaderboard-item-me': user.id === userStore.id }"
                  >
                    <div class="leaderboard-rank">
                      <span
                        v-if="index < 3"
                        class="rank-badge rank-badge-top"
                        >{{ index + 1 }}</span
                      >
                      <span v-else class="rank-badge">{{ index + 1 }}</span>
                    </div>
                    <div class="leaderboard-username">{{ user.username }}</div>
                    <div class="leaderboard-gold">
                      {{ formatNumber(user.gold) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Pane>
          <Pane size="40">
            <div class="code-result">
              <div class="code-result-item">
                <div class="code-result-header" @click="toggleResult">
                  <div class="code-result-item-title">
                    <h3>运行结果</h3>
                  </div>
                  <div class="result-controls">
                    <button class="clear-log-btn" @click.stop="clearLog">
                      清空日志
                    </button>
                    <button
                      class="scroll-toggle-btn"
                      @click.stop="toggleAutoScroll"
                      :class="{ paused: !autoScroll }"
                    >
                      {{ autoScroll ? '暂停滚动' : '启动滚动' }}
                    </button>
                    <span class="toggle-btn">{{
                      resultExpand ? '收起' : '展开'
                    }}</span>
                  </div>
                </div>
                <div class="code-result-item-content" v-show="resultExpand">
                  <div class="code-result-item-content-item">
                    <div class="code-result-item-content-item-title">
                      <h3>
                        我的金币：<span style="color: red">{{
                          userStore.gold
                        }}</span>
                      </h3>
                    </div>
                    <div
                      ref="logContainerRef"
                      class="code-result-item-content-item-content log-container"
                    >
                      <div
                        v-for="(msg, index) in messages"
                        :key="index"
                        class="log-message"
                        v-html="formatMessage(msg)"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Pane>
        </Splitpanes>
      </Pane>
      <Pane size="60">
        <div class="tip">
          <div class="tip-header" @click="toggleTip">
            <h3>使用说明</h3>
            <span class="toggle-btn">{{ tipExpand ? '收起' : '展开' }}</span>
          </div>
          <div class="tip-content" v-show="tipExpand">
            <p>
              你需要定义一个 run 函数，无需 export 导出。run
              方法需要返回一个数字，表示当前 tick
              你投资的金额（一次最多投资1e8，超出该值会自动设置为1e8）
            </p>
            <p>下面是本游戏提供的一些 api 方法：</p>
            <p>
              <code>getTick()</code>
              获取当前 tick
            </p>
            <p>
              <code>getGold()</code>
              获取你拥有的金币数量
            </p>
            <p>
              <code>getMyHistory()</code>
              获取你的历史投资记录数组，包含
              <code>{amount, profit}</code>字段，amount 表示你投入的金额，profit
              表示你的利润
            </p>
          </div>
        </div>
        <div class="editor-container">
          <Editor
            ref="editorRef"
            v-model="code"
            lang="javascript"
            class="code-editor"
            @save="saveCode"
          />
        </div>
      </Pane>
    </Splitpanes>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import type { Socket } from 'socket.io-client'
import { Pane, Splitpanes } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'
import { inject, nextTick, ref, shallowRef, watchEffect, type Ref } from 'vue'
import type { Investment } from '../api/types'
import { UserApi } from '../api/user'
import Editor from '../components/editor/Editor.vue'
import { userStore } from '../store'
import { formatNumber } from '../utils'

const editorRef = shallowRef<InstanceType<typeof Editor>>()
const code = ref('')
const tipExpand = ref(true)
const resultExpand = ref(true)
const leaderboardExpand = ref(true)
const autoScroll = ref(true)
const socket = inject<Ref<Socket>>('socket')
const messages = ref<string[]>([])
const logContainerRef = ref<HTMLDivElement | null>(null)
const leaderboard = ref<Array<{ id: number; username: string; gold: number }>>(
  [],
)

const toggleTip = () => {
  tipExpand.value = !tipExpand.value
}

const toggleResult = () => {
  resultExpand.value = !resultExpand.value
}

const toggleLeaderboard = () => {
  leaderboardExpand.value = !leaderboardExpand.value
}

const toggleAutoScroll = () => {
  autoScroll.value = !autoScroll.value
}

// 格式化消息，处理换行符
const formatMessage = (msg: string) => {
  // 将换行符转换为HTML的<br>标签
  return msg.replace(/\n/g, '<br>')
}

// 清空日志
const clearLog = () => {
  messages.value = []
}

// 自动滚动到底部
watchEffect(() => {
  if (messages.value.length && autoScroll.value && logContainerRef.value) {
    nextTick(() => {
      logContainerRef.value!.scrollTop = logContainerRef.value!.scrollHeight
    })
  }
})

watchEffect(() => {
  editorRef.value?.setCode(userStore.code)
})

watchEffect(() => {
  if (!socket?.value) {
    return
  }

  socket.value.on(
    'tick',
    ({
      tick,
      investment,
      gold,
    }: {
      tick: number
      investment: Investment
      gold: number
    }) => {
      messages.value.push(
        `[${tick}]: 投资${investment.amount}，收益${
          investment.profit
        }，收益率${(
          ((investment.profit - investment.amount) / investment.amount) * 100 ||
          0
        ).toFixed(2)}%`,
      )
      messages.value = messages.value.slice(-100)
      userStore.gold = gold
    },
  )

  socket.value.on(
    'codeError',
    ({ tick, error }: { tick: number; error: string }) => {
      messages.value.push(`[tick: ${tick}]: ${error}`)
      messages.value = messages.value.slice(-100)
    },
  )

  socket.value.on(
    'runError',
    ({ tick, error }: { tick: number; error: string }) => {
      messages.value.push(`[tick: ${tick}]: ${error}`)
      messages.value = messages.value.slice(-100)
    },
  )

  socket.value.on(
    'output',
    ({ tick, output }: { tick: number; output: string }) => {
      messages.value.push(
        `[tick: ${tick} console start]:\n${output}\n[console end]`,
      )
    },
  )

  socket.value.on('allUsers', (users) => {
    leaderboard.value = users
  })
})

const saveCode = async () => {
  const res = await UserApi.uploadScript(code.value)
  if (res.code === 0) {
    userStore.code = code.value
    ElMessage.success('保存成功')
  } else {
    ElMessage.error(res.msg)
  }
}
</script>

<style scoped>
.tip {
  background-color: #f5f5f5;
  border-left: 4px solid #42b983;
  border-radius: 0 4px 4px 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin: 10px 0 20px 10px;
}

.tip-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  cursor: pointer;
  user-select: none;
}

.tip-header h3 {
  margin: 0;
  color: #333;
  font-size: 16px;
}

.toggle-btn {
  color: #42b983;
  font-size: 14px;
  font-weight: bold;
}

.tip-content {
  padding: 0 16px 16px 16px;
}

.tip-content p {
  margin: 8px 0;
  line-height: 1.5;
  color: #333;
}

.tip-content p:first-child {
  margin-top: 0;
}

.tip-content p:last-child {
  margin-bottom: 0;
}

.tip-content code {
  background-color: #e0e0e0;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: monospace;
  font-weight: bold;
  color: #d63384;
}

.editor-container {
  width: 100%;
  height: calc(100vh - 400px);
}

.code-editor {
  margin-left: -10px;
}

.code-result {
  margin: 20px 10px;
  height: calc(100% - 40px);
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.code-result-item {
  margin-bottom: 20px;
  height: calc(100% - 20px);
}

.code-result-item-title {
  padding: 12px 16px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
  border-radius: 4px 4px 0 0;
}

.code-result-item-title h3 {
  margin: 0;
  color: #495057;
  font-size: 18px;
  font-weight: 600;
}

.code-result-item-content {
  height: 100%;
  padding: 16px;
}

.code-result-item-content-item {
  height: 100%;
}

.code-result-item-content-item-title h3 {
  margin: 0 0 12px 0;
  color: #495057;
  font-size: 16px;
  font-weight: 500;
}

.log-container {
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  padding: 12px;
  max-height: calc(100% - 130px);
  overflow-y: auto;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.4;
}

.log-message {
  margin: 4px 0;
  padding: 2px 0;
  color: #495057;
  white-space: pre-wrap;
}

.log-message:first-child {
  margin-top: 0;
}

.log-message:last-child {
  margin-bottom: 0;
}

.code-result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
  border-radius: 4px 4px 0 0;
  cursor: pointer;
  user-select: none;
}

.code-result-header .code-result-item-title {
  background-color: transparent;
  padding: 0;
  border-bottom: none;
}

.result-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.clear-log-btn {
  margin-right: 10px;
  padding: 4px 8px;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.3s;
}

.clear-log-btn:hover {
  background-color: #c82333;
}

.scroll-toggle-btn {
  margin-right: 10px;
  padding: 4px 12px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.scroll-toggle-btn:hover {
  background-color: #359c6d;
}

.scroll-toggle-btn.paused {
  background-color: #6c757d;
}

.scroll-toggle-btn.paused:hover {
  background-color: #5a6268;
}

.code-result-header .toggle-btn {
  color: #42b983;
  font-size: 14px;
  font-weight: bold;
}

.leaderboard {
  margin: 20px 10px 10px;
  border: 1px solid #ddd;
  height: calc(100% - 40px);
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.leaderboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
  border-radius: 4px 4px 0 0;
  cursor: pointer;
  user-select: none;
}

.leaderboard-header h3 {
  margin: 0;
  color: #495057;
  font-size: 18px;
  font-weight: 600;
}

.leaderboard-content {
  padding: 16px;
  height: calc(100% - 72px);
}

.leaderboard-list {
  height: 100%;
  overflow-y: auto;
}

.leaderboard-item {
  display: flex;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.leaderboard-item:last-child {
  border-bottom: none;
}

.leaderboard-item-me {
  background-color: #e8f4ff;
  font-weight: bold;
}

.leaderboard-rank {
  width: 40px;
  text-align: center;
}

.rank-badge {
  display: inline-block;
  width: 24px;
  height: 24px;
  line-height: 24px;
  text-align: center;
  border-radius: 50%;
  background-color: #f0f0f0;
  color: #666;
  font-weight: bold;
}

.rank-badge-top {
  background-color: #ffd700;
  color: #000;
}

.leaderboard-username {
  flex: 1;
  padding-left: 10px;
}

.leaderboard-gold {
  color: #ff6b35;
  font-weight: bold;
}
</style>
<style>
.splitpanes__pane {
  font-family: Helvetica, Arial, sans-serif;
  background-color: #fff !important;
}

.splitpanes__splitter {
  background-color: #eee !important;
}
</style>
