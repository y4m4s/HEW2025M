"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface SelectOption {
  value: string;
  label: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "選択してください",
  className = "",
  disabled = false,
  size = "md",
}: CustomSelectProps & { size?: "sm" | "md" | "lg" }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // 外側クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const sizeClasses = {
    sm: "py-2 px-3 text-sm",
    md: "p-3 text-base", // Reduced from p-4 to p-3 for better standard sizing
    lg: "p-4 text-lg",
  };

  return (
    <div ref={selectRef} className={`relative ${className}`}>
      {/* セレクトボタン */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full ${sizeClasses[size]} border border-gray-200 rounded-xl
        focus:border-[#2FA3E3] focus:outline-none focus:ring-2 focus:ring-[#2FA3E3]/20
        transition-all duration-200 bg-white
        hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 cursor-pointer text-gray-700 font-medium text-left flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <span className={`flex items-center gap-2 ${selectedOption ? "text-gray-700" : "text-gray-400"}`}>
          {selectedOption?.icon && <selectedOption.icon size={size === 'sm' ? 16 : 18} />}
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={size === 'sm' ? 16 : 20}
          className={`text-gray-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* ドロップダウンリスト */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50 max-h-[300px] overflow-y-auto">
          <div className="py-1">
            {options.map((option, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`w-full text-left px-4 py-3 ${size === 'sm' ? 'text-xs' : 'text-sm'} transition-all duration-200 flex items-center gap-2 ${option.value === value
                    ? "bg-gradient-to-r from-blue-50 to-cyan-50 text-[#2FA3E3] font-medium"
                    : "text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 hover:text-[#2FA3E3]"
                  }`}
              >
                {option.icon && <option.icon size={size === 'sm' ? 16 : 18} />}
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
