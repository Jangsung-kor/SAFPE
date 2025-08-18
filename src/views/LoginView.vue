<template>
  <div class="auth-container">
    <el-card class="auth-card">
      <h2>
        로그인
      </h2>
      <el-form @submit.prevent="handleLogin">
        <el-form-item label="아이디">
          <el-input v-model="username" />
        </el-form-item>
        <el-form-item label="비밀번호">
          <el-input v-model="password" type="password" />
        </el-form-item>
        <el-button style="width: 100%;" type="primary" native-type="submit">
          로그인
        </el-button>
      </el-form>
      <div class="link-container">
        <router-link to="/register">
          회원가입
        </router-link>
      </div>
    </el-card>
  </div>
</template>
<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const username = ref('')
const password = ref('')
const router = useRouter()
const authStore = useAuthStore();

const handleLogin = async () => {
  const success = await authStore.login({
    username: username.value,
    password: password.value,
  })
  if (success) {
    // 로그인 성공 시
    router.push({ name: 'Editor' });
  }
}
</script>
<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}

.auth-card {
  width: 400px;
}

.link-container {
  margin-top: 15px;
  text-align: center;
}
</style>
