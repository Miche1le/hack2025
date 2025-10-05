declare module "next/server" {
  export type NextRequest = Request;

  export class NextResponse extends Response {
    static json<T>(body: T, init?: number | ResponseInit): NextResponse;
  }
}
