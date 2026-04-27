import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function VerifyPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-background px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="text-center">
        <div className="mb-4 text-6xl">📧</div>
        <h1 className="mb-2 text-2xl font-bold">Check your email</h1>
        <p className="text-muted-foreground">A magic sign-in link has been sent to your email address.</p>
      </div>
    </main>
  );
}
