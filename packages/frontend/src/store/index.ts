import { reactive } from 'vue'
import type { Investment, User } from '../api/types'

export const userStore = reactive<Omit<User, 'password'>>({
  id: 0,
  username: '',
  email: '',
  gold: 0,
  code: '',
  history: [] as Investment[],
})

export const allUsersStore = reactive<Partial<User>[]>([])
