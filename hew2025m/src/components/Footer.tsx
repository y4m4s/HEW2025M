export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-main">
          <div className="footer-section footer-brand">
            <a href="/" className="footer-logo">ツリマチ</a>
            <p className="footer-description">
              釣り人のためのマーケットプレイス。<br />
              釣り用品の売買から情報共有まで、釣り人と釣り人をつなぐコミュニティプラットフォームです。
            </p>
            <div className="social-links">
              <a href="#" className="social-link" aria-label="Twitter">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="#" className="social-link" aria-label="Facebook">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="#" className="social-link" aria-label="Instagram">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="#" className="social-link" aria-label="YouTube">
                <i className="fab fa-youtube"></i>
              </a>
            </div>
          </div>

          <div className="footer-section">
            <h3>サービス</h3>
            <ul className="footer-links">
              <li><a href="/sell">商品を出品</a></li>
              <li><a href="/search">商品を探す</a></li>
              <li><a href="/community">コミュニティ</a></li>
              <li><a href="/postList">投稿一覧</a></li>
              <li><a href="/map">マップ</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h3>サポート</h3>
            <ul className="footer-links">
              <li><a href="#">ヘルプ・FAQ</a></li>
              <li><a href="#">お問い合わせ</a></li>
              <li><a href="#">利用規約</a></li>
              <li><a href="#">プライバシーポリシー</a></li>
              <li><a href="#">特定商取引法</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h3>お問い合わせ</h3>
            <ul className="contact-info">
              <li><i className="fas fa-envelope"></i> info@tsurimachi.jp</li>
              <li><i className="fas fa-phone"></i> 03-1234-5678</li>
              <li><i className="fas fa-map-marker-alt"></i> 東京都渋谷区</li>
            </ul>
            <div className="newsletter-form">
              <input type="email" className="newsletter-input" placeholder="メールアドレス" />
              <button className="newsletter-btn">ニュースレター購読</button>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-copyright">
            <p>&copy; 2024 ツリマチ. All rights reserved.</p>
          </div>
          <ul className="footer-bottom-links">
            <li><a href="#">利用規約</a></li>
            <li><a href="#">プライバシーポリシー</a></li>
            <li><a href="#">Cookie設定</a></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}