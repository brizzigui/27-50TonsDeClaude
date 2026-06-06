import { Loader2 } from "lucide-react";

const variants = {
  primary:
    "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/40",
  secondary:
    "bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm",
  ghost:
    "bg-transparent hover:bg-white/5 text-gray-300 hover:text-white",
  danger:
    "bg-red-600/80 hover:bg-red-700 text-white shadow-lg shadow-red-600/20",
};

const sizes = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3 text-base",
};

export default function Button({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  className = "",
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2
        font-semibold rounded-xl
        transition-all duration-200 ease-out
        focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-2 focus:ring-offset-gray-900
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none
        cursor-pointer
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}
