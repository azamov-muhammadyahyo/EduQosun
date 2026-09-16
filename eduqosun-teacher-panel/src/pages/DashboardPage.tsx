import { useMemo, useState } from 'react'
import { CalendarDays, ClipboardList, GraduationCap, Users } from 'lucide-react'
import { addDays, dateKeyOfIso, startOfWeek } from '../lib/date'
import { assignmentProgress, assignmentRoster } from '../domain/assignments'
import { lessonPhase } from '../domain/lessons'
import { useActiveGroups, useLessonsOn, useStudents } from '../hooks/useData'
import { navigateTo } from '../router'
import { useApp } from '../store/appStore'
import { useClock } from '../store/clock'
import { ActivityFeed } from '../components/dashboard/ActivityFeed'
import { CalendarWidget } from '../components/dashboard/CalendarWidget'
import { Messages } from '../components/dashboard/Messages'
import { MyGroups } from '../components/dashboard/MyGroups'
import { QuickActions } from '../components/dashboard/QuickActions'
import { RecentLessons } from '../components/dashboard/RecentLessons'
import { StatCard } from '../components/dashboard/StatCard'
import { StudentActivity } from '../components/dashboard/StudentActivity'
import { TodaySchedule } from '../components/dashboard/TodaySchedule'
import { UpcomingTasks } from '../components/dashboard/UpcomingTasks'
import { WelcomeBanner } from '../components/dashboard/WelcomeBanner'

/** Bosh sahifa */
export function DashboardPage() {
  const { today, minutes } = useClock()
  const [selectedDate, setSelectedDate] = useState(today)
  const groups = useActiveGroups()
  const students = useStudents()
  const assignments = useApp((s) => s.assignments)
  const submissions = useApp((s) => s.submissions)
  const lessonsToday = useLessonsOn(today)

  const stats = useMemo(() => {
    const monthAgo = addDays(today, -30)
    const weekStart = startOfWeek(today)
    const active = students.filter((s) => s.status === 'active')
    const todays = lessonsToday.filter((l) => !l.canceled)
    const activeAssignments = assignments.filter((a) => a.status === 'active')
    const pending = activeAssignments.reduce(
      (sum, a) => sum + assignmentProgress(a, assignmentRoster(a, students), submissions[a.id]).pending,
      0,
    )
    return {
      groups: groups.length,
      newGroups: groups.filter((g) => dateKeyOfIso(g.createdAt) >= monthAgo).length,
      students: active.length,
      newStudents: active.filter((s) => s.joinedAt >= weekStart).length,
      lessons: todays.length,
      held: todays.filter((l) => lessonPhase(l, today, minutes) === 'held').length,
      assignments: activeAssignments.length,
      pending,
    }
  }, [groups, students, assignments, submissions, lessonsToday, today, minutes])

  return (
    <div className="animate-fade-in space-y-6">
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-12 xl:items-stretch">
        <div className="xl:col-span-4">
          <WelcomeBanner lessonsToday={stats.lessons} pendingReviews={stats.pending} />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 xl:col-span-8">
          <StatCard
            label="Jami guruhlar"
            value={stats.groups}
            icon={Users}
            color="blue"
            change={stats.newGroups > 0 ? `+${stats.newGroups} yangi` : 'Hammasi faol'}
            tone={stats.newGroups > 0 ? 'up' : 'neutral'}
            onClick={() => navigateTo('groups')}
          />
          <StatCard
            label="Jami o'quvchilar"
            value={stats.students}
            icon={GraduationCap}
            color="green"
            change={stats.newStudents > 0 ? `+${stats.newStudents} shu hafta` : "O'zgarish yo'q"}
            tone={stats.newStudents > 0 ? 'up' : 'neutral'}
            onClick={() => navigateTo('students')}
          />
          <StatCard
            label="Bugungi darslar"
            value={stats.lessons}
            icon={CalendarDays}
            color="violet"
            change={`${stats.held} ta o'tkazildi`}
            onClick={() => navigateTo('lessons')}
          />
          <StatCard
            label="Topshiriqlar"
            value={stats.assignments}
            icon={ClipboardList}
            color="amber"
            change={`${stats.pending} ta tekshirishda`}
            onClick={() => navigateTo('tasks', null, { status: 'review' })}
          />
        </div>
      </section>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-6">
          <TodaySchedule date={selectedDate} onDateChange={setSelectedDate} />
        </div>
        <div className="col-span-12 md:col-span-6 lg:col-span-3">
          <QuickActions />
        </div>
        <div className="col-span-12 md:col-span-6 lg:col-span-3">
          <CalendarWidget selected={selectedDate} onSelect={setSelectedDate} />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 md:col-span-6 lg:col-span-5">
          <MyGroups />
        </div>
        <div className="col-span-12 md:col-span-6 lg:col-span-4">
          <StudentActivity />
        </div>
        <div className="col-span-12 lg:col-span-3">
          <Messages />
        </div>
      </div>

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
