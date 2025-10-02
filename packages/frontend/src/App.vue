<template>
  <div><router-view></router-view></div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { io, type Socket } from 'socket.io-client'
import { onMounted, onUnmounted, provide, ref } from 'vue'
import { useRouter } from 'vue-router'
import { UserApi } from './api/user'
import { userStore } from './store'

const router = useRouter()
const socket = ref<Socket | null>(null)
provide('socket', socket)

onMounted(async () => {
  // 初次加载时，请求用户信息
  const token = localStorage.getItem('token')
  if (!token) {
    if (!window.location.hash.startsWith('#/login')) {
      router.replace('/login')
    }
    return
  }

  UserApi.getMyInfo()
    .then((res) => {
      if (res.code !== 0) {
        console.log(res)
        localStorage.removeItem('token')
        if (!window.location.hash.startsWith('#/login')) {
          router.replace('/login')
        }
        return
      }

      userStore.id = res.data.id
      userStore.email = res.data.email
      userStore.username = res.data.username
      userStore.gold = res.data.gold
      userStore.code = res.data.code
      userStore.history = res.data.history

      socket.value = io('', {
        query: {
          token: localStorage.getItem('token'),
        },
        path: '/ws',
      })
    })
    .catch((error) => {
      ElMessage.error('获取用户信息失败')
      console.error(error)
    })
})

onUnmounted(() => {
  socket.value?.disconnect()
})
</script>

<style scoped></style>
