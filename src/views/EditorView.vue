<template>
  <div>
    <el-container class="app-container">
      <!-- 왼쪽 도구 모음 (Aside) -->
      <el-aside width="280px">
        <div class="toolbar">
          <h2 class="toolbar-title">
            프로젝트 관리
          </h2>

          <el-divider />

          <!--
          <el-button @click="handleCreateProject" :icon="FolderAdd">
            새 프로젝트
          </el-button>
          -->
          <!-- 새 프로젝트 생성 버튼 -->
          <el-button style="width: 100%" @click="openCreateDialog" :icon="FolderAdd" type="primary">
            새 프로젝트 (AI 분석)
          </el-button>

          <!-- 새 프로젝트 생성 다이얼로그 -->
          <el-dialog v-model="createDialogVisible" title="새 프로젝트 생성 (AI 분석)" width="500px">
            <el-form ref="createFormRef" :model="createForm" label-width="120px">
              <el-form-item label="프로젝트 제목" prop="title"
                :rules="{ required: true, message: '제목을 입력하세요', trigger: 'blur' }">
                <el-input v-model="createForm.title" />
              </el-form-item>
              <el-form-item label="평면도 사진" prop="file"
                :rules="{ required: true, message: '분석할 사진을 업로드하세요', trigger: 'blur' }">
                <el-upload ref="uploadRef" :auto-upload="false" :limit="1" :on-change="handleFileSelect"
                  :on-exceed="handleFileExceed">
                  <template #trigger>
                    <el-button type="primary">
                      파일 선택
                    </el-button>
                  </template>
                </el-upload>
              </el-form-item>
            </el-form>
            <template #footer>
              <span class="dialog-footer">
                <el-button @click="createDialogVisible = false">
                  취소
                </el-button>
                <el-button :loading="isCreating" type="primary" @click="handleCreateProject">
                  생성
                </el-button>
              </span>
            </template>
          </el-dialog>

          <div v-if="currentProject">
            <h3 class="tool-group-title">
              현재 프로젝트: {{ currentProject.title }}
            </h3>
            <el-button class="tool-button" type="primary" :icon="Upload" @click="handleUploadClick">
              배경 이미지 업로드
            </el-button>
          </div>

          <!-- 공유 설정 UI -->
          <div v-if="currentProject" class="tool-option">
            <span>
              프로젝트 공개
            </span>
            <el-switch v-model="isProjectPublic" @change="toggleShare" />
          </div>
          <div v-if="isProjectPublic && currentProject.shareId" class="share-link-box">
            <p>
              공유 링크:
            </p>
            <el-input :value="shareLink" readonly>
              <template #append>
                <el-button @click="copyShareLink">
                  복사
                </el-button>
              </template>
            </el-input>
          </div>

          <h3 class="tool-group-title">
            편집 도구
          </h3>
          <el-button-group>
            <el-tooltip content="선택과 수정" placement="top">
              <el-button :type="activeTool === 'select' ? 'primary' : ''" :icon="Pointer"
                @click="selectTool('select')" />
            </el-tooltip>
            <el-tooltip content="실행 취소 (Ctrl+Z)" placement="top">
              <el-button :icon="RefreshLeft" :disabled="!canUndo" @click="undo" />
            </el-tooltip>
            <el-tooltip content="다시 실행 (Ctrl+Y)" placement="top">
              <el-button :icon="RefreshRight" :disabled="!canRedo" @click="redo" />
            </el-tooltip>
            <el-tooltip content="삭제 (Delete)" placement="top">
              <el-button :icon="Delete" @click="deleteSelected" />
            </el-tooltip>
          </el-button-group>

          <!-- 스냅 토글 스위치 -->
          <div class="tool-option">
            <span>
              스냅 활성화
            </span>
            <el-switch v-model="isSnapEnabled" />
          </div>

          <h3 class="tool-group-title">
            가구 라이브러리
          </h3>
          <div class="furniture-list">
            <div class="furniture-item" v-for="item in furnitureLibrary" :key="item.type" draggable="true"
              @dragstart="handleDragStart($event, item)">
              <el-icon>
                <component :is="item.icon" />
              </el-icon>
              <span>
                {{ item.name }}
              </span>
            </div>
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
              창문 추가
            </el-button>
          </el-tooltip>

          <el-divider />
          <!-- 레이어 패널 -->
          <h3 class="tool-group-title">
            레이어
          </h3>
          <div class="layer-panel">
            <div class="layer-item" v-for="layer in layers" :key="layer.id">
              <span class="layer-name">
                {{ layer.name }}
              </span>
              <div class="layer-controls">
                <el-tooltip :content="layer.locked ? '잠금 해제' : '잠금'">
                  <el-button :icon="layer.locked ? Lock : Unlock" circle size="small"
                    @click="toggleLayerLock(layer.id)" />
                </el-tooltip>
                <el-tooltip :content="layer.visible ? '숨기기' : '보이기'">
                  <el-button :icon="layer.visible ? View : Hide" circle size="small"
                    @click="toggleLayerVisibility(layer.id)" />
                </el-tooltip>
              </div>
            </div>
          </div>

          <!-- 선택된 객체 정보 표시 -->
          <div v-if="selectedObjectInfo">
            <h3 class="tool-group-title">
              선택된 요소 정보
            </h3>
            <div class="metrics-info">
              <span>
                타입: {{ selectedObjectInfo.type }}
              </span>
              <span>
                너비: {{ selectedObjectInfo.width }} px
              </span>
              <span v-if="selectedObjectInfo.height">
                높이: {{ selectedObjectInfo.height }} px
              </span>
              <span v-if="selectedObjectInfo.angle">
                각도: {{ selectedObjectInfo.angle }} °
              </span>
            </div>

            <!-- 스케일 UI -->
            <div class="scale-setter" v-if="selectedObjectInfo.type === '벽'">
              <p>
                이 벽의 실제 길이를 입력하여 스케일을 설정하세요.
              </p>
              <el-input v-model.number="realLengthInput" placeholder="예: 300">
                <template #append>
                  <el-select style="width: 80px" v-model="unitInput">
                    <el-option label="cm" value="cm" />
                    <el-option label="m" value="m" />
                  </el-select>
                </template>
              </el-input>
              <el-button style="width: 100%; margin-top: 10px" type="primary" @click="setScale">
                스케일 설정
              </el-button>
            </div>
          </div>

          <div v-if="currentProject?.metrics">
            <h3 class="tool-group-title">
              전체 정보
            </h3>
            <div class="metrics-info">
              <span>
                총 벽 길이: {{ currentProject.metrics.totalWallLength }} {{ currentProject.metrics.unit }}
              </span>
              <span>
                예상 면적: {{ currentProject.metrics.estimatedArea }} {{ currentProject.metrics.unit }}<sup>2</sup>
              </span>
            </div>
          </div>

          <h3 class="tool-group-title">
            데이터 확인
          </h3>
          <div class="data-viewer">
            <pre>{{ walls }}</pre>
          </div>

          <div class="toolbar-footer">
            <el-button-group>
              <el-button type="primary" :icon="Download" @click="handleExport('png')">
                PNG
              </el-button>
              <el-button type="primary" :icon="Download" @click="handleExport('pdf')">
                PDF
              </el-button>
            </el-button-group>
            <el-button style="margin-left: 10px;" type="success" :icon="FolderChecked"
              @click="() => handleSaveProject()" :disabled="!currentProject">
              프로젝트 저장
            </el-button>
            <el-button type="danger" @click="handleLogout">
              로그아웃
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
          <div class="canvas-wrapper" ref="canvasWrapper" @dragover.prevent @drop="handleDrop">
            <canvas id="floorplan-canvas"></canvas>
          </div>
        </el-main>
      </el-container>
      <!-- 오른쪽 속성 패널 -->
      <el-aside width="280px" class="property-panel">
        <div class="panel-content" v-if="selectedObjectInfo">
          <h3 class="panel-title">
            속성 편집
          </h3>
          <el-divider />

          <!-- 위치와 크기 섹션-->
          <div class="prop-group">
            <div class="prop-row">
              <div class="prop-item">
                <label>X</label>
                <el-input-number v-model="props.left" controls-position="right" @change="updateObjectProps"
                  size="small" />
              </div>
              <div class="prop-item">
                <label>Y</label>
                <el-input-number v-model="props.top" controls-position="right" @change="updateObjectProps"
                  size="small" />
              </div>
            </div>
            <div class="prop-row">
              <div class="prop-item">
                <label>W</label>
                <el-input-number v-model="props.width" :min="1" controls-position="right" @change="updateObjectProps"
                  size="small" />
              </div>
              <div class="prop-item">
                <label>H</label>
                <el-input-number v-model="props.height" :min="1" controls-position="right" @change="updateObjectProps"
                  size="small" :disabled="isWallSelected" />
              </div>
            </div>
          </div>

          <!-- 회전과 기타 속성 섹션-->
          <div class="props-group">
            <div class="prop-row-single">
              <label>각도</label>
              <el-slider v-model="props.angle" :min="-180" :max="180" @input="updateObjectProps" show-input
                size="small" />
            </div>
          </div>

          <!-- 색상 섹션 -->
          <div class="prop-group">
            <div class="prop-row-single">
              <label>색상</label>
              <el-color-picker v-model="props.fill" @change="updateObjectProps" />
            </div>
          </div>
        </div>
        <el-empty v-else description="객체를 선택하세요" />
      </el-aside>
    </el-container>
  </div>
</template>

<script setup>
import { fabric } from 'fabric'
import { ref, nextTick, onMounted, computed, watch, reactive, createApp } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  Upload,
  EditPen,
  SwitchButton,
  FullScreen,
  FolderChecked,
  FolderAdd,
  Delete,
  Download,
  Pointer,
  RefreshLeft,
  RefreshRight,
  Box,
  House,
  Monitor,
  Lock,
  Unlock,
  View,
  Hide,
} from '@element-plus/icons-vue';
import * as api from '@/api/api';

// DOM 요소를 참조하기 위한 ref
const fileInput = ref(null);
const canvasWrapper = ref(null);

// 상태 관리
const currentProject = ref(null);;  // 현재 작업중인 프로젝트 전체 데이터를 저장
const walls = ref([]);  // 벽 데이터
const doors = ref([]);  // 문 데이터
const windows = ref([]);  // 창문 데이터
const backgroundImage = ref(null);
const activeTool = ref('select'); // 'wall', 'door', 'window' 등.
const fabricCanvas = ref(null);
const guideLines = ref([]); // 현재 화면에 그려진 가이드라인 객체들을 저장
const isSnapEnabled = ref(true); // 스냅 기능 활성화 여부
const gridCellSize = 20; // 그리드 한 칸 크기 (px)
const snapTolerance = 5; // 스냅이 감지되는 거리 (px)
const furnitureLibrary = ref([
  {
    type: 'desk',
    name: '책상',
    icon: Monitor,
    width: 120, height: 60,
    color: '#8b4513'
  },
  {
    type: 'sofa',
    name: '소파',
    icon: House,
    width: 180, height: 80,
    color: '#a0522d'
  },
  {
    type: 'box',
    name: '수납장',
    icon: Box,
    width: 50, height: 50,
    color: '#d2691e'
  },
])
const realLengthInput = ref(null);
const unitInput = ref('cm');

const isProjectPublic = ref(false)

// Undo/Redo 상태
const history = ref([]);
const historyIndex = ref(-1);
const isActionFromHistory = ref(false); // Undo,Redo 실행 중인지 여부

// 선택된 객체 정보
const selectedObjectInfo = ref(null);

// UI 텍스트 매핑
const toolNameMap = {
  wall: '벽 그리기',
  door: '문 추가',
  window: '창문 추가',
}

const props = reactive({
  left: 0,
  top: 0,
  width: 0,
  height: 0,
  angle: 0,
  fill: '#000000',
})
// 레이어 상태 관리
const layers = reactive([
  { id: 'walls', name: '벽', visible: true, locked: false },
  { id: 'doors', name: '문', visible: true, locked: false },
  { id: 'windows', name: '창문', visible: true, locked: false },
  { id: 'furnitures', name: '가구', visible: true, locked: false },
])

const router = useRouter()
const authStore = useAuthStore()

// 프로젝트 생성 다이얼로그 상태 2025.10.27
const createDialogVisible = ref(false)
const createFormRef = ref(null)
const uploadRef = ref(null)
const isCreating = ref(false)
const createForm = reactive({
  title: '나의 새 평면도',
  file: null,
})

// --- lifehook
const isWallSelected = computed(() => selectedObjectInfo.value?.type === 'wall')
const canUndo = computed(() => historyIndex.value > 0);
const canRedo = computed(() => historyIndex.value < history.value.length - 1);
const shareLink = computed(() => {
  if (currentProject.value?.shareId) {
    return `${window.location.origin}/share/${currentProject.value.shareId}`;
  }
  return ''
})
// 프로젝트가 로드될 때 isProjjectPublic 상태 동기화
watch(currentProject, (newProject) => {
  if (newProject) {
    isProjectPublic.value = newProject.public
  }
})
// 컴포넌트가 마운트되면 resizeObserver를 설정하여 창 크기 변경 감지
onMounted(() => {
  const canvasEl = document.getElementById('floorplan-canvas');
  const wrapperEl = canvasEl.parentElement;

  const canvas = new fabric.Canvas(canvasEl, {
    width: wrapperEl.offsetWidth,
    height: wrapperEl.offsetHeight,
    backgroundColor: '#23272a',
    selection: true,
  })
  fabricCanvas.value = canvas;

  drawGrid(); // 그리드 그리기
  setupCanvasListeners();
})

// --- 함수 ---
/**
 * 다이얼로그 여는 함수
 * @createAt 2025.10.27
 */
const openCreateDialog = () => {
  createForm.title = '나의 새 평면도';
  createForm.file = null;

  // 이전에 업로드 된 파일 목록 지우기
  uploadRef.value?.clearFiles();
  createDialogVisible.value = true;
}

const handleFileSelect = (file) => {
  createForm.file = file.raw; // 실제 파일 객체 저장
}

const handleFileExceed = (files) => {
  uploadRef.value.clearFiles();
  const file = files[0];
  uploadRef.value.handleStart(file);
}

/**
 * 새 프로젝트 생성
 * @createAt 2025.10.27
 */
const handleCreateProject = async () => {
  await createFormRef.value.validate(async (valid) => {
    if (valid) {
      isCreating.value = true;
      try {
        const res = await api.createProjectWithImage(createForm.title, createForm.file);

        await loadProjectData(res.data);

        ElMessage.success('AI 분석을 통해 프로젝트가 생성되었습니다!');
        createDialogVisible.value = false;

      } catch (error) {
        console.error('프로젝트 생성 실패:', error);
      } finally {
        isCreating.value = false;
      }
    }
  })
}
/**
 * 서버에서 불러온 프로젝트 데이터 화면에 바인딩해주는 함수
 * @param projectData
 * @createAt 2025.10.27
 */
async function loadProjectData(projectData) {
  currentProject.value = projectData;

  const canvas = fabricCanvas.value;
  canvas.clear();

  // 배경 이미지 설정
  if (projectData.backgroundImageUrl) {
    const bgImageUrl = `http://localhost:8080${projectData.backgroundImageUrl}`;
    canvas.setBackgroundImage(bgImageUrl, canvas.renderAll.bind(canvas), {
      originX: 'left',
      originY: 'top',
    });
  }

  // AI가 분석한 벽 데이터로 객체 생성
  if (projectData.planData?.walls) {
    projectData.planData.walls.forEach(wall => {
      // 벽을 그리는 로직
      createWallObjectOnCanvas(wall);
    })
  }
  // 문, 창문 등 다른 객체 로드 로직..

  canvas.renderAll();
  saveState();
}
/**
 * 벽을 그리는 로직
 * @param wallData 예: {start: {x: 169, y: 346}, end: {x: 269, y: 276}}
 * @createAt 2025.10.27
 */
function createWallObjectOnCanvas(wallData) {
  const length = Math.sqrt(Math.pow(wallData.end.x - wallData.start.x, 2) + Math.pow(wallData.end.y - wallData.start.y, 2))

  // 선
  const line = new fabric.Line([0, 0, length, 0], {
    stroke: '#5865f2',
    strokeWidth: 5,
    originX: 'center',  // 원점 위치
    originY: 'center',  // 원점 위치
    type: 'wall-line',
  })

  // 텍스트
  const text = new fabric.Text(Math.round(length) + ' px', {
    fontSize: 16,
    fill: '#e2e2e2',
    originX: 'center',
    originY: 'center',
    angle: -calcAngle(line.x1, line.y1, line.x2, line.y2),
    left: length / 2,
    top: 0,
  })

  // 선 + 텍스트 = 그룹
  const group = new fabric.Group([line, text], {
    left: wallData.start.x,
    top: wallData.start.y,
    originX: 'left',
    originY: 'center',
    angle: calcAngle(line.x1, line.y1, line.x2, line.y2),
    type: 'wall',
    id: `wall-${Date.now()}`,
    layer: 'walls',
  })

  fabricCanvas.value.add(group)
  saveState();
}

const handleLogout = () => {
  authStore.logout()
  router.push({
    name: 'Login'
  })
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
      fabricCanvas.value.setBackgroundImage(
        backgroundImage.value,
        fabricCanvas.value.renderAll.bind(fabricCanvas.value)
      )

      await nextTick();
    } catch (error) {
      console.error('이미지 업로드 실패:', error);
    }

    // 선택된 이미지 파일을 URL로 변환하여 화면에 표시
    backgroundImage.value = URL.createObjectURL(file);
  }
}

async function toggleShare(isPublic) {
  try {
    const res = await api.updateProjectShareSettings(currentProject.value.id, isPublic)
    // 응답 받은 최신 프로젝트 정보로 업데이트
    currentProject.value = res.data;
    if (isPublic) {
      ElMessage.success('프로젝트가 공개되었습니다.')
    } else {
      ElMessage.info("프로젝트가 비공개로 전환되었습니다.")
    }
  } catch (error) {

  }
}

async function copyShareLink() {
  await navigator.clipboard.writeText(shareLink.value)
  ElMessage.success('공유 링크가 복사되었습니다.!')
}

// 그리드 그리는 함수
function drawGrid() {
  const canvas = fabricCanvas.value;
  const width = canvas.getWidth();
  const height = canvas.getHeight();

  for (let i = 0; i < width / gridCellSize; i++) {
    const x = i * gridCellSize;
    const line = new fabric.Line([x, 0, x, height], {
      stroke: '#42464d', // 테두리 색상과 유사
      strokeWidth: 1,
      selectable: false, // 선택 불가
      evented: false, // 이벤트 불가
    });
    canvas.add(line);
  }

  for (let i = 0; i < height / gridCellSize; i++) {
    const y = i * gridCellSize;
    const line = new fabric.Line([0, y, width, y], {
      stroke: '#42464d',
      strokeWidth: 1,
      selectable: false,
      eventd: false,
    })
    canvas.add(line);
  }

  // 그린 그리드 선들이 다른 객체들 뒤로 가도록 함
  //canvas.sendToBack(canvas.getObjects('line'));
}

// Fabric 캔버스 이벤트 리스터 설정
function setupCanvasListeners() {
  const canvas = fabricCanvas.value;

  // 객체 이동 시 스냅 로직
  canvas.on('object:moving', (e) => {
    if (!isSnapEnabled.value) return;
    const target = e.target;

    // 최종적으로 적용될 스냅 위치. 초기값은 현재 객체 위치.
    let finalSnap = {
      left: target.left,
      top: target.top,
    };

    // 스냅이 발생했는지 여부
    let snappedX = false;
    let snappedY = false;

    // 이전 가이드라인 모두 제거
    clearGuideLines();

    // 활성화된 객체의 모든 정렬 지점을 계산
    const targetVCentering = target.getCenterPoint().x;
    const targetHCentering = target.getCenterPoint().y;
    const targetBoundingRect = target.getBoundingRect(true); // true: 절대 좌표

    const targetVCoords = [
      targetBoundingRect.left,
      targetVCentering,
      targetBoundingRect.left + targetBoundingRect.width
    ]
    const targetHCoords = [
      targetBoundingRect.top,
      targetHCentering,
      targetBoundingRect.top + targetBoundingRect.height
    ]

    // 캔버스의 다른 모든 객체와 비교하여 스냅 위치를 "찾기만"한다.
    canvas.forEachObject(obj => {
      if (obj === target) return; // 자기 자신은 제외

      const objVCentering = obj.getCenterPoint().x;
      const objHCentering = obj.getCenterPoint().y;
      const objBoundingRect = obj.getBoundingRect(true);

      const objVCoords = [
        objBoundingRect.left,
        objVCentering,
        objBoundingRect.left + objBoundingRect.width
      ]
      const objHCoords = [
        objBoundingRect.top,
        objHCentering,
        objBoundingRect.top + objBoundingRect.height
      ]

      // 수직 가이드라인 확인 및 그리기
      for (const targetV of targetVCoords) {
        for (const objV of objVCoords) {
          if (Math.abs(targetV - objV) < snapTolerance) {
            // 이미 다른 곳에 x축 스냅이 되었다면, 더 가까운 곳에만 스냅
            const currentDiff = Math.abs(targetV - objV);
            const snappedDiff = Math.abs((targetV - (target.left - finalSnap.left)) - objV);

            if (!snappedDiff || currentDiff < snappedDiff) {
              finalSnap.left = target.left - (targetV - objV);
              snappedX = true;
            }
          }
        }
      }

      // 수평 가이드라인 확인 및 그리기
      for (const targetH of targetHCoords) {
        for (const objH of objHCoords) {
          if (Math.abs(targetH - objH) < snapTolerance) {
            // 이미 다른 곳에 y축 스냅이 되었다면, 더 가까운 곳에만 스냅
            const currentDiff = Math.abs(targetH - objH);
            const snappedDiff = Math.abs((targetH - (target.top - finalSnap.top)) - objH);

            if (!snappedDiff || currentDiff < snappedDiff) {
              finalSnap.top = target.top - (targetH - objH);
              snappedY = true;
            }
          }
        }
      }
    })

    // 모든 객체와의 비교가 끝난 후, 최종 위치를 "단 한 번만" 설정
    target.set({
      left: finalSnap.left,
      top: finalSnap.top,
    });

    // 최종 위치를 기준으로 가이드라인 그리기
    const finalTargetRect = target.getBoundingRect(true);
    const finalVCentering = target.getCenterPoint().x;
    const finalHCentering = target.getCenterPoint().y;

    canvas.forEachObject(obj => {
      if (obj === target) return;
      const objRect = obj.getBoundingRect(true);
      const objVCentering = (objRect.left + objRect.width / 2);
      const objHCentering = (objRect.top + objRect.height / 2);

      const alignments = [
        // 수직 정렬 (Vertical)
        { target: finalTargetRect.left, obj: objRect.left, type: 'vertical' },
        { target: finalTargetRect.left, obj: objVCentering, type: 'vertical' },
        { target: finalTargetRect.left, obj: objRect.left + objRect.width, type: 'vertical' },
        { target: finalVCentering, obj: objRect.left, type: 'vertical' },
        { target: finalVCentering, obj: objVCentering, type: 'vertical' },
        { target: finalVCentering, obj: objRect.left + objRect.width, type: 'vertical' },
        { target: finalTargetRect.left + finalTargetRect.width, obj: objRect.left, type: 'vertical' },
        { target: finalTargetRect.left + finalTargetRect.width, obj: objVCentering, type: 'vertical' },
        { target: finalTargetRect.left + finalTargetRect.width, obj: objRect.left + objRect.width, type: 'vertical' },

        // 수평 정렬 (Horizontal)
        { target: finalTargetRect.top, obj: objRect.top, type: 'horizontal' },
        { target: finalTargetRect.top, obj: objHCentering, type: 'horizontal' },
        { target: finalTargetRect.top, obj: objRect.top + objRect.height, type: 'horizontal' },
        { target: finalHCentering, obj: objRect.top, type: 'horizontal' },
        { target: finalHCentering, obj: objHCentering, type: 'horizontal' },
        { target: finalHCentering, obj: objRect.top + objRect.height, type: 'horizontal' },
        { target: finalTargetRect.top + finalTargetRect.height, obj: objRect.top, type: 'horizontal' },
        { target: finalTargetRect.top + finalTargetRect.height, obj: objHCentering, type: 'horizontal' },
        { target: finalTargetRect.top + finalTargetRect.height, obj: objRect.top + objRect.height, type: 'horizontal' },
      ];

      for (const align of alignments) {
        // 부동소수점 오차를 감안하여 1px 미만의 차이는 같다고 판단
        if (Math.abs(align.target - align.obj) < 1) {
          if (align.type === 'vertical') {
            drawGuideLine({
              x1: align.obj, y1: 0,
              x2: align.obj, y2: canvas.height,
            });
          } else { // horizontal
            drawGuideLine({
              x1: 0, y1: align.obj,
              x2: canvas.width, y2: align.obj,
            });
          }
        }
      }
    })
  })

  // 객체 수정 이벤트 리스너
  canvas.on('object:modified', (e) => {
    updatePanelFromObject(e.target);
    // 그룹 자체를 수정할 때 내부 객체들의 정보 업데이트
    if (e.target.type === 'group') {
      updateDimensionText(e.target);
    }
    //updateSelectedInfo();
    saveState();
  })

  canvas.on('selection:created', (e) => updatePanelFromObject(e.target));
  canvas.on('selection:updated', (e) => updatePanelFromObject(e.target));
  canvas.on('selection:cleared', () => { selectedObjectInfo.value = null; });

  // 벽 그리기 로직 (마우스 down, move, up)
  let line, isDown, startPoint;
  canvas.on('mouse:down', (o) => {
    if (activeTool.value !== 'wall') return;
    isDown = true;
    startPoint = canvas.getPointer(o.e);
    const points = [startPoint.x, startPoint.y, startPoint.x, startPoint.y];
    line = new fabric.Line(points, {
      stroke: '#5865f2',
      strokeWidth: 5,
      selectable: false, // 개별 선택 비활성화
      evented: false,
      originX: 'center',
      originY: 'center',
      type: 'wall-line',
    });
    // 그리는 동안에는 아직 그룹화 X
    canvas.add(line);
  });

  canvas.on('mouse:move', (o) => {
    if (!isDown || activeTool.value !== 'wall') return;
    const pointer = canvas.getPointer(o.e);
    line.set({
      x2: pointer.x,
      y2: pointer.y,
    })
    canvas.renderAll();
  });

  canvas.on('mouse:up', (o) => {
    clearGuideLines();
    if (activeTool.value !== 'wall' || !isDown) return;
    isDown = false;

    // 짧은 클릭은 무시
    const endPoint = canvas.getPointer(o.e);
    const length = Math.sqrt(Math.pow(endPoint.x - startPoint.x, 2) + Math.pow(endPoint.y - startPoint.y, 2));
    if (length < 5) {
      canvas.remove(line);
      return;
    }

    canvas.remove(line);

    // 그룹 내부에 들어갈 새로운 선(line) 객체 생성
    const groupLine = new fabric.Line([0, 0, length, 0], {
      stroke: '#5865f2',
      strokeWidth: 5,
      originX: 'center', // 그룹 내부에서의 원점
      originY: 'center',
      type: 'wall-line',
    })

    // 그리기가 끝나면, 벽과 치수를 그룹으로 묶는다.
    const text = new fabric.Text(Math.round(length) + ' px', {
      fontSize: 16,
      fill: '#e2e2e2',
      originX: 'center',
      originY: 'center',
      angle: -calcAngle(line.x1, line.y1, line.x2, line.y2),
      left: length / 2,
      top: 0,
    })

    const group = new fabric.Group([groupLine, text], {
      left: startPoint.x,
      top: startPoint.y,
      originX: 'left',
      originY: 'center',
      angle: calcAngle(line.x1, line.y1, line.x2, line.y2),
      // 커스텀 데이터
      type: 'wall',
      id: `wall-${Date.now()}`,
      // 레이어
      layer: 'walls',
    })

    canvas.add(group);
    canvas.setActiveObject(group); // 새로 만든 그룹 선택
    saveState();
  })



  canvas.on('mouse:down', (o) => {
    if (activeTool.value === 'door' || activeTool.value === 'window') {
      const pointer = canvas.getPointer(o.e);
      let newObj;
      if (activeTool.value === 'door') {
        newObj = new fabric.Rect({
          left: pointer.x - 40,
          top: pointer.y - 10,
          width: 80,
          height: 20,
          fill: '#f2a358',
          type: 'door',
          id: `door-${Date.now()}`,
          // 레이어
          layer: 'doors',
        })
      } else {
        newObj = new fabric.Rect({
          left: pointer.x - 60,
          top: pointer.y - 5,
          width: 120,
          height: 10,
          fill: '#58c9f2',
          type: 'window',
          id: `window-${Date.now()}`,
          // 레이어
          layer: 'windows',
        })
      }
      canvas.add(newObj);
      saveState();
    }
  })
}

/**
 * 스마트 가이드라인을 그리는 함수
 * @param {Object} coords
 */
function drawGuideLine(coords) {
  const line = new fabric.Line([
    coords.x1, coords.y1, coords.x2, coords.y2
  ], {
    stroke: 'red',
    strokeWidth: 1,
    selectable: false,
    evented: false,
    strokeDashArray: [5, 5], // 점선
  })

  fabricCanvas.value.add(line);
  guideLines.value.push(line);
}

/**
 * 모든 스마트 가이드라인을 캔버스에서 제거하는 함수
 */
function clearGuideLines() {
  guideLines.value.forEach(line => fabricCanvas.value.remove(line));
  guideLines.value = [];
  fabricCanvas.value.renderAll();
}

/**
 * (객체 -> 패널) 캔버스 객체의 속성을 패널의 입력 필드로 복사
 * @param obj
 */
function updatePanelFromObject(obj) {
  if (!obj) {
    selectedObjectInfo.value = null;
    return;
  }
  selectedObjectInfo.value = obj; // 현재 선택된 객체 저장

  // 벽(그룹)과 일반 객체의 속성 가져옴
  if (obj.type === 'wall') {
    const wallLine = obj.getObjects('wall-line')[0];
    props.width = Math.round(wallLine.getScaledWidth());
    props.height = Math.round(wallLine.strokeWidth * obj.scaleY); // 벽 두께
  } else {
    props.width = Math.round(obj.getScaledWidth());
    props.height = Math.round(obj.getScaledHeight());
  }

  props.left = Math.round(obj.left);
  props.top = Math.round(obj.top);
  props.angle = Math.round(obj.angle);
  props.fill = obj.fill || '#000000'; // 채우기 색상이 없는 객체 대비
}
/**
 * (패널 -> 객체) 패널 입력 필드의 변경사항을 캔버스 객체에 적용
 */
function updateObjectProps() {
  const obj = selectedObjectInfo.value;
  if (!obj) return;

  // 패널 값으로 객체 속성 설정
  obj.set({
    left: props.left,
    top: props.top,
    angle: props.angle,
    fill: props.fill,
  });

  // 변경사항이 즉시 반영되도록 캔버스 재렌더링
  fabricCanvas.value.renderAll();

  // 수정이 일어났으므로 치수 텍스트 등도 업데이트
  if (obj.type === 'wall') {
    updateDimensionText(obj);
  }
}

// 벽 각도 계산 함수
function calcAngle(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
}

// 그룹 내 치수 텍스트 업데이트 함수
function updateDimensionText(group) {
  if (group.type !== 'wall') return;

  const wallLine = group.getObjects('wall-line')[0];
  const dimensionText = group.getObjects('text')[0];

  // 그룹의 스케일링을 반영하여 실제 길이 계산
  const newLength = wallLine.getScaledWidth();

  dimensionText.set({
    text: Math.round(newLength) + ' px'
  });

  // 텍스트가 벽의 회전에 따라 항상 바로 서 있도록 조정
  const groupAngle = group.angle;
  dimensionText.set({
    angle: -groupAngle,
  });

  group.addWithUpdate(); // 그룹 내 객체 변경 후 업데이트
  fabricCanvas.value.renderAll();
}

// 도구 선택
function selectTool(tool) {
  activeTool.value = tool;
  fabricCanvas.value.isDrawingMode = false; // Fabric의 자유 그리기 모드 off
  if (tool === 'select') {
    fabricCanvas.value.selection = true;
    fabricCanvas.value.hoverCursor = 'move';
  } else {
    fabricCanvas.value.selection = false;
    fabricCanvas.value.hoverCursor = 'crosshair';
  }
}
// Undo/Redo 로직
function saveState() {
  if (isActionFromHistory.value) return;

  const currentState = fabricCanvas.value.toJSON(['type', 'id']);

  // 현재 인덱스 뒤의 히스토리는 잘라냄 (새로운 액션이 발생했으므로)
  if (historyIndex.value < history.value.length - 1) {
    history.value = history.value.slice(0, historyIndex.value + 1);
  }

  history.value.push(currentState);
  historyIndex.value = history.value.length - 1;
}

function undo() {
  if (canUndo.value) {
    historyIndex.value--;
    restoreState()
  }
}

function redo() {
  if (canRedo.value) {
    historyIndex.value++;
    restoreState();
  }
}

function restoreState() {
  isActionFromHistory.value = true;
  const stateToRestore = history.value[historyIndex.value];
  fabricCanvas.value.loadFromJSON(stateToRestore, () => {
    fabricCanvas.value.renderAll();
    isActionFromHistory.value = false;
  })
}

// 기타 기능
function deleteSelected() {
  const activeObjects = fabricCanvas.value.getActiveObjects();
  if (!activeObjects.length) return;

  activeObjects.forEach(obj => fabricCanvas.value.remove(obj));
  fabricCanvas.value.discardActiveObject().renderAll();
  saveState();
}

// 스케일 설정 로직
async function setScale() {
  if (!realLengthInput.value || realLengthInput.value <= 0) {
    ElMessage.error('유효한 실제 길이를 입력하세요.');
    return;
  }

  const selected = fabricCanvas.value.getActiveObject();
  if (!selected || selected.type !== 'wall') {
    ElMessage.error('스케일을 설정할 벽을 먼저 선택하세요.');
    return;
  }

  const wallLine = selected.getObjects('wall-line')[0];
  const pixelLength = wallLine.getScaledWidth();

  const scaleData = {
    pixelLength,
    realLength: realLengthInput.value,
    unit: unitInput.value,
  };

  // 변경된 스케일 정보를 포함하여 프로젝트 저장
  await handleSaveProject(scaleData);

  realLengthInput.value = null; // 입력 필드 초기화
  ElMessage.success('스케일이 설정되었습니다. 정보가 업데이트됩니다.');
}

// 프로젝트 저장
async function handleSaveProject(scaleData = null) {
  if (!currentProject.value) return;

  // Fabric 캔버스 객체를 API가 요구하는 간단한 JSON 포맷으로 변환
  const planData = {
    walls: [],
    doors: [],
    windows: [],
  };
  fabricCanvas.value.getObjects().forEach(obj => {
    switch (obj.type) {
      case 'wall': {
        const start = obj.getPointByOrigin('left', 'top');
        const end = obj.getPointByOrigin('right', 'bottom');
        planData.walls.push({
          start: {
            x: start.x,
            y: start.y,
          },
          end: {
            x: end.x,
            y: end.y,
          }
        });
      }
        break;
      case 'door':
      case 'window': {
        const data = {
          position: {
            x: obj.left + obj.getScaledWidth() / 2,
            y: obj.top + obj.getScaledHeight() / 2,
          },
          width: obj.getScaledWidth(),
        };
        if (obj.type === 'door') planData.doors.push(data);
        else planData.windows.push(data)
      }
        break;
    }
  })

  const projectData = {
    title: currentProject.value.title,
    planData,
  };
  // 스케일 설정 시 받은 scaleData를 요청에 포함
  if (scaleData) {
    projectData.scale = scaleData;
  }

  try {
    // 저장 후, 서버로부터 계산된 metrics 데이터를 다시 받아와 갱신
    const response = await api.updateProject(currentProject.value.id, projectData);
    currentProject.value = response.data;

    ElMessage.success('프로젝트가 성공적으로 저장되었습니다.');
  } catch (error) {
    console.error("프로젝트 저장 실패:", error);
  }
}

async function handleExport(format) {
  if (!currentProject.value) {
    ElMessage.warning('먼저 프로젝트를 저장해주세요.');
    return;
  }

  try {
    const response = await api.exportProjectFile(currentProject.value.id, format);

    // blob 데이터르르 이용해 다운르도 링크를 생성하고 클릭
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `floorplan-${currentProject.value.id}.${format}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url); // 메모리 해제
  } catch (error) {
    console.error(`파일(${format}) 내보내기 실패:`, error);
  }
}

// Drag & Drop 핸들러
function handleDragStart(event, item) {
  // 드래그하는 데이터에 가구 정보 담음
  event.dataTransfer.setData('application/json', JSON.stringify(item));
}

function handleDrop(event) {
  event.preventDefault();

  // 드롭된 데이터 파싱
  const item = JSON.parse(event.dataTransfer.getData('application/json'));
  if (!item) return;

  const canvas = fabricCanvas.value;
  // 캔버스 내 드롭 위치 계산
  const pointer = canvas.getPointer(event);

  // 데이터 기반으로 Fabric 객체 생성
  const furniture = new fabric.Rect({
    left: pointer.x = item.width / 2,
    top: pointer.y - item.height / 2,
    width: item.width,
    height: item.height,
    fill: item.color,
    type: item.type,
    id: `${item.type}-${Date.now()}`,
    // 레이어
    layer: 'furnitures',
  })

  canvas.add(furniture);
  canvas.setActiveObject(furniture);
  saveState();
}

// 레이어 제어 함수
function setLayerProperties(layerId, properties) {
  const canvas = fabricCanvas.value;
  canvas.getObjects().forEach(obj => {
    if (obj.layer === layerId) {
      obj.set(properties);
    }
  });

  canvas.renderAll();
}
function toggleLayerVisibility(layerId) {
  const layer = layers.find(l => l.id === layerId);
  if (layer) {
    layer.visible = !layer.visible;
    setLayerProperties(layerId, { visible: layer.visible });
  }
}
function toggleLayerLock(layerId) {
  const canvas = fabricCanvas.value;
  const layer = layers.find(l => l.id === layerId);
  if (layer) {
    layer.locked = !layer.locked;
    setLayerProperties(layerId, {
      selectable: !layer.locked,
      evented: !layer.locked,
    });

    // 잠긴 레이어의 객체가 선택되어 있었다면 선택 해제
    if (layer.locked) {
      canvas.discardActiveObject();
      canvas.renderAll();
    }
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

.tool-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 15px;
  font-size: 0.9rem;
}

/* 가구 리스트 스타일 */
.furniture-list {
  display: grid;
  grid-template-columns: repeat(2, lfr);
  gap: 10px;
}

.furniture-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: grab;
  text-align: center;
}

.furniture-item:active {
  cursor: grabbing;
}

.furniture-item .el-icon {
  font-size: 24px;
  margin-bottom: 5px;
}

.scale-setter {
  margin-top: 15px;
  padding: 10px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
}

.scale-setter p {
  font-size: 0.8rem;
  margin: 0 0 10px 0;
  color: #a0a0a0;
}

#floorplan-canvas {
  border: 2px dashed var(--border-color);
  border-radius: 8px;
}

.property-panel {
  background-color: var(--sidebar-bg-color);
  padding: 20px;
  border-left: 1px solid var(--border-color);
  color: var(--text-color);
}

.panel-content {
  height: 100%;
}

.panel-title {
  margin: 0 0 10px 0;
  font-weight: 600;
}

.prop-group {
  margin-bottom: 20px;
}

.prop-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 20px;
}

.prop-item {
  flex: 1;
}

.prop-item label,
.prop-row-single label {
  display: block;
  font-size: 0.8rem;
  margin-bottom: 5px;
  color: #a0a0a0;
}

.prop-row-single {
  margin-bottom: 10px;
}

.el-input-number {
  width: 100%;
}

/* 레이어 스타일 */
.layer-panel {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.layer-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: var(--container-bg-color);
  border-radius: 4px;
  border: 1px solid var(--border-color);
}

.layer-name {
  font-size: 0.9rem;
}

.layer-controls {
  display: flex;
  gap: 5px;
}
</style>
