export default function ContractHistory({ contracts }: any) {
  return (
    <div className="card p-4">
      <h2 className="text-lg font-semibold mb-3">Past Contracts</h2>

      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {contracts.map((c: any) => (
          <div key={c.id} className="border p-2 rounded flex justify-between">
            <div>
              <p className="font-medium">{c.project_name}</p>
              <p className="text-xs text-gray-500">
                ₹{c.total_cost} • {new Date(c.created_at).toLocaleDateString()}
              </p>
            </div>

            <a
              href={c.pdf_url}
              target="_blank"
              className="text-blue-600 underline text-sm"
            >
              View PDF
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}
