'use client';

import Link from 'next/link';
import { use, useState, Suspense, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Home, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { signOut } from '@/app/(login)/actions';
import { useRouter } from 'next/navigation';
import { User } from '@/lib/db/schema';
import useSWR, { mutate } from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function UserMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { data: user } = useSWR<User>('/api/user', fetcher);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  async function handleSignOut() {
    await signOut();
    mutate('/api/user');
    router.push('/');
  }

  if (!user) {
    return (
      <>
        <Link
          href="/pricing"
          className="text-sm font-medium text-white hover:text-gray-200"
        >
          Pricing
        </Link>
        <Button asChild className="rounded-full bg-white text-[#001b3d] hover:bg-gray-100" variant="default">
          <Link href="/sign-in">Sign In</Link>
        </Button>
        <Button asChild className="rounded-full px-6 bg-[#fbae36] text-white hover:bg-[#d69225]" variant="accent">
          <Link href="/sign-up">Sign Up</Link>
        </Button>
      </>
    );
  }

  // Generate initials from name or email
  const getInitials = () => {
    if (user.name) {
      const nameParts = user.name.trim().split(' ');
      if (nameParts.length >= 2) {
        return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
      }
      return user.name.substring(0, 2).toUpperCase();
    }
    // Fallback to email: use first letter before @ and first letter after @
    const emailParts = user.email.split('@');
    return (emailParts[0][0] + (emailParts[1]?.[0] || emailParts[0][1] || '')).toUpperCase();
  };

  if (!isClient) {
    return (
      <button className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#001b3d] rounded-full">
        <Avatar className="size-9 ring-2 ring-white/20 hover:ring-white/40 transition-all">
          <AvatarImage alt={user.name || user.email} />
          <AvatarFallback className="bg-[#fbae36] text-[#001b3d] font-semibold text-sm">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
      </button>
    );
  }

  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <DropdownMenuTrigger asChild>
        <button className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#001b3d] rounded-full">
          <Avatar className="size-9 ring-2 ring-white/20 hover:ring-white/40 transition-all">
            <AvatarImage alt={user.name || user.email} />
            <AvatarFallback className="bg-[#fbae36] text-[#001b3d] font-semibold text-sm">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="flex flex-col gap-1">
        <DropdownMenuItem className="cursor-pointer">
          <Link href="/dashboard" className="flex w-full items-center">
            <Home className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </Link>
        </DropdownMenuItem>
        <form action={handleSignOut} className="w-full">
          <button type="submit" className="flex w-full">
            <DropdownMenuItem className="w-full flex-1 cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Header() {
  return (
    <header className="bg-[#001b3d] border-b border-[#001b3d]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center">
          <span className="text-3xl font-semibold text-[#fbae36]">TeacherTab</span>
        </Link>
        <div className="flex items-center space-x-4">
          <Suspense fallback={<div className="h-9" />}>
            <UserMenu />
          </Suspense>
        </div>
      </div>
    </header>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboardPage = pathname?.startsWith('/dashboard');
  
  return (
    <section className="flex flex-col min-h-screen">
      {!isDashboardPage && <Header />}
      {children}
    </section>
  );
}
