import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  iconBg?: string
  iconColor?: string
}

export function StatCard({
  label, value, icon: Icon,
  iconBg = '#eff6ff', iconColor = '#3b82f6',
}: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-[rgba(10,10,10,0.07)] p-5 flex flex-col gap-3 shadow-[0_1px_4px_rgba(10,10,10,0.06)]">
      {/* Colored icon square */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: iconBg }}
      >
        <Icon className="w-5 h-5" strokeWidth={1.8} style={{ color: iconColor }} />
      </div>

      {/* Value + label */}
      <div>
        <p className="text-[1.9rem] font-bold tracking-[-0.03em] leading-none text-[#0A0A0A]">
          {value}
        </p>
        <p className="text-xs mt-1.5" style={{ color: 'rgba(10,10,10,0.45)' }}>
          {label}
        </p>
      </div>
    </div>
  )
}
