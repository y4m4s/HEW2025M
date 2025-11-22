import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Product from '@/models/Product';

// 個別商品を取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const { id } = await params;
    const product = await Product.findById(id);

    if (!product) {
      return NextResponse.json(
        { error: '商品が見つかりませんでした' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error('Get product error:', error);
    return NextResponse.json(
      { error: '商品の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// 商品を削除（出品取り消し）
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'ユーザーIDが必要です' },
        { status: 400 }
      );
    }

    // 商品を取得
    const product = await Product.findById(id);

    if (!product) {
      return NextResponse.json(
        { error: '商品が見つかりませんでした' },
        { status: 404 }
      );
    }

    // 出品者本人かチェック
    const actualUserId = userId.startsWith('user-') ? userId : `user-${userId}`;
    if (product.sellerId !== actualUserId && product.sellerId !== userId) {
      return NextResponse.json(
        { error: '自分の商品のみ削除できます' },
        { status: 403 }
      );
    }

    // 商品を削除
    await Product.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: '商品を削除しました',
    });
  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json(
      { error: '商品の削除に失敗しました' },
      { status: 500 }
    );
  }
}
