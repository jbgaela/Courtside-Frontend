import { AppShell } from '@/components/layout/app-shell';

export default function ManageLayout({ children }: { children: React.ReactNode }) {
  return <AppShell mode="manage">{children}</AppShell>;
}
