import DOMPurify from 'isomorphic-dompurify';

/**
 * ユーザー入力のサニタイゼーション
 * XSS/インジェクション対策
 */

// URLかどうかをチェック
function isUrl(str: string): boolean {
  return str.startsWith('http://') || str.startsWith('https://');
}

// 安全なdata: URLかどうかをチェック（XSS対策）
// data:text/html や data:image/svg+xml はJavaScriptを含む可能性があるため拒否
function isSafeDataUrl(str: string): boolean {
  if (!str.startsWith('data:')) return false;

  // 許可する安全なMIMEタイプのみ
  const safeDataUrlPatterns = [
    /^data:image\/(?:png|jpeg|jpg|gif|webp|bmp|ico);base64,/i,
    /^data:image\/(?:png|jpeg|jpg|gif|webp|bmp|ico),/i,
  ];

  return safeDataUrlPatterns.some(pattern => pattern.test(str));
}

/**
 * HTML文字列をサニタイズ（DOMPurify使用）
 * 危険なタグや属性を除去し、安全なHTMLのみを許可します。
 */
export function sanitizeHtml(str: string): string {
  return DOMPurify.sanitize(str, {
    ALLOWED_TAGS: [
      'b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'span',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre'
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style'],
  });
}

/**
 * テキストとしてサニタイズ（HTMLタグをエスケープまたは除去）
 * Reactでそのまま表示する場合はReactがエスケープしますが、
 * 明示的にテキストのみにしたい場合に使用します。
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// HTMLエンティティをデコード（既存データの互換性のため）
export function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/");
}

// 再帰的にオブジェクトの文字列をサニタイズ
export function sanitizeUserInput<T>(input: T): T {
  if (typeof input === 'string') {
    // 通常のURLはサニタイズしない
    if (isUrl(input)) {
      return input.trim() as T;
    }
    // 安全なdata: URLのみサニタイズせずに許可
    if (isSafeDataUrl(input)) {
      return input.trim() as T;
    }
    // 危険なdata: URLはサニタイズで除去される（空文字列になる）
    // デフォルトでは安全なHTMLとしてサニタイズ
    // もし完全にタグを禁止したい場合は escapeHtml を使用するように変更してください
    // ここではDOMPurifyを使用してXSSを防ぎつつ、意図的なマークアップ（もしあれば）を許可する方針とします
    // ただし、入力が「単なるテキスト」であることを期待する場合はDOMPurifyに通すとタグが消える（または残る）動作になります

    // Check: 元の実装は escapeHtml でした。
    // 元の挙動（タグを文字列として表示）を維持しつつ、DOMPurifyも使えるようにする選択肢もありますが、
    // 「サニタイズ」の目的がXSS対策であれば、DOMPurifyが推奨されます。
    // ここではDOMPurifyを使いますが、タグが解釈されるようになるため、display側で < > が消える可能性があります。
    // User expectation: "XSS対策". escape causes <script> to become &lt;script&gt; (safe, visible).
    // DOMPurify causes <script> to become "" (safe, invisible).

    // 通常の入力フォーム（商品名など）ではHTMLを書かないはずなので、DOMPurifyでタグを除去するのは正しい挙動です。
    // (例: "Hello <script>..." -> "Hello ...")
    // これにより攻撃コードが混入しても無効化されます。

    return DOMPurify.sanitize(input.trim()) as T;
  }

  if (Array.isArray(input)) {
    return input.map(item => sanitizeUserInput(item)) as T;
  }

  if (input !== null && typeof input === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeUserInput(value);
    }
    return sanitized as T;
  }

  return input;
}
