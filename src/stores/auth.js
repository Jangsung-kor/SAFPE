import { defineStore } from 'pinia'
import * as api from '@/api/api'
import { ElMessage } from 'element-plus'

export const useAuthStore = defineStore('auth', {
  // 1. State: 스토어 데이터
  state: () => ({
    // 페이지 새로고침 시 localStorage에서 토큰을 가져와 초기 상태 설정
    token: localStorage.getItem('token') || null,
    user: null, // 사용자 정보 (필요 시 로드)
  }),

  // 2. Getters: 계산된 값
  getters: {
    // 사용자가 로그인했는지 여부를 반환
    isAuthenticated: (state) => !!state.token,
  },

  // 3. Actions: 메서드 (API 호출, 상태 변경 등)
  actions: {
    // 로그인 액션
    async login(credentials) {
      try {
        const response = await api.loginUser(credentials)
        const token = response.data.token

        // 상태 업데이트
        this.token = token

        // 토큰을 localStorage에 저장하여 로그인 상태 유지
        localStorage.setItem('token', token)

        ElMessage.success('로그인 성공!')
        return true // 성공 여부 반환
      } catch (error) {
        console.error('로그인 실패:', error)
        ElMessage.error('아이디 또는 비밀번호를 확인해주세요.')
        return false
      }
    },

    async register(userInfo) {
      try {
        await api.registerUser(userInfo)
        ElMessage.success('회원가입 성공! 로그인해주세요.')
        return true
      } catch (error) {
        console.error('회원가입 실패:', error)
        ElMessage.error(error.response?.data?.message || '회원가입에 실패했습니다.')
        return false
      }
    },

    // 로그아웃 액션
    logout() {
      // 상태 초기화
      this.token = null
      this.user = null

      // localStorage에서 토큰 추가
      localStorage.removeItem('token')
      ElMessage.info('로그아웃 되었습니다.')
    },
  },
})
