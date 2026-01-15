import Link from 'next/link';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface CategoryCardProps {
    title: string;
    count: number;
    icon: LucideIcon;
    color: string;
    description: string;
    href: string;
    className?: string;
}

export function CategoryCard({
    title,
    count,
    icon: Icon,
    color,
    description,
    href,
    className
}: CategoryCardProps) {
    return (
        <Link href={href} className={cn(
            "group relative p-6 bg-white border border-[#EBEBEB] rounded-xl transition-all duration-200 hover:shadow-md hover:border-transparent overflow-hidden block",
            className
        )}>
            <div className={cn("absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full opacity-5 transition-transform group-hover:scale-110", color)} />

            <div className="flex items-start justify-between mb-4">
                <div className={cn("p-2.5 rounded-lg text-white shadow-sm", color)}>
                    <Icon size={24} />
                </div>
                <div className="text-2xl font-bold text-[#37352F]">{count}</div>
            </div>

            <div className="space-y-1">
                <h3 className="text-lg font-bold text-[#37352F]">{title}</h3>
                <p className="text-sm text-[#787774] leading-relaxed">{description}</p>
            </div>

            <div className="mt-4 pt-4 border-t border-[#F1F1F0] flex items-center text-xs font-medium text-[#A1A1A1] group-hover:text-[#37352F] transition-colors">
                모두 보기 &rarr;
            </div>
        </Link>
    );
}

interface StatCardProps {
    label: string;
    value: string | number;
    description?: string;
}

export function StatCard({ label, value, description }: StatCardProps) {
    return (
        <div className="p-4 bg-white border border-[#EBEBEB] rounded-lg">
            <div className="text-xs font-medium text-[#787774] mb-1">{label}</div>
            <div className="text-xl font-bold text-[#37352F]">{value}</div>
            {description && <div className="text-[10px] text-[#A1A1A1] mt-1">{description}</div>}
        </div>
    );
}
