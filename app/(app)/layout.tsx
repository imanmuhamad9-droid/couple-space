import { TabBar } from '@/components/TabBar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-dvh max-w-[430px] pb-[calc(150px+env(safe-area-inset-bottom))]">
      {children}
      <TabBar />
    </div>
  )
}
