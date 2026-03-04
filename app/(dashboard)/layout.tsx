import NavBar from "@/components/NavBar";

export default function DashboardLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <>
      <NavBar />
      <main className="min-h-screen bg-zinc-50 dark:bg-zinc-900">{children}</main>
    </>
  );
}
