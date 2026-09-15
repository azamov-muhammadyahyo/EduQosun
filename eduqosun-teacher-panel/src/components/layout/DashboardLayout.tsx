import { useState } from "react";
import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

interface DashboardLayoutProps {
    currentPage: string;
    onNavigate: (id: string) => void;
    children: ReactNode;
}

/** Umumiy sahifa tuzilishi: fixed sidebar + topbar + asosiy kontent (§6) */
export function DashboardLayout({
    currentPage,
    onNavigate,
    children,
}: DashboardLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
            <Sidebar
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                currentPage={currentPage}
                onNavigate={(id) => {
                    onNavigate(id);
                    setSidebarOpen(false);
                }}
            />

            <div className="lg:pl-64">
                <Topbar onMenuClick={() => setSidebarOpen(true)} />
                <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
