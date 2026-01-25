'use client'

type InventoryItem = {
  id: string
  item_name: string
  item_id: string
  zone: string
  quantity: number
  min_stock?: number
}

export default function InventoryTable({ items }: { items: InventoryItem[] }) {
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 text-left">Name</th>
            <th className="px-4 py-2 text-left">Item ID</th>
            <th className="px-4 py-2 text-left">Zone</th>
            <th className="px-4 py-2 text-left">Quantity</th>
            <th className="px-4 py-2 text-left">Min Stock</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {items.map((item) => (
            <tr key={item.id}>
              <td className="px-4 py-2">{item.item_name}</td>
              <td className="px-4 py-2">{item.item_id}</td>
              <td className="px-4 py-2">{item.zone}</td>
              <td className="px-4 py-2">{item.quantity}</td>
              <td className="px-4 py-2">{item.min_stock ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
