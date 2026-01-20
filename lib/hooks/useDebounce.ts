import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * 값의 변경을 지연시키는 훅
 * @param value 디바운스할 값
 * @param delay 지연 시간 (ms)
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * 콜백 함수를 디바운스하는 훅
 * @param callback 디바운스할 콜백 함수
 * @param delay 지연 시간 (ms)
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const callbackRef = useRef(callback)

  // 최신 콜백을 ref에 저장
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args)
      }, delay)
    },
    [delay]
  ) as T

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return debouncedCallback
}

/**
 * 자동 저장을 위한 특화된 훅
 * - 디바운스된 저장
 * - 저장 중 상태 추적
 * - Race condition 방지
 */
export function useAutoSave<T>(
  value: T,
  onSave: (value: T) => Promise<void>,
  delay: number = 500
) {
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<T | null>(null)
  const saveInFlightRef = useRef(false)
  const pendingValueRef = useRef<T | null>(null)
  const initializedRef = useRef(false)

  // 초기값 설정 (첫 렌더링 시 저장하지 않도록)
  useEffect(() => {
    if (!initializedRef.current) {
      setLastSaved(value)
      initializedRef.current = true
    }
  }, [value])

  const debouncedValue = useDebounce(value, delay)

  useEffect(() => {
    // 초기화되지 않았거나 값이 같으면 저장하지 않음
    if (!initializedRef.current) return
    if (lastSaved !== null && JSON.stringify(debouncedValue) === JSON.stringify(lastSaved)) {
      return
    }

    const runSave = async () => {
      if (saveInFlightRef.current) {
        pendingValueRef.current = debouncedValue
        return
      }

      saveInFlightRef.current = true
      setIsSaving(true)

      try {
        await onSave(debouncedValue)
        setLastSaved(debouncedValue)
      } catch (error) {
        console.error('Auto save error:', error)
        throw error
      } finally {
        saveInFlightRef.current = false
        setIsSaving(false)

        // 대기 중인 저장이 있으면 실행
        if (pendingValueRef.current !== null) {
          const pendingValue = pendingValueRef.current
          pendingValueRef.current = null
          // 재귀적으로 저장 시도하지 않고, 다음 useEffect 사이클에서 처리
        }
      }
    }

    runSave()
  }, [debouncedValue, onSave, lastSaved])

  // lastSaved 리셋 함수 (노트 변경 시 사용)
  const resetLastSaved = useCallback((newValue: T) => {
    setLastSaved(newValue)
    initializedRef.current = true
  }, [])

  return { isSaving, lastSaved, resetLastSaved }
}
