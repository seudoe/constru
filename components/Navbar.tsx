import Link from "next/link"

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 bg-[#efe6d8] border-b border-[#e0d4c2] z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <h1 className="text-xl font-bold text-[#3a2e1f]">
          TheftGuard Control Center
        </h1>

        <div className="flex gap-4 text-sm font-medium">
          <Link href="/" className="hover:text-[#9c6b3d] transition">
            Dashboard
          </Link>
          <Link href="/inventory" className="hover:text-[#9c6b3d] transition">
            Inventory
          </Link>
          <Link href="/movements" className="hover:text-[#9c6b3d] transition">
            Movements
          </Link>
        </div>
      </div>
    </nav>
  )
}
