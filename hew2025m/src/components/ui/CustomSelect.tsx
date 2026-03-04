"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
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
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const [mounted, setMounted] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ドロップダウンの位置を計算してportalに反映
  const updateDropdownPosition = () => {
    if (!selectRef.current) return;
    const rect = selectRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const dropdownHeight = Math.min(300, options.length * 44 + 8);

    if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
      // 上に開く
      setDropdownStyle({
        position: "fixed",
        bottom: window.innerHeight - rect.top + 8,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      });
    } else {
      // 下に開く
      setDropdownStyle({
        position: "fixed",
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // スクロール・リサイズ時に位置を更新
  useEffect(() => {
    if (!isOpen) return;
    const handleUpdate = () => updateDropdownPosition();
    window.addEventListener("scroll", handleUpdate, true);
    window.addEventListener("resize", handleUpdate);
    return () => {
      window.removeEventListener("scroll", handleUpdate, true);
      window.removeEventListener("resize", handleUpdate);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // 外側クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
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
    md: "p-3 text-base",
    lg: "p-4 text-lg",
  };

  const dropdown = isOpen && mounted ? createPortal(
    <div
      ref={dropdownRef}
      style={dropdownStyle}
      className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden max-h-[300px] overflow-y-auto"
    >
      <div className="py-1">
        {options.map((option, index) => (
          <button
            key={index}
            type="button"
            onClick={() => handleSelect(option.value)}
            className={`w-full text-left px-4 py-3 ${size === "sm" ? "text-xs" : "text-sm"} transition-all duration-200 flex items-center gap-2 ${
              option.value === value
                ? "bg-gradient-to-r from-blue-50 to-cyan-50 text-[#2FA3E3] font-medium"
                : "text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 hover:text-[#2FA3E3]"
            }`}
          >
            {option.icon && <option.icon size={size === "sm" ? 16 : 18} />}
            {option.label}
          </button>
        ))}
      </div>
    </div>,
    document.body
  ) : null;

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
          {selectedOption?.icon && <selectedOption.icon size={size === "sm" ? 16 : 18} />}
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={size === "sm" ? 16 : 20}
          className={`text-gray-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {dropdown}
    </div>
  );
}
