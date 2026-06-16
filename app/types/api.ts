export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export interface ApiErrorResponse {
  success: false
  message: string
  errors: Record<string, string[]>
}

export class ApiError extends Error {
  public statusCode: number
  public errors: Record<string, string[]>
  public readonly __isApiError = true

  constructor(message: string, statusCode: number, errors: Record<string, string[]> = {}) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.errors = errors
    Object.setPrototypeOf(this, ApiError.prototype)
  }
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError || (typeof err === 'object' && err !== null && '__isApiError' in err)
}
