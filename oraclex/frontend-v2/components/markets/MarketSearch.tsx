'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { debounce } from '@/lib/utils';
import { useCallback } from 'react';

interface MarketSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function MarketSearch({ value, onChange }: MarketSearchProps) {
  const debouncedChange = useCallback(
    debounce((val: string) => onChange(val), 300),
    [onChange]
  );

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search markets..."
        className="pl-10"
        defaultValue={value}
        onChange={(e) => debouncedChange(e.target.value)}
      />
    </div>
  );
}
