export default function Header() {
  return (
    <header className="site-header">
      <div className="header-top">
        <h1 className="logo">
          <a href="/">ツリマチ</a>
        </h1>
        <nav className="main-nav">
          <a href="/sell">出品する</a>
          <a href="/search">商品を探す</a>
          <a href="/community">コミュニティ</a>
        </nav>
        <div className="header-right">
          <a href="/notification" className="icon-btn" aria-label="通知">
            <i className="fa-regular fa-bell"></i>
          </a>
          <a href="/message" className="icon-btn" aria-label="メッセージ">
            <i className="fa-regular fa-envelope"></i>
          </a>
          <a href="/login" className="btn login-btn">ログイン</a>
          <a href="/register" className="btn signup-btn">新規登録</a>
        </div>
      </div>
      <div className="header-bottom">
        <form action="/search" method="get" className="search-form">
          <i className="fa-solid fa-magnifying-glass search-icon"></i>
          <input type="search" placeholder="キーワードで検索" className="search-input" />
        </form>
      </div>
    </header>
  );
}