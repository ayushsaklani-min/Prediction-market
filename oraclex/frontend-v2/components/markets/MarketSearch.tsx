'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface MarketSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function MarketSearch({ value, onChange }: MarketSearchProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search markets..."
        className="pl-10"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
