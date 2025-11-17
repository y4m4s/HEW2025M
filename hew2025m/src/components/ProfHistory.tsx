import { Fish } from "lucide-react";

export default function ProfHistory() {
  return (
    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-lg transition opacity-75">
          <div className="h-36 bg-gray-200 flex items-center justify-center">
            <Fish />
          </div>
          <div className="p-3 text-sm">
            <p className="font-medium">釣り用ルアーセット</p>
            <p className="text-lg font-bold text-gray-500">¥2,000</p>
            <p className="text-xs text-gray-500">販売済み・1週間前</p>
          </div>
        </div>
      ))}
    </div>
  );
}
