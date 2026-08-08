import { cn } from "../ui/utils";

// Simple ImageWithFallback component matching Figma design
interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt: string;
}

export function ImageWithFallback({ src, alt, className, ...props }: ImageWithFallbackProps) {
  return (
    <img
      src={src || "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=300&fit=crop"}
      alt={alt}
      className={cn("object-cover", className)}
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.src = "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=300&fit=crop";
      }}
      {...props}
    />
  );
}
