import NavBar from "@/components/NavBar";
import { MeProvider } from "@/components/MeProvider";

export default function DashboardLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <MeProvider>
      <NavBar />
      <main className="min-h-screen bg-zinc-50 dark:bg-zinc-900">{children}</main>
    </MeProvider>
  );
}
