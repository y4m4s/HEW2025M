import { FileText } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-4xl px-5 py-12">
        <div className="bg-white rounded-xl shadow-lg p-8 md:p-12">
          <div className="flex items-center gap-4 mb-8 pb-4 border-b border-gray-200">
            <FileText size={32} className="text-[#2FA3E3]" />
            <h1 className="text-3xl font-bold text-gray-800" style={{ fontFamily: "せのびゴシック, sans-serif" }}>
              利用規約
            </h1>
          </div>

          <div className="space-y-6 text-gray-700 leading-relaxed">
            <p>この利用規約（以下，「本規約」といいます。）は、ツリマチ株式会社（以下，「当社」といいます。）がこのウェブサイト上で提供するサービス「ツリマチ」（以下，「本サービス」といいます。）の利用条件を定めるものです。登録ユーザーの皆さま（以下，「ユーザー」といいます。）には，本規約に従って，本サービスをご利用いただきます。</p>

            <section>
              <h2 className="text-xl font-semibold pt-4 mb-3 text-gray-800">第1条（適用）</h2>
              <p>本規約は，ユーザーと当社との間の本サービスの利用に関わる一切の関係に適用されるものとします。</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold pt-4 mb-3 text-gray-800">第2条（利用登録）</h2>
              <p>本サービスにおいては，登録希望者が本規約に同意の上，当社の定める方法によって利用登録を申請し，当社がこれを承認することによって，利用登録が完了するものとします。</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold pt-4 mb-3 text-gray-800">第3条（禁止事項）</h2>
              <p>ユーザーは，本サービスの利用にあたり，以下の行為をしてはなりません。</p>
              <ul className="list-disc list-inside space-y-2 mt-2 pl-4">
                <li>法令または公序良俗に違反する行為</li>
                <li>犯罪行為に関連する行為</li>
                <li>本サービスの内容等，本サービスに含まれる著作権，商標権ほか知的財産権を侵害する行為</li>
                <li>当社のサーバーまたはネットワークの機能を破壊したり，妨害したりする行為</li>
                <li>本サービスによって得られた情報を商業的に利用する行為</li>
                <li>当社のサービスの運営を妨害するおそれのある行為</li>
                <li>不正アクセスをし，またはこれを試みる行為</li>
                <li>他のユーザーに関する個人情報等を収集または蓄積する行為</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold pt-4 mb-3 text-gray-800">第4条（免責事項）</h2>
              <p>当社は，本サービスに起因してユーザーに生じたあらゆる損害について一切の責任を負いません。ただし，本サービスに関する当社とユーザーとの間の契約（本規約を含みます。）が消費者契約法に定める消費者契約となる場合，この免責規定は適用されません。</p>
            </section>

            <p className="text-right mt-8">以上</p>
            <p className="text-right text-sm">制定日: 2024年1月1日</p>
          </div>
        </div>
      </div>
    </div>
  );
}
