import { Fish } from "lucide-react";

export default function ProfBookmark() {
  return (
    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-lg transition">
          <div className="h-36 bg-gray-200 flex items-center justify-center">
            <Fish />
          </div>
          <div className="p-3 text-sm">
            <p className="font-medium">釣り用バッグ</p>
            <p className="text-lg font-bold text-[#2FA3E3]">¥4,800</p>
            <p className="text-xs text-gray-500">ブックマーク済み</p>
          </div>
        </div>
      ))}
    </div>
  );
}
