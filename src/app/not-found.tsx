import Link from '@/shared/components/Link'
import { getServerDictionary } from '@/shared/utils/i18n-server'

export default async function NotFound() {
  const dictionary = await getServerDictionary()

  return (
    <div className="flex min-h-[65vh] flex-col items-start justify-center pt-12 pb-24 md:flex-row md:items-center md:justify-center md:space-x-6 md:pt-24">
      <div className="space-x-2 pt-6 pb-8 md:space-y-5">
        <h1 className="text-4xl leading-10 font-extrabold tracking-tight text-gray-900 sm:text-5xl md:border-r-2 md:px-6 md:text-6xl md:leading-13 dark:text-gray-100">
          404
        </h1>
      </div>
      <div className="max-w-md">
        <p className="mb-4 text-xl leading-normal font-bold md:text-2xl">
          {dictionary.notFound.title}
        </p>
        <p className="mb-6">{dictionary.notFound.body}</p>
        <Link
          href="/"
          className="focus:shadow-outline-blue inline rounded-lg border border-transparent bg-blue-600 px-4 py-2 text-sm leading-5 font-medium text-white shadow-xs transition-colors duration-150 hover:bg-blue-700 focus:outline-hidden dark:hover:bg-blue-500"
        >
          {dictionary.notFound.backHome}
        </Link>
      </div>
    </div>
  )
}
