import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'ファイルが選択されていません' },
        { status: 400 }
      );
    }

    // アップロードディレクトリの確認と作成
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'posts');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const uploadedFiles: string[] = [];

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // ファイル名の生成（タイムスタンプ + ランダム文字列）
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = path.extname(file.name);
      const fileName = `${timestamp}-${randomString}${fileExtension}`;
      const filePath = path.join(uploadDir, fileName);

      // 画像の場合は最適化
      if (file.type.startsWith('image/')) {
        await sharp(buffer)
          .resize(1200, 1200, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .jpeg({ quality: 85 })
          .toFile(filePath.replace(fileExtension, '.jpg'));

        uploadedFiles.push(`/uploads/posts/${fileName.replace(fileExtension, '.jpg')}`);
      } else {
        // 動画や他のファイルはそのまま保存
        await writeFile(filePath, buffer);
        uploadedFiles.push(`/uploads/posts/${fileName}`);
      }
    }

    return NextResponse.json({
      success: true,
      files: uploadedFiles,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'ファイルのアップロードに失敗しました' },
      { status: 500 }
    );
  }
}
