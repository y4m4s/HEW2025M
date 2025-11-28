import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: NextRequest) {
  // 1. Gemini APIキーを環境変数から読み込む
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    // キーがない場合のエラーメッセージ（日本語）
    return NextResponse.json({ 
      error: 'MISSING_KEY', 
      message: 'GEMINI_API_KEY が見つかりません。環境変数を確認してください。' 
    }, { status: 500 });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // ✅ モデル指定: ユーザーが動作を確認済みのバージョンを使用
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-09-2025" });

    // フロントエンドから JSON データ（商品名、説明、カテゴリ）を受け取る
    const { productName, description, category } = await req.json();

    const prompt = `
      あなたは楽天市場の検索最適化スペシャリストです。
      以下の商品情報から、市場価格を調査するための最適な「検索キーワード」を1つ生成してください。

      【ルール】
      1. 「美品」「送料無料」「セール」などの広告的な修飾語や日付、管理コードは削除してください。
      2. カテゴリ「${category}」の情報も考慮し、「ブランド名」と「モデル名（型番）」を優先して抽出してください。
      3. スペース区切りで、2〜3単語程度にまとめてください。
      4. 余計な説明は省き、検索キーワードのみを出力してください。

      商品名: ${productName}
      カテゴリ: ${category}
      商品説明: ${description}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const keyword = response.text().trim();

    return NextResponse.json({ keyword });

  } catch (error: any) {
    console.error("Gemini APIエラー:", error);
    
    // エラーメッセージ（日本語）
    return NextResponse.json({ 
      error: 'API_ERROR', 
      message: error.message || 'AIモデルの呼び出しに失敗しました。'
    }, { status: 500 });
  }
}