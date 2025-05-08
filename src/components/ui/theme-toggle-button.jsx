import { ThemeToggle } from "@/components/ui/theme-toggle";

export function ThemeToggleButton() {
  return (
    <div className="fixed top-4 right-4 z-50 bg-background/80 backdrop-blur-sm rounded-lg shadow-sm border">
      <ThemeToggle />
    </div>
  );
} 