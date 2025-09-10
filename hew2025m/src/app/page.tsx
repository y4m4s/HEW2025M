import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <div>
      <Header />
      
      <main className="container mx-auto max-w-6xl px-5">
        {/* ヒーローセクション */}
        <section className="hero-section">
          <div className="hero-content">
            <div className="hero-text">
              <h2 className="hero-title">釣り人のための<br />マーケットプレイス</h2>
              <p className="hero-description">
                釣り用品の売買から釣り情報のシェア、マッチングまで。<br />
                釣り人の集まる街「ツリマチ」で、もっと釣りを楽しもう。
              </p>
              <div className="hero-buttons">
                <a href="/sell" className="hero-btn primary">
                  <i className="fa-solid fa-fish"></i>
                  釣り用品を出品
                </a>
                <a href="/search" className="hero-btn secondary">
                  <i className="fa-solid fa-search"></i>
                  用品を探す
                </a>
              </div>
            </div>
            <div className="hero-visual">
              <div className="hero-icon">
                <i className="fa-solid fa-fish"></i>
              </div>
              <div className="floating-cards">
                <div className="card card-1">
                  <i className="fa-solid fa-fish"></i>
                  <span>釣竿</span>
                </div>
                <div className="card card-2">
                  <i className="fa-solid fa-circle"></i>
                  <span>リール</span>
                </div>
                <div className="card card-3">
                  <i className="fa-solid fa-bug"></i>
                  <span>ルアー</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 人気カテゴリー */}
        <section className="categories-section">
          <div className="section-header">
            <h3>釣り用品カテゴリー</h3>
            <p>よく取引されている釣り用品をチェック</p>
          </div>
          <div className="categories-grid">
            <div className="category-card">
              <div className="category-icon">
                <i className="fa-solid fa-fish"></i>
              </div>
              <h4>ロッド・竿</h4>
              <p>海釣り・川釣り・ルアー竿</p>
              <span className="item-count">1,234件</span>
            </div>
            <div className="category-card">
              <div className="category-icon">
                <i className="fa-solid fa-circle"></i>
              </div>
              <h4>リール</h4>
              <p>スピニング・ベイト・電動リール</p>
              <span className="item-count">856件</span>
            </div>
            <div className="category-card">
              <div className="category-icon">
                <i className="fa-solid fa-bug"></i>
              </div>
              <h4>ルアー・仕掛け</h4>
              <p>ハードルアー・ワーム・針</p>
              <span className="item-count">2,189件</span>
            </div>
            <div className="category-card">
              <div className="category-icon">
                <i className="fa-solid fa-toolbox"></i>
              </div>
              <h4>タックルボックス</h4>
              <p>道具箱・収納・ケース</p>
              <span className="item-count">423件</span>
            </div>
            <div className="category-card">
              <div className="category-icon">
                <i className="fa-solid fa-vest"></i>
              </div>
              <h4>ウェア・装身具</h4>
              <p>ライフジャケット・帽子・サングラス</p>
              <span className="item-count">678件</span>
            </div>
            <div className="category-card">
              <div className="category-icon">
                <i className="fa-solid fa-ship"></i>
              </div>
              <h4>ボート・船外機</h4>
              <p>フィッシングボート・カヤック</p>
              <span className="item-count">145件</span>
            </div>
          </div>
        </section>

        {/* 最新の出品 */}
        <section className="recent-items-section">
          <div className="section-header">
            <h3>最新の出品釣り用品</h3>
            <p>新しく出品された注目の釣り用品</p>
          </div>
          <div className="items-grid">
            <div className="item-card">
              <div className="item-image-placeholder">
                <i className="fa-solid fa-fish"></i>
              </div>
              <div className="item-info">
                <h5 className="item-title">ダイワ製 海釣り用ロッド</h5>
                <p className="item-price">¥18,000</p>
                <p className="item-location">
                  <i className="fa-solid fa-location-dot"></i>
                  湘南・江ノ島
                </p>
              </div>
            </div>
            <div className="item-card">
              <div className="item-image-placeholder">
                <i className="fa-solid fa-circle"></i>
              </div>
              <div className="item-info">
                <h5 className="item-title">シマノ電動リール</h5>
                <p className="item-price">¥45,000</p>
                <p className="item-location">
                  <i className="fa-solid fa-location-dot"></i>
                  横浜・本牧
                </p>
              </div>
            </div>
            <div className="item-card">
              <div className="item-image-placeholder">
                <i className="fa-solid fa-bug"></i>
              </div>
              <div className="item-info">
                <h5 className="item-title">メガバス ルアーセット</h5>
                <p className="item-price">¥12,500</p>
                <p className="item-location">
                  <i className="fa-solid fa-location-dot"></i>
                  多摩川・調布
                </p>
              </div>
            </div>
            <div className="item-card">
              <div className="item-image-placeholder">
                <i className="fa-solid fa-toolbox"></i>
              </div>
              <div className="item-info">
                <h5 className="item-title">タックルボックス一式</h5>
                <p className="item-price">¥8,000</p>
                <p className="item-location">
                  <i className="fa-solid fa-location-dot"></i>
                  東京湾・船橋
                </p>
              </div>
            </div>
          </div>
          <div className="section-footer">
            <a href="/search" className="more-link">
              すべての商品を見る
              <i className="fa-solid fa-arrow-right"></i>
            </a>
          </div>
        </section>

        {/* 特徴セクション */}
        <section className="features-section">
          <div className="section-header">
            <h3>釣り人のためのコミュニティ</h3>
            <p>釣り用品の取引から情報交換まで</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fa-solid fa-fish"></i>
              </div>
              <h4>釣り用品専門</h4>
              <p>釣り竿からルアーまで、釣り用品に特化した専門マーケット</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fa-solid fa-location-dot"></i>
              </div>
              <h4>釣り場情報共有</h4>
              <p>地域の釣り場情報や釣果報告をシェア</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fa-solid fa-users"></i>
              </div>
              <h4>釣り仲間と交流</h4>
              <p>近くの釣り人との情報交換やグループ釣行の企画</p>
            </div>
          </div>
        </section>

        {/* CTA セクション */}
        <section className="cta-section">
          <div className="cta-content">
            <h3 className="cta-title">釣り人のコミュニティに参加しよう</h3>
            <p className="cta-description">
              無料で簡単に始められます。あなたの釣り用品を必要な人に届けませんか？
            </p>
            <div className="cta-buttons">
              <a href="/register" className="cta-btn primary">
                <i className="fa-solid fa-fish"></i>
                釣り人として参加
              </a>
              <a href="/search" className="cta-btn secondary">
                <i className="fa-solid fa-search"></i>
                釣り用品を探す
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
