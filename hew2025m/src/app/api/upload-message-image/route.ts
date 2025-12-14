import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const senderId = formData.get('senderId') as string;
    const chatRoomId = formData.get('chatRoomId') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'ファイルが選択されていません' },
        { status: 400 }
      );
    }

    if (!senderId || !chatRoomId) {
      return NextResponse.json(
        { error: 'senderIdとchatRoomIdが必要です' },
        { status: 400 }
      );
    }

    // アップロードディレクトリの確認と作成
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'messages');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // タイムスタンプをYYYYMMDD-HHMMSS形式に変換
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
    const dateTimeStr = `${year}${month}${day}-${hours}${minutes}${seconds}${milliseconds}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // ファイル名の生成（YYYYMMDD-HHMMSSMMM-CHATROOMID-SENDERID）
    const uniqueId = `${dateTimeStr}-${chatRoomId}-${senderId}`;
    const optimizedFileName = `${uniqueId}.jpg`;
    const filePath = path.join(uploadDir, optimizedFileName);

    // 画像を最適化して保存
    await sharp(buffer)
      .resize(800, 800, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 85 })
      .toFile(filePath);

    const imageUrl = `/uploads/messages/${optimizedFileName}`;

    return NextResponse.json({
      success: true,
      imageUrl,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'ファイルのアップロードに失敗しました' },
      { status: 500 }
    );
  }
}
