'use client';

import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { useState } from "react";

type DateRange = {
  filter: string;
  startDate: string;
  endDate: string;
};

interface DateFilterProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
}


export function DateFilter({ dateRange, onDateRangeChange }: DateFilterProps) {
  const [showCustomDate, setShowCustomDate] = useState(false);

  const filters = [
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: 'last7', label: 'This Week' },
    //  { id: 'thisWeek', label: 'This Week' },
    { id: 'thisMonth', label: 'This Month' },
    { id: 'thisYear', label: 'This Year' },
    { id: 'custom', label: 'Custom' },
  ];

  const handleFilterClick = (filterId: string) => {
    const now = new Date();
    let startDate = '';
    let endDate = '';

    if (filterId === 'today') {
      startDate = now.toISOString().split('T')[0];
      endDate = now.toISOString().split('T')[0];
    } else if (filterId === 'yesterday') {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      startDate = yesterday.toISOString().split('T')[0];
      endDate = yesterday.toISOString().split('T')[0];
    } else if (filterId === 'thisWeek') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startDate = startOfWeek.toISOString().split('T')[0];
      endDate = now.toISOString().split('T')[0];
    } else if (filterId === 'thisMonth') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      endDate = now.toISOString().split('T')[0];
    } else if (filterId === 'thisYear') {
      startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
      endDate = now.toISOString().split('T')[0];
    } else if (filterId === 'custom') {
      setShowCustomDate(true);
      return;
    }

    onDateRangeChange({
      filter: filterId,
      startDate,
      endDate,
    });

    if (filterId !== 'custom') {
      setShowCustomDate(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <Button
            key={filter.id}
            variant={dateRange.filter === filter.id ? "default" : "secondary"}
            size="sm"
            onClick={() => handleFilterClick(filter.id)}
            className={dateRange.filter === filter.id ? "bg-gray-900 text-white" : ""}
          >
            <Calendar className="h-4 w-4 mr-2" />
            {filter.label}
          </Button>
        ))}
      </div>

      {showCustomDate && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => onDateRangeChange({
                ...dateRange,
                startDate: e.target.value,
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => onDateRangeChange({
                ...dateRange,
                endDate: e.target.value,
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          
          <div className="flex items-end">
            <Button
              onClick={() => setShowCustomDate(false)}
              className="w-full bg-gray-900 text-white"
            >
              Apply Custom Date
            </Button>
          </div>
        </div>
      )}

      {dateRange.filter === 'custom' && !showCustomDate && (
        <div className="text-sm text-gray-600">
          Showing data from {dateRange.startDate} to {dateRange.endDate}
        </div>
      )}
    </div>
  );
}