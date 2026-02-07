import { z } from 'zod'

const apiSuccessSchema = z.object({
  success: z.literal(true),
})

const apiFailureSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  details: z.unknown().optional(),
})

export class ApiResponseError extends Error {
  constructor(message: string, public readonly status: number, public readonly details?: unknown) {
    super(message)
    this.name = 'ApiResponseError'
  }
}

export async function parseApiJson<T>(
  response: Response,
  payloadSchema: z.ZodType<T>
): Promise<T> {
  let rawJson: unknown

  try {
    rawJson = await response.json()
  } catch {
    throw new ApiResponseError('JSON이 아닌 응답을 받았습니다.', response.status)
  }

  const failure = apiFailureSchema.safeParse(rawJson)
  if (failure.success) {
    throw new ApiResponseError(failure.data.error, response.status, failure.data.details)
  }

  if (!response.ok) {
    throw new ApiResponseError(`요청에 실패했습니다. (HTTP ${response.status})`, response.status)
  }

  const successCheck = apiSuccessSchema.safeParse(rawJson)
  if (!successCheck.success) {
    throw new ApiResponseError('API 응답 형식이 올바르지 않습니다.', response.status)
  }

  const parsed = payloadSchema.safeParse(rawJson)
  if (!parsed.success) {
    throw new ApiResponseError('API payload 검증에 실패했습니다.', response.status, parsed.error.format())
  }

  return parsed.data
}
