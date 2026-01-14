"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { createPortal } from "react-dom";

interface HoverCardProps {
  trigger: ReactNode;
  children: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  openDelay?: number;
  closeDelay?: number;
}

export default function HoverCard({
  trigger,
  children,
  side = "bottom",
  align = "center",
  openDelay = 300,
  closeDelay = 200,
}: HoverCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const openTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
      });
    }
  };

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }

    openTimeoutRef.current = setTimeout(() => {
      updatePosition();
      setIsOpen(true);
      setTimeout(() => setIsVisible(true), 10);
    }, openDelay);
  };

  const handleMouseLeave = () => {
    if (openTimeoutRef.current) {
      clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = null;
    }

    closeTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => setIsOpen(false), 150);
    }, closeDelay);
  };

  useEffect(() => {
    setMounted(true);
    return () => {
      if (openTimeoutRef.current) {
        clearTimeout(openTimeoutRef.current);
      }
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      const handleScroll = () => updatePosition();
      const handleResize = () => updatePosition();

      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isOpen]);

  const getPositionStyles = () => {
    if (!triggerRef.current) return {};

    const rect = triggerRef.current.getBoundingClientRect();
    let top = position.top;
    let left = position.left;

    // 位置計算
    if (side === "bottom") {
      top += rect.height + 8;
    } else if (side === "top") {
      top -= 8;
    } else if (side === "right") {
      left += rect.width + 8;
    } else if (side === "left") {
      left -= 8;
    }

    // 配置計算
    if (side === "top" || side === "bottom") {
      if (align === "start") {
        left += 0;
      } else if (align === "center") {
        left += rect.width / 2;
      } else if (align === "end") {
        left += rect.width;
      }
    } else {
      if (align === "start") {
        top += 0;
      } else if (align === "center") {
        top += rect.height / 2;
      } else if (align === "end") {
        top += rect.height;
      }
    }

    return {
      position: 'fixed' as const,
      top: `${top}px`,
      left: `${left}px`,
      transform: side === "top" || side === "bottom"
        ? align === "center" ? "translateX(-50%)" : align === "end" ? "translateX(-100%)" : "none"
        : align === "center" ? "translateY(-50%)" : align === "end" ? "translateY(-100%)" : "none",
    };
  };

  const portalContent = isOpen && mounted ? (
    <div
      ref={contentRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={getPositionStyles()}
      className={`z-[9999] transition-all duration-150 ${
        isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
      }`}
    >
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 hover:border-[#2FA3E3] p-4 min-w-[280px] transition-colors duration-200">
        {children}
      </div>
    </div>
  ) : null;

  return (
    <>
      <div className="relative inline-block">
        <div
          ref={triggerRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {trigger}
        </div>
      </div>
      {mounted && createPortal(portalContent, document.body)}
    </>
  );
}
