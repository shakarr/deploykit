import { memo } from "react";

import { Sidebar } from "@layout/infrastructure/ui/components";

interface LayoutPropI {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutPropI> = memo(function Layout({
  children,
}) {
  return (
    <div className="min-h-screen bg-surface-0">
      <Sidebar />
      <main className="lg:ml-60 pt-14 lg:pt-0">
        <div className="p-4 md:p-6 max-w-7xl">{children}</div>
      </main>
    </div>
  );
});
