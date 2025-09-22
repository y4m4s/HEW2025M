'use client';

import { useState } from 'react';
import { Upload, MapPin } from 'lucide-react';

export default function Post() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [location, setLocation] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 投稿処理のロジックをここに追加
    console.log('投稿データ:', { title, content, location });
  };

  return (
    <div className="min-h-screen flex flex-col">

      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <h2 className="text-2xl font-bold mb-2">投稿する</h2>
          <p className="text-gray-600 mb-8">投稿の情報を入力してください。</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                件名
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                placeholder="件名を入力してください。"
                required
              />
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                本文
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                maxLength={140}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors resize-none"
                placeholder="本文を140字以内で入力してください。"
                required
              />
              <div className="text-right text-sm text-gray-500 mt-1">
                {content.length}/140文字
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                メディアをアップロード
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer">
                <Upload size={32} className="mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">
                  画像や動画をアップロードしてください
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  ファイルをドラッグ&ドロップするか、クリックして選択
                </p>
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                />
              </div>
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin size={16} className="inline mr-1" />
                位置情報
              </label>
              <input
                type="text"
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                placeholder="位置情報を入力してください。"
              />
            </div>

            <div className="pt-6">
              <button
                type="submit"
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                投稿する
              </button>
            </div>
          </form>
        </div>
      </main>

    </div>
  );
}