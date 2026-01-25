interface Props {
  title: string
  value: string | number
  color?: string
}

export default function StatCard({ title, value, color = 'text-[#2B2B2B]' }: Props) {
  return (
    <div
      className="
        bg-white border border-[#E5E0D8] rounded-xl p-4 
        shadow-sm hover:shadow-md 
        transition-all duration-300 hover:-translate-y-1
      "
    >
      <p className="text-xs uppercase tracking-wide text-[#8B6F56]">
        {title}
      </p>

      <p className={`text-2xl font-bold mt-2 ${color}`}>
        {value}
      </p>
    </div>
  )
}
