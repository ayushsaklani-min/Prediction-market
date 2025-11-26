'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MarketCategory } from '@/types';
import { getCategoryName, getCategoryColor } from '@/lib/utils';
import { X } from 'lucide-react';

interface MarketFiltersProps {
  selectedCategory: number | null;
  onCategoryChange: (category: number | null) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
}

const categories = [
  MarketCategory.Crypto,
  MarketCategory.Sports,
  MarketCategory.Politics,
  MarketCategory.Entertainment,
  MarketCategory.Science,
  MarketCategory.Other,
];

const statuses = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'closing', label: 'Closing Soon' },
  { value: 'settled', label: 'Settled' },
];

export function MarketFilters({
  selectedCategory,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
}: MarketFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Category Filter */}
      <div>
        <h3 className="mb-2 text-sm font-medium">Categories</h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Badge
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              className={`cursor-pointer ${
                selectedCategory === category ? getCategoryColor(category) : ''
              }`}
              onClick={() =>
                onCategoryChange(selectedCategory === category ? null : category)
              }
            >
              {getCategoryName(category)}
              {selectedCategory === category && (
                <X className="ml-1 h-3 w-3" />
              )}
            </Badge>
          ))}
        </div>
      </div>

      {/* Status Filter */}
      <div>
        <h3 className="mb-2 text-sm font-medium">Status</h3>
        <div className="flex flex-wrap gap-2">
          {statuses.map((status) => (
            <Button
              key={status.value}
              variant={selectedStatus === status.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => onStatusChange(status.value)}
            >
              {status.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
