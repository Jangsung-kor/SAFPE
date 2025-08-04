import axios from 'axios'
import { ElMessage } from 'element-plus'

// 1. Axios 인스턴스 생성
const apiClient = axios.create({
  // 백엔드 API 서버 주소를 baseURL로 설정
  baseURL: 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// 요청/응답 인터셉터: 에러 핸들링 중 공통 로직 처리
apiClient.interceptors.response.use(
  (response) => response, // 성공적인 응답은 그대로 반환
  (error) => {
    // 에러 처리
    const message = error.response?.data?.message || '알 수 없는 오류가 발생했습니다.'
    ElMessage.error(message)
    return Promise.reject(error)
  },
)

// 2. API 함수들 정의
// 각 엔드포인트에 맞춰 함수를 만든다.

// 모든 프로젝트 목록 조회 (GET /projects)
export const getAllProjects = () => {
  return apiClient.get('/projects')
}

// 특정 프로젝트 상세 조회 (GET /projects/{projectId})
export const getProjectById = (projectId) => {
  return apiClient.get(`/projects/${projectId}`)
}

// 새 프로젝트 생성 (POST /projects)
export const createProject = (projectData) => {
  // projectData 예시: { title: '새로운 프로젝트' }
  return apiClient.post('/projects', projectData)
}

// 프로젝트 정보 및 평면도 데이터 업데이트 (PUT /projects/{projectId})
export const updateProject = (projectId, projectData) => {
  // projectData 예시: { title: '수정된 제목', planData: { walls: [...] } }
  return apiClient.put(`/projects/${projectId}`, projectData)
}

// 이미지 업로드 (POST /projects/{projectId}/background-image)
export const uploadBackgroundImage = (projectId, file) => {
  const formData = new FormData()
  formData.append('file', file) // 'file'은 백엔드 @RequestParam("file")과 일치해야 함

  return apiClient.post(`/projects/${projectId}/background-image`, formData, {
    // FormData를 보낼 때는 Content-Type을 multipart/form-data로 설정
    headers: {
      'content-Type': 'multipart/form-data',
    },
  })
}
