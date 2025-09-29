export default function ResumenCard({ label, value, unit = "", color = "text-white" }) {
  return (
    <div className="bg-gray-900/60 rounded-lg p-4 flex flex-col items-center shadow-inner">
      <span className="text-sm text-gray-400">{label}</span>
      <span className={`text-2xl font-bold ${color}`}>
        {value !== null && value !== undefined ? value : 0} {unit}
      </span>
    </div>
  )
}