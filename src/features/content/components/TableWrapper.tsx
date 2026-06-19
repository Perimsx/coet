'use client'

const TableWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="my-5 w-full overflow-x-auto rounded-lg border border-zinc-200/60 dark:border-white/10">
      <table className="w-full min-w-[500px] border-collapse text-left text-[14px] sm:min-w-full [&_th]:border-b [&_th]:border-zinc-200/80 [&_th]:bg-zinc-50/80 [&_th]:px-4 [&_th]:py-2.5 [&_th]:font-semibold [&_th]:text-zinc-900 dark:[&_th]:border-white/10 dark:[&_th]:bg-white/5 dark:[&_th]:text-zinc-100 [&_td]:border-b [&_td]:border-zinc-100 [&_td]:px-4 [&_td]:py-2.5 [&_td]:text-zinc-600 dark:[&_td]:border-white/5 dark:[&_td]:text-zinc-300 [&_tr:last-child_td]:border-b-0 [&_tbody_tr]:transition-colors [&_tbody_tr:hover]:bg-zinc-50/80 dark:[&_tbody_tr:hover]:bg-white/5">
        {children}
      </table>
    </div>
  )
}

export default TableWrapper
