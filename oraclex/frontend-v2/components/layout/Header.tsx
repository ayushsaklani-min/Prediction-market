'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  Wallet, 
  PlusCircle, 
  Vote, 
  BarChart3,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { CHAIN_CONFIG } from '@/config/contracts';
import { getTargetNetworkName } from '@/lib/network';

const ConnectButton = dynamic(
  () => import('@rainbow-me/rainbowkit').then((mod) => mod.ConnectButton),
  { ssr: false }
);

const navigation = [
  { name: 'Markets', href: '/', icon: TrendingUp },
  { name: 'Portfolio', href: '/portfolio', icon: Wallet },
  { name: 'Create', href: '/create', icon: PlusCircle },
  { name: 'Governance', href: '/governance', icon: Vote },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
];

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const networkName = getTargetNetworkName(CHAIN_CONFIG.chainId);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-white/95 shadow-sm backdrop-blur">
      <nav className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <TrendingUp className="h-5 w-5" />
          </div>
          <span className="text-xl font-extrabold tracking-tight">OracleX</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex md:items-center md:space-x-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'gap-2 rounded-xl',
                    isActive && 'bg-secondary text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Button>
              </Link>
            );
          })}
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-2">
          <span className="hidden rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground sm:inline-flex">
            {networkName}
          </span>
          <div className="hidden md:block">
            <ConnectButton />
          </div>
          
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="border-t md:hidden">
          <div className="container space-y-1 py-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    className="w-full justify-start gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Button>
                </Link>
              );
            })}
            
            <div className="pt-4">
              <ConnectButton />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
