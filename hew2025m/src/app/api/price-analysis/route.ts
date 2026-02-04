import { NextResponse } from 'next/server';

// 楽天APIの型定義
interface RakutenItem {
  itemPrice: number;
}

// リクエストボディの型定義
interface PriceAnalysisRequestBody {
  productName?: string;
}

// 平均、中央値、最小値、最大値を計算するヘルパー関数
const calculateStatistics = (prices: number[]) => {
  if (prices.length === 0) {
    return {
      suggestedPrice: 0,
      medianPrice: 0,
      minPrice: 0,
      maxPrice: 0,
    };
  }

  const sortedPrices = [...prices].sort((a, b) => a - b);
  const minPrice = sortedPrices[0];
  const maxPrice = sortedPrices[sortedPrices.length - 1];

  // 平均値の計算
  const sum = prices.reduce((acc, price) => acc + price, 0);
  const average = Math.round(sum / prices.length);

  // 中央値の計算
  const mid = Math.floor(prices.length / 2);
  const medianPrice =
    prices.length % 2 === 0
      ? Math.round((sortedPrices[mid - 1] + sortedPrices[mid]) / 2)
      : sortedPrices[mid];

  // 平均価格を採用
  const suggestedPrice = average;

  return {
    suggestedPrice,
    medianPrice,
    minPrice,
    maxPrice,
  };
};

// 楽天APIを呼び出すヘルパー関数
async function searchRakuten(appId: string, keyword: string) {
  const params = new URLSearchParams({
    applicationId: appId,
    keyword: keyword,
    hits: '30',
    formatVersion: '2',
    sort: '-itemPrice', // 高い順
  });

  try {
    const res = await fetch(`https://app.rakuten.co.jp/services/api/IchibaItem/Search/20170706?${params.toString()}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error('Fetch error:', e);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const body: PriceAnalysisRequestBody = await request.json();
    const { productName } = body;

    if (!productName) {
      return NextResponse.json(
        { error: '商品名 (productName) が必要です' },
        { status: 400 }
      );
    }

    const RAKUTEN_APP_ID = process.env.NEXT_PUBLIC_RAKUTEN_APP_ID;
    
    if (!RAKUTEN_APP_ID) {
      console.error('楽天APIのアプリケーションIDが設定されていません');
      return NextResponse.json(
        { error: 'サーバー設定エラー: 楽天APIキーがありません' },
        { status: 500 }
      );
    }
    
    // キーワードのクリーニングと分割
    const cleanName = productName.replace(/[^\w\s\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf]/g, ' ').trim();
    const words = cleanName.split(/[\s\u3000]+/);

    let items: RakutenItem[] = [];
    let searchLevel = 0; // どのレベルでヒットしたか (デバッグ用)

    // --- 戦略的検索ロジック (Fallback Strategy) ---

    // レベル1: 最初の3単語 + 「中古」 (理想的)
    if (items.length === 0 && words.length >= 1) {
        const query1 = `${words.slice(0, 3).join(' ')} 中古`;
        const data = await searchRakuten(RAKUTEN_APP_ID, query1);
        if (data?.Items?.length > 0) {
            items = data.Items;
            searchLevel = 1;
        }
    }

    // レベル2: 最初の2単語 + 「中古」 (少し緩和)
    if (items.length === 0 && words.length >= 2) {
        const query2 = `${words.slice(0, 2).join(' ')} 中古`;
        const data = await searchRakuten(RAKUTEN_APP_ID, query2);
        if (data?.Items?.length > 0) {
            items = data.Items;
            searchLevel = 2;
        }
    }

    // レベル3: 最初の2単語のみ (中古を諦めて新品も含める - データ表示優先)
    if (items.length === 0 && words.length >= 1) {
        const query3 = words.slice(0, 2).join(' ');
        const data = await searchRakuten(RAKUTEN_APP_ID, query3);
        if (data?.Items?.length > 0) {
            items = data.Items;
            searchLevel = 3;
        }
    }

    // レベル4: 最終手段 - 最初の1単語のみ (何でもいいから出す)
    if (items.length === 0 && words.length >= 1) {
        const query4 = words[0];
        const data = await searchRakuten(RAKUTEN_APP_ID, query4);
        if (data?.Items?.length > 0) {
            items = data.Items;
            searchLevel = 4;
        }
    }

    // --- 結果の処理 ---

    if (items.length === 0) {
      return NextResponse.json(
        { 
          suggestedPrice: 0, 
          priceList: [], 
          minPrice: 0, 
          maxPrice: 0, 
          medianPrice: 0, 
          sourceCount: 0, 
          message: '関連商品が見つかりませんでした。キーワードを変えてお試しください。' 
        }
      );
    }

    const priceList: number[] = items.map((item: RakutenItem) => item.itemPrice);
    const { suggestedPrice, medianPrice, minPrice, maxPrice } = calculateStatistics(priceList);

    // ヒットしたレベルに応じてメッセージを変える
    let userMessage = undefined;
    if (searchLevel >= 3) {
        userMessage = '中古データ不足のため、新品価格も含めた市場相場を表示しています。';
    }

    return NextResponse.json({
      suggestedPrice,
      medianPrice,
      minPrice,
      maxPrice,
      priceList, 
      sourceCount: priceList.length,
      message: userMessage
    });

  } catch (error) {
    console.error('価格分析APIで予期せぬエラー:', error);
    return NextResponse.json(
      { error: 'サーバー内部でエラーが発生しました。' },
      { status: 500 }
    );
  }
}