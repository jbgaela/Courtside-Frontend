import { AppShell } from '@/components/layout/app-shell';

export default function PlayerAppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell mode="player">{children}</AppShell>;
}
