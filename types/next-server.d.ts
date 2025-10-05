declare module 'next/server' {
  export interface NextRequest extends Request {}

  export class NextResponse extends Response {
    static json<T>(body: T, init?: number | ResponseInit): NextResponse;
  }
}
