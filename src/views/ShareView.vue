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
import { ref, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { fabric } from 'fabric'
import * as api from '@/api/api'

const route = useRoute()
const projectTitle = ref('로딩 중...')
let fabricCanvas = null

const walls = ref([]);  // 벽 데이터
const doors = ref([]);  // 문 데이터
const windows = ref([]);  // 창문 데이터
const backgroundImage = ref(null);

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

    loadPlanData(project);

  } catch (error) {
    projectTitle.value = '프로젝트를 찾을 수 없습니다.'
  }
})

async function loadPlanData(project) {
  // 서버 데이터로 캔버스 랜더링 (EditorView의 로드 로직과 유사)
  // 단, 모든 객체에 selectable: false, evented: false 설정
  // 데이터 초기화
  walls.value = project.planData.walls || [];
  doors.value = project.planData.doors || [];
  windows.value = project.planData.windows || [];

  backgroundImage.value = project.backgroundImageUrl
    ? `http://localhost:8080${project.backgroundImageUrl}` // 전체 URL로 만들어줌
    : null;

  fabricCanvas.setBackgroundImage(
    backgroundImage.value,
    fabricCanvas.renderAll.bind(fabricCanvas)
  )

  setupCanvasListeners()

  // 캔버스 초기화 및 다시 그리기
  await nextTick(); // DOM 업데이트를 기다립
}

function setupCanvasListeners() {
  walls.value.forEach((wall) => {
    const points = [wall.start.x, wall.start.y, wall.end.x, wall.end.y];
    const line = new fabric.Line(points, {
      stroke: '#5865f2',
      strokeWidth: 5,
      selectable: false, // 개별 선택 비활성화
      evented: false,
      originX: 'center',
      originY: 'center',
      type: 'wall-line',
    });
    fabricCanvas.add(line)
  })

  doors.value.forEach((door) => {
    const newObj = new fabric.Rect({
      left: door.position.x,
      top: door.position.y,
      width: door.width,
      height: 20,
      fill: '#f2a358',
      type: 'door',
      id: `door-${Date.now()}`
    });
    fabricCanvas.add(newObj)
  })

  windows.value.forEach((window) => {
    const newObj = new fabric.Rect({
      left: window.position.x - 60,
      top: window.position.y - 5,
      width: window.width,
      height: 10,
      fill: '#58c9f2',
      type: 'window',
      id: `window-${Date.now()}`
    });
    fabricCanvas.add(newObj)
  })
}
</script>

<style scoped>
.canvas-wrapper {}

.title-bar {}
</style>
