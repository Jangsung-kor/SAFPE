<template>
  <div class="auth-container">
    <el-card class="auth-card">
      <h2>
        회원가입
      </h2>
      <el-form @submit.prevent="handleRegister">
        <el-form-item label="아이디">
          <el-input v-model="username" />
        </el-form-item>
        <el-form-item label="비밀번호">
          <el-input v-model="password" type="password" />
        </el-form-item>
        <el-button style="width: 100%;" type="primary" native-type="submit">
          회원가입
        </el-button>
      </el-form>
      <div class="link-container">
        <router-link to="/login">
          로그인
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

const handleRegister = async () => {
  const success = await authStore.register({
    username: username.value,
    password: password.value,
  })
  if (success) {
    // 로그인 성공 시
    router.push({ name: 'Login' });
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
