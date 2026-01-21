import { Lock } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-4xl px-5 py-12">
        <div className="bg-white rounded-xl shadow-lg p-8 md:p-12">
          <div className="flex items-center gap-4 mb-8 pb-4 border-b border-gray-200">
            <Lock size={32} className="text-[#2FA3E3]" />
            <h1 className="text-3xl font-bold text-gray-800" style={{ fontFamily: "せのびゴシック, sans-serif" }}>
              プライバシーポリシー
            </h1>
          </div>

          <div className="space-y-6 text-gray-700 leading-relaxed">
            <p>ツリマチ株式会社（以下「当社」といいます。）は、当社が提供するサービス「ツリマチ」（以下「本サービス」といいます。）における、ユーザーの個人情報の取扱いについて、以下のとおりプライバシーポリシー（以下「本ポリシー」といいます。）を定めます。</p>

            <section>
              <h2 className="text-xl font-semibold pt-4 mb-3 text-gray-800">第1条（個人情報）</h2>
              <p>「個人情報」とは、個人情報保護法にいう「個人情報」を指すものとし、生存する個人に関する情報であって、当該情報に含まれる氏名、生年月日、住所、電話番号、連絡先その他の記述等により特定の個人を識別できる情報及び容貌、指紋、声紋にかかるデータ、及び健康保険証の保険者番号などの当該情報単体から特定の個人を識別できる情報（個人識別情報）を指します。</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold pt-4 mb-3 text-gray-800">第2条（個人情報の収集方法）</h2>
              <p>当社は、ユーザーが利用登録をする際に氏名、生年月日、住所、電話番号、メールアドレス、銀行口座番号、クレジットカード番号などの個人情報をお尋ねすることがあります。また、ユーザーと提携先などとの間でなされたユーザーの個人情報を含む取引記録や決済に関する情報を、当社の提携先（情報提供元、広告主、広告配信先などを含みます。以下、｢提携先｣といいます。）などから収集することがあります。</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold pt-4 mb-3 text-gray-800">第3条（個人情報を収集・利用する目的）</h2>
              <p>当社が個人情報を収集・利用する目的は、以下のとおりです。</p>
              <ul className="list-disc list-inside space-y-2 mt-2 pl-4">
                <li>当社サービスの提供・運営のため</li>
                <li>ユーザーからのお問い合わせに回答するため（本人確認を行うことを含む）</li>
                <li>ユーザーが利用中のサービスの新機能、更新情報、キャンペーン等及び当社が提供する他のサービスの案内のメールを送付するため</li>
                <li>メンテナンス、重要なお知らせなど必要に応じたご連絡のため</li>
                <li>利用規約に違反したユーザーや、不正・不当な目的でサービスを利用しようとするユーザーの特定をし、ご利用をお断りするため</li>
                <li>上記の利用目的に付随する目的</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold pt-4 mb-3 text-gray-800">第4条（プライバシーポリシーの変更）</h2>
              <p>本ポリシーの内容は、法令その他本ポリシーに別段の定めのある事項を除いて、ユーザーに通知することなく、変更することができるものとします。当社が別途定める場合を除いて、変更後のプライバシーポリシーは、本ウェブサイトに掲載したときから効力を生じるものとします。</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold pt-4 mb-3 text-gray-800">第5条（お問い合わせ窓口）</h2>
              <p>本ポリシーに関するお問い合わせは、下記の窓口までお願いいたします。<br/>
              住所：〒123-4567 東京都架空区釣り人町1-2-3 ツリマチビル<br/>
              社名：ツリマチ株式会社<br/>
              メールアドレス：privacy@turimachi.example.com</p>
            </section>

            <p className="text-right mt-8">以上</p>
            <p className="text-right text-sm">制定日: 2026年1月1日</p>
          </div>
        </div>
      </div>
    </div>
  );
}
