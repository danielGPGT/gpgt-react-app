import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Minus, Plus } from "lucide-react";

function QuantitySelector({ value, onChange, min = 1, max = 10 }) {
  const handleDecrease = () => {
    if (value > min) onChange(value - 1);
  };

  const handleIncrease = () => {
    if (value < max) onChange(value + 1);
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={handleDecrease}
        className="rounded-full border border-primary text-primary hover:bg-primary hover:text-white transition-all"
      >
        <Minus className="w-4 h-4" />
      </Button>

      <Input
        className="w-14 h-9 text-center text-base rounded-full border-primary focus-visible:ring-0 focus-visible:ring-offset-0"
        type="number"
        value={value}
        onChange={(e) => {
          const val = parseInt(e.target.value, 10);
          if (!isNaN(val) && val >= min && val <= max) {
            onChange(val);
          }
        }}
        min={min}
        max={max}
      />

      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={handleIncrease}
        className="rounded-full border border-primary text-primary hover:bg-primary hover:text-white transition-all"
      >
        <Plus className="w-4 h-4" />
      </Button>
    </div>
  );
}

export { QuantitySelector };
