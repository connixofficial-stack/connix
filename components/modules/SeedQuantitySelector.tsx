/**
 * Seed Quantity Selector Component
 * 
 * Allows users to select quantity for seeding (5/10/50/100 or custom)
 */

'use client';

import React, { useState } from 'react';
import {
  Button,
  Input,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/app/admin/components/ui';

interface SeedQuantitySelectorProps {
  defaultQuantity?: number;
  onQuantityChange: (quantity: number) => void;
  disabled?: boolean;
}

const PRESET_QUANTITIES = [5, 10, 50, 100];

export function SeedQuantitySelector({
  defaultQuantity = 10,
  onQuantityChange,
  disabled = false,
}: SeedQuantitySelectorProps) {
  const [selectedQty, setSelectedQty] = useState(defaultQuantity);
  const [customQty, setCustomQty] = useState(defaultQuantity);
  const [isCustomOpen, setIsCustomOpen] = useState(false);

  const handleSelectQuantity = (qty: number) => {
    setSelectedQty(qty);
    onQuantityChange(qty);
  };

  const handleApplyCustom = () => {
    if (customQty > 0 && customQty <= 10000) {
      setSelectedQty(customQty);
      onQuantityChange(customQty);
      setIsCustomOpen(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Label className="text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
        Số lượng:
      </Label>
      
      <div className="flex gap-1">
        {PRESET_QUANTITIES.map(qty => (
          <Button
            key={qty}
            variant={selectedQty === qty ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSelectQuantity(qty)}
            disabled={disabled}
            className="min-w-[50px]"
          >
            {qty}
          </Button>
        ))}
        
        <Popover open={isCustomOpen} onOpenChange={setIsCustomOpen}>
          <PopoverTrigger>
            <Button
              variant={!PRESET_QUANTITIES.includes(selectedQty) ? 'default' : 'outline'}
              size="sm"
              disabled={disabled}
              className="min-w-[70px]"
            >
              {!PRESET_QUANTITIES.includes(selectedQty) ? selectedQty : 'Custom'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" align="end">
            <div className="space-y-3">
              <div>
                <Label htmlFor="custom-qty" className="text-sm font-semibold">
                  Số lượng tùy chỉnh
                </Label>
                <p className="text-xs text-slate-500 mt-1">
                  Nhập từ 1 đến 10,000
                </p>
              </div>
              
              <Input
                id="custom-qty"
                type="number"
                min={1}
                max={10000}
                value={customQty}
                onChange={(e) => setCustomQty(parseInt(e.target.value) || 0)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleApplyCustom();
                  }
                }}
                placeholder="Nhập số lượng"
              />
              
              <Button 
                className="w-full" 
                onClick={handleApplyCustom}
                disabled={customQty <= 0 || customQty > 10000}
              >
                Áp dụng
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
