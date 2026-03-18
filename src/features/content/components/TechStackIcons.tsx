import techStack from '@/config/tech-stack'

type TechStackIconsProps = {
  label?: string
}

export default function TechStackIcons({ label }: TechStackIconsProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {techStack.map((item) => (
        <div
          key={item.name}
          title={item.name}
          className="inline-flex h-9 w-9 items-center justify-center transition-transform duration-200 hover:-translate-y-0.5"
        >
          <img
            src={item.icon}
            alt={item.name}
            className="h-6 w-6 object-contain opacity-90 drop-shadow-[0_2px_6px_rgba(15,23,42,0.2)]"
          />
        </div>
      ))}
    </div>
  )
}
