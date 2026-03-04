import { Star, StarHalf } from 'lucide-react';

interface StarRatingProps {
  rating?: number; // 0〜5の評価値。未指定の場合はランダム生成
  showCount?: boolean; // レビュー件数を表示するか（例: 120件）
}

export default function StarRating({ rating, showCount = true }: StarRatingProps) {
  // 評価値がない場合は見栄えのよい高めの値（3.5〜5.0）をダミーとして使用
  const displayRating = rating || (Math.floor(Math.random() * (50 - 35) + 35) / 10);
  const reviewCount = rating ? 15 : Math.floor(Math.random() * 200) + 10; // ダミーのレビュー件数

  // 星のアイコンを描画するロジック
  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(displayRating);
    const hasHalfStar = displayRating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        // 塗りつぶし星
        stars.push(<Star key={i} size={16} className="text-yellow-400 fill-yellow-400" />);
      } else if (i === fullStars && hasHalfStar) {
        // 半星（lucide-reactのStarHalfを使用）
        stars.push(<StarHalf key={i} size={16} className="text-yellow-400 fill-yellow-400" />);
      } else {
        // 空星
        stars.push(<Star key={i} size={16} className="text-gray-300" />);
      }
    }
    return stars;
  };

  return (
    <div className="flex items-center gap-1">
      <div className="flex">{renderStars()}</div>
      <span className="font-bold text-gray-700 ml-1">{displayRating.toFixed(1)}</span>
      {showCount && <span className="text-xs text-gray-500">({reviewCount})</span>}
    </div>
  );
}
