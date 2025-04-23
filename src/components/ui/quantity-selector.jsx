import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Minus, Plus } from 'lucide-react';

function QuantitySelector({ value, onChange, min = 1, max = 10 }) {
  const handleDecrease = () => {
    if (value > min) onChange(value - 1);
  };

  const handleIncrease = () => {
    if (value < max) onChange(value + 1);
  };

  return (
    <div className="flex items-center gap-2">
      <Button type="button" size="icon" variant="outline" onClick={handleDecrease}>
        <Minus className="w-4 h-4" />
      </Button>

      <Input
        className="w-16 text-center"
        type="number"
        value={value}
        onChange={(e) => {
          const val = parseInt(e.target.value);
          if (!isNaN(val) && val >= min && val <= max) {
            onChange(val);
          }
        }}
        min={min}
        max={max}
      />

      <Button type="button" size="icon" variant="outline" onClick={handleIncrease}>
        <Plus className="w-4 h-4" />
      </Button>
    </div>
  );
}

export {QuantitySelector};
