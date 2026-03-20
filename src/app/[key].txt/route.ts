import { NextRequest, NextResponse } from "next/server";
import { getSiteSettings } from "@/server/site-settings";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key } = await params;
  const settings = await getSiteSettings();

  // 如果请求的文件名正好是配置的 IndexNow Key，则返回内容为该 Key 的文本
  if (settings.indexNowKey && key === settings.indexNowKey) {
    return new NextResponse(settings.indexNowKey, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }

  // 否则返回 404
  return new NextResponse("Not Found", { status: 404 });
}
