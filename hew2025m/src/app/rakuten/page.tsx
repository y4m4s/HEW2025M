"use client";
import React, { useEffect, useState } from "react";

interface Product {
  itemName: string;
  itemPrice: number;
  itemUrl: string;
  imageUrl: string;
  shopName: string;
}

export default function RakutenRankingPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [genreId, setGenreId] = useState(""); // Categoria
  const [keyword, setKeyword] = useState(""); // Palavra-chave

  const fetchRanking = async (genreIdVal = "", keywordVal = "") => {
    setLoading(true);
    setError("");
    try {
      const appId = process.env.NEXT_PUBLIC_RAKUTEN_APP_ID;
      if (!appId) {
        setError("Rakuten Application ID não definido no .env");
        setLoading(false);
        return;
      }
      const params = [
        `format=json`,
        `applicationId=${appId}`
      ];
      if (genreIdVal) params.push(`genreId=${encodeURIComponent(genreIdVal)}`);
      if (keywordVal) params.push(`keyword=${encodeURIComponent(keywordVal)}`);
      const url = `https://app.rakuten.co.jp/services/api/IchibaItem/Ranking/20170628?${params.join("&")}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.Items) {
        setProducts(
          data.Items.map((obj: any) => ({
            itemName: obj.Item.itemName,
            itemPrice: obj.Item.itemPrice,
            itemUrl: obj.Item.itemUrl,
            imageUrl: obj.Item.mediumImageUrls[0]?.imageUrl || "",
            shopName: obj.Item.shopName,
          }))
        );
      } else {
        setError("Resultados não encontrados ou erro na API");
      }
    } catch (e: any) {
      setError("Falha ao buscar ranking: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Busca inicial (todos)
    fetchRanking();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRanking(genreId, keyword);
  };

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Rakuten 人気商品ランキング</h1>
      <form onSubmit={handleSearch} className="mb-8 flex gap-4 flex-wrap items-end">
        <div className="flex flex-col">
          <label htmlFor="genre" className="mb-1 font-medium">ジャンルID</label>
          <input
            id="genre"
            value={genreId}
            onChange={e => setGenreId(e.target.value)}
            type="text"
            className="border rounded px-2 py-1 min-w-[100px] text-sm"
            placeholder="ex: 100005 (米・雑穀)"
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor="keyword" className="mb-1 font-medium">キーワード</label>
          <input
            id="keyword"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            type="text"
            className="border rounded px-2 py-1 min-w-[100px] text-sm"
            placeholder="ex: お米"
          />
        </div>
        <button type="submit" className="bg-blue-600 text-white rounded px-4 py-2 text-sm font-bold hover:bg-blue-700">検索</button>
      </form>
      {loading && <p>Carregando...</p>}
      {error && <div className="text-red-500">Erro: {error}</div>}
      <ul className="space-y-4">
        {products.map((item, idx) => (
          <li key={item.itemUrl} className="flex gap-4 items-center border-b pb-3">
            <span className="font-bold w-8">{idx + 1}.</span>
            <img src={item.imageUrl} alt={item.itemName} className="w-16 h-16 object-cover rounded" />
            <div>
              <a href={item.itemUrl} target="_blank" rel="noopener" className="font-semibold text-blue-700 hover:underline">{item.itemName}</a>
              <div className="text-sm">Loja: {item.shopName}</div>
              <div className="text-lg font-mono">¥{item.itemPrice.toLocaleString()}</div>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
