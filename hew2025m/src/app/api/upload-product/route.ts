import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const sellerId = formData.get('sellerId') as string;
    const timestamp = formData.get('timestamp') as string;

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'ファイルが選択されていません' },
        { status: 400 }
      );
    }

    if (!sellerId || !timestamp) {
      return NextResponse.json(
        { error: 'sellerIdとtimestampが必要です' },
        { status: 400 }
      );
    }

    // アップロードディレクトリの確認と作成
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'products');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // タイムスタンプをYYYYMMDD-HHMMSS形式に変換
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const dateTimeStr = `${year}${month}${day}-${hours}${minutes}${seconds}`;

    const uploadedFiles: string[] = [];

    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // ファイル名の生成（YYYYMMDD-HHMMSS-SELLERID-(順番)）
      const order = index + 1;
      const uniqueId = `${dateTimeStr}-${sellerId}-(${order})`;
      const fileExtension = path.extname(file.name);
      const fileName = `${uniqueId}${fileExtension}`;
      const filePath = path.join(uploadDir, fileName);

      let finalUrl = `/uploads/products/${fileName}`;

      // 画像の場合は最適化
      if (file.type.startsWith('image/')) {
        const optimizedFileName = `${uniqueId}.jpg`;
        await sharp(buffer)
          .resize(1200, 1200, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .jpeg({ quality: 85 })
          .toFile(path.join(uploadDir, optimizedFileName));

        finalUrl = `/uploads/products/${optimizedFileName}`;
      } else {
        // 他のファイルはそのまま保存
        await writeFile(filePath, buffer);
      }

      uploadedFiles.push(finalUrl);
    }

    return NextResponse.json({
      success: true,
      imageUrls: uploadedFiles,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'ファイルのアップロードに失敗しました' },
      { status: 500 }
    );
  }
}
