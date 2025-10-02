import axios, { type AxiosRequestConfig } from 'axios'
import type { DafaultRequestMethod, ResponseData } from './types'

// 创建 axios 实例
export const instance = axios.create({
  baseURL: `/api`,
  timeout: 10000,
})

// 请求拦截器
instance.interceptors.request.use(
  (config) => {
    // 携带 token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// 响应拦截器
instance.interceptors.response.use(
  (response) => {
    // '401'
    if (response.data.code == 401) {
      localStorage.removeItem('token')
      window.location.href = '/#/login'
      response.data.msg = 'token过期，请重新登录'
    }

    return response
  },
  (error) => {
    if (error.response.status === 500 && !import.meta.env.DEV) {
      const hash = '#/500'
      if (window.location.hash !== hash) {
        window.location.href = '/#/500'
      }
    }
    return Promise.reject(error)
  },
)

// 通用请求方法
export const req = async <T>(
  method: DafaultRequestMethod,
  url: string,
  data?: any,
  config: AxiosRequestConfig = {},
): Promise<ResponseData<T>> => {
  config = {
    headers: {
      'Content-Type': 'application/json',
    },
    ...config,
    method,
  }

  data =
    config.headers!['Content-Type'] === 'application/json' && method !== 'GET'
      ? JSON.stringify(data)
      : data

  if (method === 'GET' || method === 'DELETE') {
    config.params = data
  } else {
    config.data = data
  }

  return (await instance(url, config)).data
}
