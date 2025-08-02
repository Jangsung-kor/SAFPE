<template>
  <div>
    <el-container class="app-container">
      <!-- 왼쪽 도구 모음 (Aside) -->
      <el-aside width="240px">
        <div class="toolbar">
          <h2 class="toolbar-title">
            도구
          </h2>
          <el-divider />

          <el-button class="tool-button" type="primary" :icon="Upload" @click="handleUploadClick">
            배경 이미지 업로드
          </el-button>

          <h3 class="tool-group-title">
            그리기 도구
          </h3>
          <el-button class="tool-button" :icon="EditPen">
            벽 그리기
          </el-button>
          <el-button class="tool-button" :icon="SwitchButton">
            문 추가
          </el-button>
          <el-button class="tool-button" :icon="FullScreen">
            창문 추가
          </el-button>

          <el-divider />

          <div class="toolbar-footer">
            <el-button type="success" :icon="FolderChecked">
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
          <h1 class="header-title">
            반자동 평면도 편집기
          </h1>
        </el-header>

        <!-- 중앙 캔버스 영억 (Main) -->
        <el-main>
          <div class="canvas-wrapper" ref="canvasWrapper">
            <!-- 배경 이미지가 없을 때 안내 메세지 -->
            <el-empty v-if="!backgroundImage" description="왼쪽 메뉴에서 배경 이미지를 업로드해주세요." />

            <!-- 배경 이미지가 있을 때 -->
            <template v-else>
              <img class="background-image" :src="backgroundImage" alt="배경 이미지" />
              <!-- 이 canvas 위에 평면도 그림 -->
              <canvas class="drawing-canvas" ref="drawingCanvas"></canvas>
            </template>
          </div>
        </el-main>
      </el-container>

    </el-container>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'
import { Upload, EditPen, SwitchButton, FullScreen, FolderChecked } from '@element-plus/icons-vue';

// DOM 요소를 참조하기 위한 ref
const fileInput = ref(null);
const canvasWrapper = ref(null);
const drawingCanvas = ref(null);
const backgroundImage = ref(null);

// '업로드' 버튼 클릭 시 숨겨진 input 클릭
const handleUploadClick = () => {
  fileInput.value.click();
}

// 파일이 선택되었을 때 처리
const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    // 선택된 이미지 파일을 URL로 변환하여 화면에 표시
    backgroundImage.value = URL.createObjectURL(file);

    // 이미지가 로두된 후 캔버스 크기 조절
    nextTick(() => {
      resizeCanvas();
    })
  }
}

// 캔버스 크기로 부모 요소(wrapper)에 맞게 조절하는 함수
const resizeCanvas = () => {
  if (drawingCanvas.value && canvasWrapper.value) {
    const wrapperRect = canvasWrapper.value.getBoundingClientRect();
    drawingCanvas.value.width = wrapperRect.width;
    drawingCanvas.value.height = wrapperRect.height;
    console.log(`캔버스 크기 조절됨: ${wrapperRect.width}x${wrapperRect.height}`)

    // TODO: 여기에 캔버스 그리고 초기화 로직 추가
  }
}

// 컴포넌트가 마운트되면 resizeObserver를 설정하여 창 크기 변경 감지
onMounted(() => {
  const observer = new ResizeObserver(resizeCanvas);
  observer.observe(canvasWrapper.value);
})

</script>

<style scoped>
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
  /* 비경 이미지 위에 위치 */
  cursor: crosshair;
}
</style>
