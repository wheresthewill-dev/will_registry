export const VARIANT_STYLES = {
  SUCCESS:
    "bg-emerald-500/10 border-emerald-600/50 text-emerald-600 hover:text-emerald-600 dark:border-emerald-600 [&>svg]:text-emerald-600 hover:bg-emerald-500/10",
  DEFAULT: "bg-card text-card-foreground hover:text-card-foreground",
  DESTRUCTIVE:
    "bg-destructive/10 border-destructive/50 text-destructive hover:text-destructive [&>svg]:text-current *:data-[slot=alert-description]:text-destructive/90 hover:bg-destructive/20",
  WARNING:
    "bg-amber-50 border-amber-200 text-amber-800 hover:text-amber-800 *:data-[slot=alert-description]:text-amber-800 hover:bg-amber-50",
  SECONDARY:
    "bg-gray-400/50 border-gray-500/50 text-gray-700 hover:text-gray-700 [&>svg]:text-gray-700",
  INFO: "bg-blue-50 border-blue-200 text-blue-800 hover:text-blue-800 [&>svg]:text-blue-600 hover:bg-blue-50 *:data-[slot=alert-description]:text-blue-700",
} as const;
