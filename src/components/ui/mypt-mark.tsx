import { cn } from "@/lib/utils";

/**
 * MyPT. wordmark icon — uses /mypt.svg with theme-aware inversion.
 * - Light mode: invert (black wordmark)
 * - Dark mode: original (white wordmark)
 *
 * Note: it's a wide wordmark (aspect ≈ 2.82). Use `h-*` and let width auto.
 */
export function MyptMark({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/mypt.svg"
      alt=""
      aria-hidden
      className={cn(
        "object-contain invert dark:invert-0",
        className,
      )}
    />
  );
}
