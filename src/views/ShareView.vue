<template>
  <div class="share-container">
    <div class="canvas-wrapper">
      <canvas id="share-canvas"></canvas>
    </div>
    <div class="title-bar">
      <h1>
        {{ projectTitle }}
      </h1>
      <p>
        이 평면도는 읽기 전용입니다.
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { fabric } from 'fabric'
import * as api from '@/api/api'

const route = useRoute()
const projectTitle = ref('로딩 중...')
let fabricCanvas = null

onMounted(async () => {
  const shareId = route.params.id

  // Fabric 캔버스 초기화 (편집 기능 비활성화)
  fabricCanvas = new fabric.Canvas('share-canvas', {
    width: window.innerWidth,
    height: window.innerHeight,
    selection: false, // 선택 불가
    evented: false, // 모든 이벤트 비활성화
    backgroundColor: '#2c2f33',
  });

  try {
    const res = await api.getSharedProject(shareId) // 공유 API 호출
    const project = res.data;
    projectTitle.value = project.title;

    loadPlanData(project.planData);

  } catch (error) {
    projectTitle.value = '프로젝트를 찾을 수 없습니다.'
  }
})

function loadPlanData(planData) {
  // 서버 데이터로 캔버스 랜더링 (EditorView의 로드 로직과 유사)
  // 단, 모든 객체에 selectable: false, evented: false 설정

}
</script>

<style scoped>
.canvas-wrapper {}

.title-bar {}
</style>
