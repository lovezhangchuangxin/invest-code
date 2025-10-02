<template>
  <div class="page-bg">
    <el-card class="login-card">
      <el-tabs v-model="activeTab" stretch>
        <el-tab-pane label="登录" name="login">
          <el-form
            :model="loginForm"
            :rules="loginRules"
            ref="loginFormRef"
            label-width="80px"
          >
            <el-form-item label="用户名" prop="username">
              <el-input
                v-model="loginForm.username"
                autocomplete="username"
                clearable
                placeholder="请输入用户名"
              />
            </el-form-item>
            <el-form-item label="密码" prop="password">
              <el-input
                v-model="loginForm.password"
                type="password"
                autocomplete="current-password"
                show-password
                clearable
                placeholder="请输入密码"
              />
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                @click="handleLogin"
                :loading="loading"
                block
              >
                登录
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="注册" name="register">
          <el-form
            :model="registerForm"
            :rules="registerRules"
            ref="registerFormRef"
            label-width="80px"
          >
            <el-form-item label="用户名" prop="username">
              <el-input
                v-model="registerForm.username"
                autocomplete="username"
                clearable
                placeholder="请输入用户名"
              />
            </el-form-item>
            <el-form-item label="邮箱" prop="email">
              <el-input
                v-model="registerForm.email"
                autocomplete="email"
                clearable
                placeholder="请输入邮箱地址"
              />
            </el-form-item>
            <el-form-item label="密码" prop="password">
              <el-input
                v-model="registerForm.password"
                type="password"
                autocomplete="new-password"
                show-password
                clearable
                placeholder="请输入密码"
              />
            </el-form-item>
            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input
                v-model="registerForm.confirmPassword"
                type="password"
                autocomplete="new-password"
                show-password
                clearable
                placeholder="请再次输入密码"
              />
            </el-form-item>
            <el-form-item label="验证码" prop="verification">
              <el-row :gutter="8">
                <el-col :span="16">
                  <el-input v-model="registerForm.verification" clearable />
                </el-col>
                <el-col :span="8">
                  <el-button
                    @click="getVerification"
                    :disabled="countdown > 0 || !registerForm.email"
                    :loading="verifying"
                    style="width: 100%"
                  >
                    {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
                  </el-button>
                </el-col>
              </el-row>
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                @click="handleRegister"
                :loading="loading"
                >注册</el-button
              >
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import {
  ElButton,
  ElCard,
  ElCol,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElRow,
  ElTabPane,
  ElTabs,
} from 'element-plus'
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { UserApi } from '../api/user'

const router = useRouter()
const activeTab = ref<'login' | 'register'>('login')
const loading = ref(false)
const verifying = ref(false)
const countdown = ref(0)
let timer: number | undefined

// 登录表单
const loginForm = reactive({
  username: '',
  password: '',
})
const loginRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}
const loginFormRef = ref()

// 注册表单
const registerForm = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  verification: '',
})
const registerRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 16, message: '用户名长度为2-16位', trigger: 'blur' },
  ],
  email: [{ required: true, message: '请输入邮箱', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 18, message: '密码长度为6-18位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (_: any, value: string, callback: any) => {
        if (value !== registerForm.password) {
          callback('两次密码不一致')
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
  verification: [{ required: true, message: '请输入验证码', trigger: 'blur' }],
}
const registerFormRef = ref()

// 登录
const handleLogin = () => {
  loginFormRef.value?.validate(async (valid: boolean) => {
    if (!valid) return
    loading.value = true
    try {
      const res = await UserApi.login({
        username: loginForm.username,
        password: loginForm.password,
      })
      if (res.code === 0) {
        localStorage.setItem('token', res.data.token)
        ElMessage.success('登录成功')
        router.push({ path: '/' })
      } else {
        ElMessage.error(res.msg)
      }
    } catch (e: any) {
      ElMessage.error(e?.msg || '登录失败')
    } finally {
      loading.value = false
    }
  })
}

// 注册
const handleRegister = () => {
  registerFormRef.value?.validate(async (valid: boolean) => {
    if (!valid) return
    loading.value = true
    try {
      const res = await UserApi.register(
        {
          username: registerForm.username,
          password: registerForm.password,
          email: registerForm.email,
        },
        registerForm.verification,
      )
      if (res.code === 0) {
        localStorage.setItem('token', res.data.token)
        ElMessage.success('注册成功')
        router.push({ path: '/' })
      } else {
        ElMessage.error(res.msg)
      }
    } catch (e: any) {
      ElMessage.error(e?.msg || '注册失败')
    } finally {
      loading.value = false
    }
  })
}

// 获取验证码
const getVerification = async () => {
  if (!registerForm.email) {
    ElMessage.warning('请先输入邮箱')
    return
  }

  // 验证邮箱格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(registerForm.email)) {
    ElMessage.warning('请输入正确的邮箱格式')
    return
  }
  verifying.value = true
  try {
    const res = await UserApi.sendVerification(registerForm.email)
    if (res.code === 0) {
      ElMessage.success('验证码已发送，请查收邮箱')
      // 如果接口返回验证码（未配置邮箱密码），可直接填入
      if (res.data.verification) {
        registerForm.verification = res.data.verification
        ElMessage.info(`测试验证码：${res.data.verification}`)
      }
      countdown.value = 60
      timer = window.setInterval(() => {
        countdown.value--
        if (countdown.value <= 0) {
          clearInterval(timer)
        }
      }, 1000)
    } else {
      ElMessage.error(res.msg)
    }
  } catch (e: any) {
    ElMessage.error(e?.msg || '验证码发送失败')
  } finally {
    verifying.value = false
  }
}
</script>

<style scoped>
.page-bg {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}
.login-card {
  width: 100%;
  max-width: 450px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
  border-radius: 20px;
  padding: 40px 35px 30px 35px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  margin: 0 auto;
}
:deep(.el-tabs__nav-wrap)::after {
  height: 1px;
}

:deep(.el-tabs__item) {
  font-size: 16px;
  font-weight: 500;
  padding: 0 30px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #333;
}

:deep(.el-input__inner) {
  height: 45px;
  border-radius: 10px;
  font-size: 15px;
  padding-left: 15px;
}

:deep(.el-button--primary) {
  height: 45px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 500;
  letter-spacing: 1px;
  transition: all 0.3s ease;
}

:deep(.el-button--primary:hover) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

.el-form-item {
  margin-bottom: 24px;
}

.el-row {
  width: 100%;
  display: flex;
  align-items: center;
}

@media (max-width: 500px) {
  .login-card {
    padding: 30px 20px 20px 20px;
    max-width: 96vw;
    border-radius: 15px;
  }

  :deep(.el-tabs__item) {
    padding: 0 20px;
    font-size: 15px;
  }

  :deep(.el-form-item__label) {
    font-size: 14px;
  }
}
</style>
