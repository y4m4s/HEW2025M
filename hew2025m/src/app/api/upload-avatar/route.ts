import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string;

    if (!file) {
      return NextResponse.json(
        { error: "ファイルが見つかりません" },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "ユーザーIDが見つかりません" },
        { status: 400 }
      );
    }

    // ファイルタイプを検証
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "画像ファイルのみアップロード可能です" },
        { status: 400 }
      );
    }

    // ファイルサイズを検証（5MB制限）
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "ファイルサイズは5MB以下にしてください" },
        { status: 400 }
      );
    }

    // ファイル拡張子を取得
    const ext = file.name.split(".").pop() || "jpg";

    // ユーザーIDをファイル名に使用（常に同じファイル名で上書き）
    const filename = `${userId}.${ext}`;

    // public/avatars ディレクトリのパス
    const uploadDir = path.join(process.cwd(), "public", "avatars");

    // ディレクトリが存在しない場合は作成
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // ファイルを保存
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filepath = path.join(uploadDir, filename);
    await writeFile(filepath, buffer);

    // 画像のURLを返す（publicフォルダ以降のパス）
    const imageUrl = `/avatars/${filename}`;

    return NextResponse.json({
      success: true,
      imageUrl: imageUrl,
      message: "画像をアップロードしました",
    });
  } catch (error) {
    console.error("アップロードエラー:", error);
    return NextResponse.json(
      { error: "画像のアップロードに失敗しました" },
      { status: 500 }
    );
  }
}
