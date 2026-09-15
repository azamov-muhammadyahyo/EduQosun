import { stats } from '../data/stats'
import { WelcomeBanner } from '../components/dashboard/WelcomeBanner'
import { StatCard } from '../components/dashboard/StatCard'
import { TodaySchedule } from '../components/dashboard/TodaySchedule'
import { QuickActions } from '../components/dashboard/QuickActions'
import { CalendarWidget } from '../components/dashboard/CalendarWidget'
import { MyGroups } from '../components/dashboard/MyGroups'
import { StudentActivity } from '../components/dashboard/StudentActivity'
import { Messages } from '../components/dashboard/Messages'
import { RecentLessons } from '../components/dashboard/RecentLessons'
import { UpcomingTasks } from '../components/dashboard/UpcomingTasks'
import { ActivityFeed } from '../components/dashboard/ActivityFeed'

/** Bosh sahifa (§6, §7) */
export function Dashboard() {
  return (
    <div className="animate-fade-in space-y-6">
      {/* Salomlashuv banneri + 4 stat karta — bitta qatorda (§6) */}
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-12 xl:items-stretch">
        <div className="xl:col-span-4">
          <WelcomeBanner />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 xl:col-span-8">
          {stats.map((stat) => (
            <StatCard key={stat.id} stat={stat} />
          ))}
        </div>
      </section>

      {/* Qator A: dars jadvali (keng) · tezkor amallar · kun taqvimi */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-6">
          <TodaySchedule />
        </div>
        <div className="col-span-12 md:col-span-6 lg:col-span-3">
          <QuickActions />
        </div>
        <div className="col-span-12 md:col-span-6 lg:col-span-3">
          <CalendarWidget />
        </div>
      </div>

      {/* Qator B: guruhlarim · o'quvchilar faoliyati · xabarlar */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 md:col-span-6 lg:col-span-5">
          <MyGroups />
        </div>
        <div className="col-span-12 md:col-span-6 lg:col-span-4">
          <StudentActivity />
        </div>
        <div className="col-span-12 md:col-span-12 lg:col-span-3">
          <Messages />
        </div>
      </div>

      {/* Qator C: oxirgi darslar · keyingi vazifalar · so'nggi faoliyat */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-5">
          <RecentLessons />
        </div>
        <div className="col-span-12 md:col-span-6 lg:col-span-4">
          <UpcomingTasks />
        </div>
        <div className="col-span-12 md:col-span-6 lg:col-span-3">
          <ActivityFeed />
        </div>
      </div>
    </div>
  )
}
