'use client'

const TableWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="my-4 overflow-x-auto">
      <table className="w-full min-w-[400px] border-collapse text-[13px] [&_th]:border-b [&_th]:border-zinc-200/70 [&_th]:px-3 [&_th]:py-1.5 [&_th]:text-left [&_th]:font-semibold [&_th]:text-zinc-500 dark:[&_th]:border-white/10 dark:[&_th]:text-zinc-400 [&_td]:border-b [&_td]:border-zinc-100 [&_td]:px-3 [&_td]:py-1.5 [&_td]:text-zinc-600 dark:[&_td]:border-white/5 dark:[&_td]:text-zinc-300 [&_tr:last-child_td]:border-b-0">
        {children}
      </table>
    </div>
  )
}

export default TableWrapper
