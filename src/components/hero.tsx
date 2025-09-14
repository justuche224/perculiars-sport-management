import { Button } from "@/components/ui/button"
import Image from "next/image"
import { Card, CardHeader,CardContent,CardDescription, CardTitle } from "./ui/card"
import { BarChart3, Bell, Calendar, LucideProps, Trophy } from "lucide-react"
import { ForwardRefExoticComponent, RefAttributes } from "react"
import Link from "next/link"

export function Hero() {
  const buttonNew = (
    <Button asChild className="rounded-full bg-lime-400 px-6 text-black hover:bg-lime-300">
      <Link href="public/schedule" target="_blank">
       Event Schedule
      </Link>
    </Button>
  )

  return (
    <section className="relative isolate overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-center py-14 sm:py-20">
          <div className="mb-5 flex items-center gap-2">
            <Image src="/icons/skitbit-white.svg" alt="Skitbit logo" width={32} height={32} className="h-8 w-8" />
            <p className="text-sm uppercase tracking-[0.25em] text-lime-300/80">skitbit</p>
          </div>
          <h1 className="mt-3 text-center text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
            <span className="block">Sports Competition</span>
            <span className="block text-lime-300 drop-shadow-[0_0_20px_rgba(132,204,22,0.35)]">Management</span>
            <span className="block">System</span>
          </h1>
          <div className="mt-6">{buttonNew}</div>

          {/* Phone grid mimic */}
          <div className="mt-10 grid w-full gap-4 grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {phoneData.map((p, i) => {
              const visibility = i <= 2 ? "block" : i === 3 ? "hidden md:block" : i === 4 ? "hidden xl:block" : "hidden"

              return (
                <div key={i} className={visibility}>
                  <PhoneCard title={p.title} sub={p.sub} Icon={p.icon} iconColor={p.iconColor} />
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

function PhoneCard({
  title = "8°",
  sub = "Clear night. Great for render farm runs.",
  Icon,
  iconColor,
}: {
  title?: string
  sub?: string
  Icon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>
  iconColor?: string
}) {
  return (
    <div className="relative rounded-[28px] glass-border bg-neutral-900 p-2">
      <div className="relative aspect-auto w-full overflow-hidden rounded-2xl">
          <Card className="text-center liquid-glass">
            <CardHeader>
              <Icon className={`h-12 w-12 ${iconColor} mx-auto mb-4`} />
              <CardTitle className="text-white">{title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-muted-foreground line-clamp-2">{sub}</CardDescription>
            </CardContent>
          </Card>
      </div>
    </div>
  )
}

const phoneData = [
  {
    title: "Participant Management",
    sub: "Register and manage participants across different houses and age groups.",
    icon: Trophy,
    iconColor: "text-blue-500",
  },
  {
    title: "Event Scheduling",
    sub: "Schedule sports events with precise timing and location management.",
    icon: Calendar,
    iconColor: "text-green-500",
  },
  {
    title: "Live Results",
    sub: "Record and display real-time results with automatic point calculations.",
    icon: Trophy,
    iconColor: "text-yellow-500",
  },
  {
    title: "House Standings",
    sub: "Track house performance with comprehensive leaderboards and analytics.",
    icon: BarChart3,
    iconColor: "text-purple-500",
  },
  {
    title: "Notifications",
    sub: "Get real-time updates on event schedules, results, and house standings.",
    icon: Bell,
    iconColor: "text-pink-500",
  },
]
