'use client'

import PageHeader from "@/shared/components/PageHeader";
import { useNavLanguage } from "@/features/site/lib/nav-language";

export default function FriendsClient() {
  const { dictionary } = useNavLanguage()

  return (
    <section className="mx-auto max-w-5xl px-4 pt-4 pb-12 sm:pt-6 sm:pb-16 sm:px-6 lg:px-8">
      <PageHeader
        title={dictionary.friends.title}
        meta={dictionary.friends.meta}
      />

      <div className="mt-20 flex flex-col items-center justify-center space-y-4 text-center">
        <div className="h-20 w-20 rounded-full bg-primary/5 flex items-center justify-center">
          <span className="text-3xl">🤝</span>
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold">{dictionary.friends.upgrading}</h3>
          <p className="max-w-md text-muted-foreground">
            {dictionary.friends.description}
          </p>
        </div>
      </div>
    </section>
  );
}
