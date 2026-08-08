import { Toaster as Sonner, type ToasterProps } from "sonner";

// The Make source pulled the theme from next-themes; this is a Vite SPA
// (no Next.js), so we fix the theme to light and style to the tokens.
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
