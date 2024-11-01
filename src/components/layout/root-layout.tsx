import { TopMetricsBar } from "@/components/metrics/top-metrics-bar"
import { Sidebar } from "@/components/layout/sidebar"
import { KnowledgeSearch } from "@/components/search/knowledge-search"

interface RootLayoutProps {
  children: React.ReactNode
  topMetrics: {
    title: string
    value: string
  }[]
}

export function RootLayout({ children, topMetrics }: RootLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <div className="hidden lg:flex lg:w-64 lg:flex-col">
        <Sidebar />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden relative">
        <TopMetricsBar metrics={topMetrics} className="left-0 lg:left-64" />
        <main className="flex-1 overflow-auto">
          <div className="floating-orb w-[600px] h-[600px] -left-64 top-32 fixed" />
          <div 
            className="floating-orb w-[500px] h-[500px] right-32 bottom-32 fixed" 
            style={{ animationDelay: '-5s' }}
          />
          <div className="container relative z-10 max-w-screen-2xl mx-auto px-4 pt-4 pb-24">
            {children}
          </div>
        </main>
        <KnowledgeSearch />
      </div>
    </div>
  )
}