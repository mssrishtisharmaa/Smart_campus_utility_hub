import { NextResponse } from "next/server";
export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "weathergpt-bharat",
    version: "1.0.0",
  });
}
