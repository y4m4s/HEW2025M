import Link from "next/link";
import { LucideIcon } from "lucide-react";

interface DropdownItem {
  name: string;
  href: string;
  Icon: LucideIcon;
}

interface DropdownMenuProps {
  items: DropdownItem[];
  columns?: 1 | 2 | 3;
}

export default function DropdownMenu({ items, columns = 2 }: DropdownMenuProps) {
  const width = columns === 1 ? "min-w-[240px]" : columns === 2 ? "min-w-[480px]" : "min-w-[720px]";
  const gridCols = columns === 1 ? "grid-cols-1" : columns === 2 ? "grid-cols-2" : "grid-cols-3";

  return (
    <div className={`absolute top-full left-1/2 -translate-x-1/2 pt-2 ${width} invisible opacity-0 translate-y-2 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 ease-in-out z-50`}>
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
        <div className={`grid ${gridCols} gap-2 p-2`}>
          {items.map((item, index) => {
            const IconComponent = item.Icon;
            return (
              <Link
                key={index}
                href={item.href}
                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 hover:text-[#2FA3E3] rounded-lg transition-all duration-200 group/item"
              >
                <IconComponent
                  size={18}
                  className="text-gray-500 group-hover/item:text-[#2FA3E3] transition-colors duration-200 flex-shrink-0"
                />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
