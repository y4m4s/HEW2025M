'use client';

import { Shield } from 'lucide-react';

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-4xl px-5 py-12">
        <div className="bg-white rounded-xl shadow-lg p-8 md:p-12">
          <div className="flex items-center gap-4 mb-8 pb-4 border-b border-gray-200">
            <Shield size={32} className="text-[#2FA3E3]" />
            <h1 className="text-3xl font-bold text-gray-800">
              特定商取引法に基づく表記
            </h1>
          </div>

          <div className="pl-2 space-y-8 text-gray-700 leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-800">事業者名</h2>
              <p className="pl-2">ツリマチ株式会社</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-800">所在地</h2>
              <p className="pl-2">〒123-4567<br />東京都架空区釣り人町1-2-3 ツリマチビル</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-800">連絡先</h2>
              <p className="pl-2">電話番号: 03-1234-5678<br />メールアドレス: support@turimachi.example.com</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-800">代表者</h2>
              <p className="pl-2">代表取締役 釣田 太郎</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-800">販売価格</h2>
              <p className="pl-2">各商品ページに記載の価格（消費税込み）とします。</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-800">商品代金以外の必要料金</h2>
              <p className="pl-2">送料、支払い方法により所定の手数料がかかる場合があります。詳細は購入手続き画面にてご確認ください。</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-800">支払い方法</h2>
              <p className="pl-2">クレジットカード決済、その他各種オンライン決済に対応しています。</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-800">商品の引渡し時期</h2>
              <p className="pl-2">出品者が設定した発送までの日数に基づき発送されます。詳細は各商品ページをご確認ください。</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-800">返品・交換について</h2>
              <p className="pl-2">原則として、購入者様都合による返品・交換は受け付けておりません。商品に瑕疵がある場合や、商品説明と著しく異なる場合は、到着後7日以内にご連絡ください。</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
