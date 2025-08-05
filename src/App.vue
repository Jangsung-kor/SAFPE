<template>
  <div>
    <el-container class="app-container">
      <!-- 왼쪽 도구 모음 (Aside) -->
      <el-aside width="240px">
        <div class="toolbar">
          <h2 class="toolbar-title">
            프로젝트 관리
          </h2>

          <el-divider />

          <el-button @click="handleCreateProject" :icon="FolderAdd">
            새 프로젝트
          </el-button>

          <div v-if="currentProject">
            <h3 class="tool-group-title">
              현재 프로젝트: {{ currentProject.title }}
            </h3>
            <el-button class="tool-button" type="primary" :icon="Upload" @click="handleUploadClick">
              배경 이미지 업로드
            </el-button>
          </div>

          <!-- 프로젝트 관리 부분 -->
          <h3 class="tool-group-title">
            그리기 도구
          </h3>
          <el-tooltip content="마우스로 벽을 그립니다." placement="right">
            <el-button class="tool-button" :class="{ 'is-active': activeTool === 'wall' }" :icon="EditPen"
              @click="selectTool('wall')">
              벽 그리기
            </el-button>
          </el-tooltip>
          <el-tooltip content="벽 위를 클릭하여 문을 추가합니다." placement="right">
            <el-button class="tool-button" :class="{ 'is-active': activeTool === 'door' }" :icon="SwitchButton"
              @click="selectTool('door')">
              문 추가
            </el-button>
          </el-tooltip>
          <el-tooltip content="벽 위를 클릭하여 창문을 추가합니다." placement="right">
            <el-button class="tool-button" :class="{ 'is-active': activeTool === 'window' }" :icon="FullScreen"
              @click="selectTool('window')">
              창문 추가 (구현 예정)
            </el-button>
          </el-tooltip>

          <el-divider />

          <el-tooltip content="요소를 클릭하여 삭제합니다." placement="right">
            <el-button class="tool-button" :class="{ 'is-active': activeTool === 'delete' }" :icon="Delete"
              @click="selectTool('delete')">
              삭제
            </el-button>
          </el-tooltip>

          <el-divider />

          <div v-if="currentProject?.metrics">
            <h3 class="tool-group-title">
              정보
            </h3>
            <div class="metrics-info">
              <span>
                총 벽 길이: {{ currentProject.metrics.totalWallLength }} px
              </span>
              <span>
                예상 면적: {{ currentProject.metrics.estimatedArea }} px<sup>2</sup>
              </span>
            </div>
          </div>

          <h3 class="tool-group-title">
            데이터 확인
          </h3>
          <div class="data-viewer">
            <pre>
              {{ walls }}
            </pre>
          </div>

          <div class="toolbar-footer">
            <el-button type="success" :icon="FolderChecked" @click="handleSaveProject" :disabled="!currentProject">
              프로젝트 저장
            </el-button>
          </div>

          <!-- 실제 파일 업로드를 위한 숨겨진 input -->
          <input style="display: none" ref="fileInput" type="file" accept="image/*" @change="handleFileChange" />
        </div>
      </el-aside>

      <el-container>
        <!-- 상단 헤더 (Header) -->
        <el-header height="60px">
          <div class="header-content">
            <h1 class="header-title">
              반자동 평면도 편집기
            </h1>
            <el-tag v-if="activeTool" type="info" size="large">
              선택된 도구: {{ toolNameMap[activeTool] }}
            </el-tag>
          </div>
        </el-header>

        <!-- 중앙 캔버스 영억 (Main) -->
        <el-main>
          <div class="canvas-wrapper" ref="canvasWrapper" @mousedown="handleMouseDown" @mousemove="handleMouseMove"
            @mouseup="handleMouseUp" @mouseleave="handleMouseUp" @click="handleClick">
            <!-- 배경 이미지가 없을 때 안내 메세지 -->
            <el-empty v-if="!backgroundImage" description="왼쪽 메뉴에서 배경 이미지를 업로드해주세요." />

            <!-- 배경 이미지가 있을 때 -->
            <template v-else>
              <img class="background-image" :src="backgroundImage" alt="배경 이미지" />
              <!-- 이 canvas 위에 평면도 그림 -->
              <canvas class="drawing-canvas" ref="drawingCanvas"
                :class="{ 'drawing-mode': (activeTool === 'wall' || activeTool === 'door') }"></canvas>
            </template>
          </div>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Upload, EditPen, SwitchButton, FullScreen, FolderChecked, FolderAdd, Delete } from '@element-plus/icons-vue';
import * as api from '@/api/api';

// DOM 요소를 참조하기 위한 ref
const fileInput = ref(null);
const canvasWrapper = ref(null);
const drawingCanvas = ref(null);

// 상태 관리
const currentProject = ref(null);;  // 현재 작업중인 프로젝트 전체 데이터를 저장
const walls = ref([]);  // 벽 데이터
const doors = ref([]);  // 문 데이터
const windows = ref([]);  // 창문 데이터

const backgroundImage = ref(null);
const activeTool = ref(null); // 'wall', 'door', 'window' 등.
const isDrawing = ref(false);
const startPoint = ref({
  x: 0,
  y: 0,
})
const currentPoint = ref({
  x: 0,
  y: 0,
})
const ctx = ref(null);  // 캔버스 2D 컨텍스트

// UI 텍스트 매핑
const toolNameMap = {
  wall: '벽 그리기',
  door: '문 추가',
  window: '창문 추가',
}

// '업로드' 버튼 클릭 시 숨겨진 input 클릭
const handleUploadClick = () => {
  fileInput.value.click();
}

// 파일이 선택되었을 때 처리
const handleFileChange = async (event) => {
  if (!currentProject.value) {
    ElMessage.warning('먼저 프로젝트를 생성하거나 선택해주세요.');
    return;
  }

  const file = event.target.files[0];
  if (file) {
    try {
      const response = await api.uploadBackgroundImage(currentProject.value.id, file);
      // 서버 응답으로 받은 URL로 배경 설정
      currentProject.value.backgroundImageUrl = response.data.backgroundImageUrl;
      backgroundImage.value = `http://localhost:8080${response.data.backgroundImageUrl}`;

      await nextTick();
      initializeCanvas();
    } catch (error) {
      console.error('이미지 업로드 실패:', error);
    }

    // 선택된 이미지 파일을 URL로 변환하여 화면에 표시
    backgroundImage.value = URL.createObjectURL(file);

    // 이미지가 로두된 후 캔버스 크기 조절
    nextTick(() => {
      initializeCanvas();
    })
  }
}

// 캔버스 초기화와 리사이즈
const initializeCanvas = () => {
  if (drawingCanvas.value && canvasWrapper.value) {
    ctx.value = drawingCanvas.value.getContext('2d');
    resizeCanvas();
  }
}

// 캔버스 크기로 부모 요소(wrapper)에 맞게 조절하는 함수
const resizeCanvas = () => {
  if (ctx.value && canvasWrapper.value) {
    const wrapperRect = canvasWrapper.value.getBoundingClientRect();
    drawingCanvas.value.width = wrapperRect.width;
    drawingCanvas.value.height = wrapperRect.height;

    // 리사이즈 후, 기존에 그린 내용 다시 그리기
    redrawCanvas();
  }
}

// 컴포넌트가 마운트되면 resizeObserver를 설정하여 창 크기 변경 감지
onMounted(() => {
  // 페이지 로드 시, 마지막 프로젝트 또는 특정 프로젝트 로드
  // 실제 앱에서는 라우터 파라미터에서 ID를 가져온다.
  // 만약 1번 프로젝트가 없다면, 오류 메세지 표시.
  // await loadProject(1)

  if (canvasWrapper.value) {
    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(canvasWrapper.value);
  }
})

async function loadProject(projectId) {
  try {
    const response = await api.getProjectById(projectId);
    currentProject.value = response.data;

    // 데이터 초기화
    const planData = currentProject.value.planData || [];
    walls.value = planData.walls || [];
    doors.value = planData.doors || [];
    windows.value = planData.windows || [];

    backgroundImage.value = currentProject.value.backgroundImageUrl
      ? `http://localhost:8080${currentProject.value.backgroundImageUrl}` // 전체 URL로 만들어줌
      : null;

    // 캔버스 초기화 및 다시 그리기
    await nextTick(); // DOM 업데이트를 기다립
    initializeCanvas();
  } catch (error) {
    console.log("프로젝트 로딩 실패:", error);
    // 에러 메세지는 언터셉처가 처리
  }
}

// 프로젝트 저장
async function handleSaveProject() {
  if (!currentProject.value) return;

  try {
    const projectData = {
      title: currentProject.value.title,
      planData: {
        walls: walls.value,
        doors: doors.value,
        windows: windows.value,
      }
    };

    // 저장 후, 서버로부터 계산된 metrics 데이터를 다시 받아와 갱신
    const response = await api.updateProject(currentProject.value.id, projectData);
    currentProject.value = response.data;

    ElMessage.success('프로젝트가 성공적으로 저장되었습니다.');
  } catch (error) {
    console.error("프로젝트 저장 실해:", error);
  }
}

/**
 * 새 프로젝트 생성
 */
async function handleCreateProject() {
  const { value: title } = await ElMessageBox.prompt(
    '새 프로젝트의 제목을 입력하세요.',
    '프로젝트 생성',
    {
      confirmButtonText: '생성',
      cancelButtonText: '취소',
      inputPattern: /.+/,
      inputErrorMessage: '제목은 비워둘 수 없습니다.',
    }
  );

  if (title) {
    try {
      const response = await api.createProject({ title });
      await loadProject(response.data.id);
      ElMessage.success(`'${title}' 프로젝트가 생성되었습니다.`);
    } catch (error) {
      console.error("프로젝트 생성 실패:", error);
    }
  }
}

// -- 핵심 드로잉 로직

/**
 * 캔버스를 완전히 새로 그리는 함수
 */
const redrawCanvas = () => {
  if (!ctx.value) return;
  const canvas = drawingCanvas.value;
  ctx.value.clearRect(0, 0, canvas.width, canvas.height);

  // 1. 벽 그리기
  ctx.value.strokeStyle = '#5865f2';  // 완성된 벽 색상 (Primary Color)
  ctx.value.lineWidth = 5;
  ctx.value.lineCap = 'round';
  walls.value.forEach(wall => {
    ctx.value.beginPath();
    ctx.value.moveTo(wall.start.x, wall.start.y);
    ctx.value.lineTo(wall.end.x, wall.end.y);
    ctx.value.stroke();
  });

  // 2. 문 그리기
  ctx.value.fillStyle = '#f2a358';  // 문 색상
  doors.value.forEach(door => {
    // 문은 간단히 사각형으로 표현
    ctx.value.fillRect(door.position.x - door.width / 2, door.position.y - 10, door.width, 20);
  });

  // 3. 창문 그리기
  ctx.value.fillStyle = '#58c9f2';  // 창문 색상
  windows.value.forEach(window => {
    ctx.value.fillRect(window.position.x - window.width / 2, window.position.y - 5, window.width, 10);
  })

  // 4. 현재 그리고 중인 벽 미리모기
  if (isDrawing.value && (activeTool.value === 'wall')) {
    ctx.value.strokeStyle = '#e2e2e2';  // 그리는 중인 선 색상 (Text Color)
    ctx.value.lineWidth = 2;
    ctx.value.setLineDash([5, 5]);  // 점선으로 표시

    ctx.value.beginPath();
    ctx.value.moveTo(startPoint.value.x, startPoint.value.y);
    ctx.value.lineTo(currentPoint.value.x, currentPoint.value.y);
    ctx.value.stroke();

    ctx.value.setLineDash([]);  // 점선 스타일 초기화
  }
}

// 도구 선택
function selectTool(tool) {
  // 같은 버튼을 다시 누르면 선택 해제
  activeTool.value = (activeTool.value === tool) ? null : tool;
}

// -- 마우스 동작 함수
/**
 * mousedown, mousemove, mouseup은 '벽' 그리기 전용으로 사용
 */
// 마우스 버튼 눌렀을 때
const handleMouseDown = (event) => {
  if (activeTool.value !== 'wall') return;

  isDrawing.value = true;
  startPoint.value = {
    x: event.offsetX,
    y: event.offsetY,
  }
  currentPoint.value = {
    x: event.offsetX,
    y: event.offsetY,
  }
}

/**
 * 마우스 움직일 때
 */
const handleMouseMove = (event) => {
  if (!isDrawing.value) return;

  currentPoint.value = {
    x: event.offsetX,
    y: event.offsetY,
  };

  // 실시간으로 캔버스를 다시 그려서 미리보기 선을 보여줌
  redrawCanvas();
}

/**
 * 마우스 버튼 뗐을 때 (또는 캔버스 밖으로 나갔을 때)
 */
const handleMouseUp = () => {
  if (!isDrawing.value || activeTool.value !== 'wall') {
    isDrawing.value = false;
    return;
  }

  // 시작점과 끝점이 거의 같으면 그리지 않음 (단순 클릭 방지)
  const distance = Math.sqrt(
    Math.pow(currentPoint.value.x - startPoint.value.x, 2) +
    Math.pow(currentPoint.value.y - startPoint.value.y, 2)
  );
  if (distance < 5) return;

  // 완성된 벽을 데이터 배열에 추가
  const newWall = {
    start: { ...startPoint.value },
    end: { ...currentPoint.value },
  };
  walls.value.push(newWall);

  // 최종적으로 캔버스를 다시 그려서 안성된 벽을 표시
  redrawCanvas();
  isDrawing.value = false;
}

// 클릭 이벤트는 '문', '창문' 추가와 '삭제'에 사용
const handleClick = (event) => {
  const clickPos = {
    x: event.offsetX,
    y: event.offsetY,
  };

  if (activeTool.value === 'door') {
    doors.value.push({
      id: `door-${Date.now()}`, // 삭제를 위한 임시 ID
      position: clickPos,
      width: 80,
    });
  } else if (activeTool.value === 'window') {
    windows.value.push({
      id: `windows-${Date.now()}`,
      position: clickPos,
      width: 120,
    });
  } else if (activeTool.value === 'delete') {
    deleteElementAt(clickPos);
  }

  redrawCanvas();
}

// 삭제 로직
function deleteElementAt(pos) {
  const tolerance = 15; // 클릭 허용 오차 범위

  // 1. 문 삭제 확인
  let foundIndex = doors.value.findIndex(door =>
    Math.abs(pos.x - door.position.x) < door.width / 2 &&
    Math.abs(pos.y - door.position.y) < tolerance
  );
  if (foundIndex > -1) {
    doors.value.splice(foundIndex, 1);
    return;
  }

  // 2. 창문 삭제 확인
  foundIndex = windows.value.findIndex(window =>
    Math.abs(pos.x - window.position.x) < window.width / 2 &&
    Math.abs(pos.y - window.position.y) < tolerance
  );
  if (foundIndex > -1) {
    windows.value.splice(foundIndex, 1);
    return;
  }

  // 3. 벽 삭제 확인 (점과 선 사이의 거리 계산)
  foundIndex = walls.value.findIndex(wall => {
    const dx = wall.end.x - wall.start.x;
    const dy = wall.end.y - wall.start.y;
    const lengthSq = dx * dx + dy * dy;
    if (lengthSq === 0) return false;
    let t = ((pos.x - wall.start.x) * dx + (pos.y - wall.start.y) * dy) / lengthSq;
    t = Math.max(0, Math.min(1, t));
    const closestX = wall.start.x + t * dx;
    const closestY = wall.start.y + t * dy;
    const distSq = Math.pow(pos.x - closestX, 2) + Math.pow(pos.y - closestY, 2);
    return distSq < tolerance * tolerance;
  });

  if (foundIndex > -1) {
    walls.value.splice(foundIndex, 1);
  }
}

</script>

<style scoped>
/* 기본 스타일 */
.app-container {
  height: 100vh;
}

.toolbar {
  display: flex;
  flex-direction: column;
  height: 100%;

  .el-button {
    margin-left: 0px;
  }
}

.toolbar-title {
  margin: 0 0 10px 0;
  color: var(--vt-c-white);
  font-weight: 600;
}

.tool-group-title {
  margin-top: 24px;
  margin-bottom: 12px;
  font-size: 0.9rem;
  color: #a0a0a0;
}

.tool-button {
  width: 100%;
  margin-bottom: 10px;
  justify-content: flex-start;
  /* 아이콘과 텍스트 왼쪽 정렬*/
}

/* 버튼 내부의 아이콘과 텍스트 간격 */
.tool-button .el-icon+span {
  margin-left: 12px;
}

.toolbar-footer {
  margin-top: auto;
  /* 하단에 고정 */
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
}

.header-title {
  margin: 0;
  line-height: 60px;
  /* header 높이와 동일하게 설정 */
  font-size: 1.5rem;
  font-weight: 500;
}

.canvas-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background-color: var(--container-bg-color);
  border: 1px dashed var(--border-color);
}

.background-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  /* 이미지가 찌그러지지 않게 비율 유지 */
  z-index: 1;
}

.drawing-canvas {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
}

/* --- 추가된 스타일 --- */
/* 활성화된 도구 버튼 스타일 */
.tool-button .is-active {
  background-color: var(--el-color-primary);
  color: var(--vt-c-white);
  border-color: var(--el-color-primary)
}

/* 그리기 모드일 때 커서 모양 변경 */
.drawing-canvas .drawing-mode {
  cursor: crosshair;
}

/* 데이터 확인용 스타일 */
.data-viewer {
  background-color: var(--bg-color);
  border-radius: 4px;
  padding: 10px;
  font-size: 0.75rem;
  height: 200px;
  overflow-y: auto;
  border: 1px solid var(--border-color);
}

.data-viewer pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
  color: #c0c0c0;
}

.metrics-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 0.9rem;
  color: #c0c0c0;
  padding: 10px;
  background-color: var(--bg-color);
  border-radius: 4px;
}
</style>
