import { TopMetricsBar } from "@/components/metrics/top-metrics-bar";
import { Sidebar } from "@/components/layout/sidebar";
import { KnowledgeSearch } from "@/components/search/knowledge-search";
import { Toaster } from "@/components/ui/toaster";

interface RootLayoutProps {
  children: React.ReactNode;
  topMetrics?: {
    title: string;
    value: string;
  }[];
  hideKnowledgeSearch?: boolean;
}

export function RootLayout({
  children,
  topMetrics,
  hideKnowledgeSearch,
}: RootLayoutProps) {
  return (
    <>
      {/* Background orbs in their own stacking context */}
      <div className="fixed inset-0 overflow-hidden isolate">
        {/* Left orb */}
        <div
          aria-hidden="true"
          className="absolute w-[500px] h-[500px] rounded-full blur-[100px] opacity-30 bg-[#74E0BB] left-32 top-32"
          style={{
            animation: "float2 20s ease-in-out infinite alternate",
            animationDelay: "-2.5s",
            zIndex: -9999,
            pointerEvents: "none",
            userSelect: "none",
            WebkitUserSelect: "none",
          }}
        />
        {/* Right orb */}
        <div
          aria-hidden="true"
          className="absolute w-[500px] h-[500px] rounded-full blur-[100px] opacity-30 bg-[#293AF9] right-32 bottom-32"
          style={{
            animation: "float2 20s ease-in-out infinite alternate",
            animationDelay: "-5s",
            zIndex: -9999,
            pointerEvents: "none",
            userSelect: "none",
            WebkitUserSelect: "none",
          }}
        />
      </div>

      {/* Main app layout in its own stacking context */}
      <div
        className="relative flex h-screen overflow-hidden isolate"
        style={{ zIndex: 1 }}
      >
        {/* Fixed sidebar */}
        <div className="fixed top-0 left-0 h-full z-50">
          <Sidebar />
        </div>

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden relative ml-[80px] z-20">
          {topMetrics && (
            <TopMetricsBar metrics={topMetrics} className="left-0" />
          )}
          <main className="flex-1 overflow-auto">
            <div className="p-4">{children}</div>
          </main>
          {!hideKnowledgeSearch && <KnowledgeSearch />}
        </div>
      </div>
      <Toaster />
    </>
  );
}
