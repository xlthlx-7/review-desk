export class ApiError extends Error {
  code: string
  ex?: string

  constructor(error: { code: string; message: string; ex?: string }) {
    super(error.message)
    this.code = error.code
    this.ex = error.ex
  }
}
