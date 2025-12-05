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

  const handleSelectAndClose = (price: number) => {
    onPriceSelect(price);
    onClose();
  }

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4"
        onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white/80 backdrop-blur-sm z-10 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">価格相場アドバイザー</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition-colors"
            aria-label="閉じる"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="p-2 sm:p-4">
            <PriceAdvisor productName={productName} onPriceSelect={handleSelectAndClose} />
        </div>
      </div>
    </div>
  );
}

// CSS in globals.css or a style tag for the animation:
/*
@keyframes fade-in-scale {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
.animate-fade-in-scale {
  animation: fade-in-scale 0.3s ease-out forwards;
}
*/