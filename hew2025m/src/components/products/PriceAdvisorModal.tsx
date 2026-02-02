'use client';

import { X } from 'lucide-react';
import PriceAdvisor from './PriceAdvisor';


interface PriceAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  onPriceSelect: (price: number) => void;
}

export default function PriceAdvisorModal({ isOpen, onClose, productName, onPriceSelect }: PriceAdvisorModalProps) {
  if (!isOpen) return null;

  // 価格が選択されたときに、親コンポーネントに価格を通知し、モーダルを閉じる関数
  const handleSelectAndClose = (price: number) => {
    onPriceSelect(price);
    onClose();
  };

  return (
    <div 
        className="fixed inset-0 bg-white/90 backdrop-blur-sm flex justify-center items-center z-50 p-4"
        onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-gradient-to-r from-blue-50 to-blue-100 z-10 px-6 py-4 border-b border-blue-200 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-2xl font-bold text-blue-900">価格相場アドバイザー</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors p-2 hover:bg-white rounded-full"
            aria-label="閉じる"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 sm:p-8">
            <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
              <p className="text-sm text-gray-600">商品名</p>
              <p className="text-lg font-bold text-blue-900">{productName}</p>
            </div>
            {/* 価格相場アドバイザー本体のコンポーネントを呼び出す */}
            <PriceAdvisor productName={productName} onPriceSelect={handleSelectAndClose} />
        </div>
      </div>
    </div>
  );
}