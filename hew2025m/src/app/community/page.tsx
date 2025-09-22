import Link from 'next/link';
import PostCard, { Post } from '@/components/PostCard';

export default function CommunityPage() {
  const samplePosts: Post[] = [
    {
      id: 1,
      title: '東京湾で大型スズキゲット！',
      excerpt: '朝マズメの時間帯に70cmのスズキを釣り上げました。ルアーはメガバス製のミノーを使用。潮の流れが良くて...',
      fishName: 'スズキ',
      fishSize: '70cm',
      fishWeight: '3.2kg',
      location: '東京湾・豊洲',
      author: '海釣り太郎',
      date: '2024年12月15日',
      likes: 24,
      comments: 8,
      category: 'sea'
    },
    {
      id: 2,
      title: '多摩川でバスの数釣り成功',
      excerpt: 'ワームを使って数釣りを楽しんできました。30cmクラスのバスを5匹キャッチ。今日のポイントは浅場の...',
      fishName: 'ブラックバス',
      fishSize: '30cm',
      fishCount: '5匹',
      location: '多摩川・調布',
      author: 'バス釣り花子',
      date: '2024年12月14日',
      likes: 18,
      comments: 12,
      category: 'river'
    },
    {
      id: 3,
      title: '湘南でマダイの良型！',
      excerpt: '船釣りで念願のマダイをゲット。50cmオーバーの良型で引きが強くて楽しかったです。エサはアミエビを...',
      fishName: 'マダイ',
      fishSize: '52cm',
      fishWeight: '2.8kg',
      location: '湘南・江ノ島沖',
      author: '船釣り次郎',
      date: '2024年12月13日',
      likes: 35,
      comments: 15,
      category: 'sea',
      isLiked: true
    }
  ];
  return (
    <div>
      
      <div className="bg-gray-50 min-h-screen">
        <main className="flex max-w-7xl mx-auto px-5 py-8 gap-8">
          <div className="flex-1">
            <section className="mb-12">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800" style={{ fontFamily: "せのびゴシック, sans-serif" }}>人気の投稿</h2>
                <Link href="/post" className="bg-gradient-to-r from-[#2FA3E3] to-[#1d7bb8] text-white px-6 py-3 rounded-full font-medium hover:shadow-lg transition-all duration-300">
                  投稿する
                </Link>
              </div>
              <PostCard post={samplePosts[0]} variant="compact" />
            </section>

            <section className="mb-12">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800" style={{ fontFamily: "せのびゴシック, sans-serif" }}>最新の投稿</h2>
                <Link href="/postList" className="text-[#2FA3E3] font-medium hover:text-[#1d7bb8] transition-colors duration-300">
                  もっと見る
                </Link>
              </div>
              <div className="space-y-6">
                <PostCard post={samplePosts[1]} variant="simple" />
                <PostCard post={samplePosts[2]} variant="simple" />
              </div>
              <div className="text-center mt-8">
                <Link href="/postList" className="text-[#2FA3E3] font-medium hover:text-[#1d7bb8] transition-colors duration-300">
                  もっと見る
                </Link>
              </div>
            </section>
          </div>

          <aside className="w-80">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 mb-4">
                地図
              </div>
              <Link href="/map" className="block w-full text-center bg-[#2FA3E3] text-white py-3 rounded-lg hover:bg-[#1d7bb8] transition-colors duration-300">
                マップページへ
              </Link>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4" style={{ fontFamily: "せのびゴシック, sans-serif" }}>投稿を見る</h3>
              <p className="text-gray-600 text-sm mb-4">すべての投稿を一覧で確認できます</p>
              <Link href="/postList" className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-[#2FA3E3] to-[#1d7bb8] text-white py-3 rounded-lg hover:shadow-lg transition-all duration-300">
                📋 投稿一覧を見る
              </Link>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4" style={{ fontFamily: "せのびゴシック, sans-serif" }}>おすすめのユーザー</h3>
              <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                おすすめユーザー一覧
              </div>
            </div>
          </aside>
        </main>
      </div>

    </div>
  );
}