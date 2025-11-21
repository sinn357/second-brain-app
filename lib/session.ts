// 브라우저 세션 ID 관리 (실시간 협업용)
const SESSION_KEY = 'second-brain-session-id'
const USERNAME_KEY = 'second-brain-user-name'

// 세션 ID 생성 (UUID v4 간소화 버전)
function generateSessionId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// 세션 ID 가져오기 (없으면 생성)
export function getSessionId(): string {
  if (typeof window === 'undefined') return ''

  let sessionId = localStorage.getItem(SESSION_KEY)
  if (!sessionId) {
    sessionId = generateSessionId()
    localStorage.setItem(SESSION_KEY, sessionId)
  }
  return sessionId
}

// 사용자 이름 가져오기 (없으면 랜덤 생성)
export function getUserName(): string {
  if (typeof window === 'undefined') return ''

  let userName = localStorage.getItem(USERNAME_KEY)
  if (!userName) {
    const adjectives = ['빠른', '똑똑한', '창의적인', '열정적인', '친절한']
    const nouns = ['토끼', '여우', '고양이', '독수리', '팬더']
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
    const noun = nouns[Math.floor(Math.random() * nouns.length)]
    userName = `${adj} ${noun}`
    localStorage.setItem(USERNAME_KEY, userName)
  }
  return userName
}

// 사용자 이름 설정
export function setUserName(name: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(USERNAME_KEY, name)
}
