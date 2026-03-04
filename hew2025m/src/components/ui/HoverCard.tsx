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
  disabled?: boolean;
}

export default function HoverCard({
  trigger,
  children,
  side = "bottom",
  align = "center",
  openDelay = 300,
  closeDelay = 200,
  disabled = false,
}: HoverCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const openTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  const applyPosition = () => {
    if (!triggerRef.current || !contentRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    let top = rect.top;
    let left = rect.left;

    if (side === "bottom") {
      top += rect.height + 8;
    } else if (side === "top") {
      top -= 8;
    } else if (side === "right") {
      left += rect.width + 8;
    } else if (side === "left") {
      left -= 8;
    }

    if (side === "top" || side === "bottom") {
      if (align === "center") {
        left += rect.width / 2;
      } else if (align === "end") {
        left += rect.width;
      }
    } else {
      if (align === "center") {
        top += rect.height / 2;
      } else if (align === "end") {
        top += rect.height;
      }
    }

    contentRef.current.style.top = `${top}px`;
    contentRef.current.style.left = `${left}px`;
  };

  useEffect(() => {
    if (disabled && isOpen) {
      setIsVisible(false);
      setTimeout(() => setIsOpen(false), 150);
    }
  }, [disabled, isOpen]);

  const handleMouseEnter = () => {
    if (disabled) return;
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }

    openTimeoutRef.current = setTimeout(() => {
      setIsOpen(true);
      setTimeout(() => {
        applyPosition();
        setIsVisible(true);
      }, 10);
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
      if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    applyPosition();

    const handleScroll = () => applyPosition();
    const handleResize = () => applyPosition();

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const transformValue =
    side === "top" || side === "bottom"
      ? align === "center"
        ? "translateX(-50%)"
        : align === "end"
        ? "translateX(-100%)"
        : "none"
      : align === "center"
      ? "translateY(-50%)"
      : align === "end"
      ? "translateY(-100%)"
      : "none";

  const scaleValue = isVisible ? "scale(1)" : "scale(0.95)";
  const combinedTransform = transformValue !== "none"
    ? `${transformValue} ${scaleValue}`
    : scaleValue;

  const portalContent = isOpen && mounted ? (
    <div
      ref={contentRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        transform: combinedTransform,
      }}
      className={`z-[9999] transition-[opacity,transform] duration-150 ${
        isVisible ? "opacity-100" : "opacity-0"
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
