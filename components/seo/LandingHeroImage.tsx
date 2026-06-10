import Image from 'next/image';

interface LandingHeroImageProps {
  src: string;
  alt: string;
  variant?: 'card' | 'hero';
}

export default function LandingHeroImage({
  src,
  alt,
  variant = 'card',
}: LandingHeroImageProps): React.ReactElement {
  const isHero = variant === 'hero';

  return (
    <div
      className={isHero ? 'relative mb-8 h-64 w-full overflow-hidden rounded-lg' : 'relative mb-4 h-40 w-full overflow-hidden rounded'}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={isHero ? '(max-width: 1024px) 100vw, 896px' : '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}
        className="object-cover"
        priority={isHero}
        fetchPriority={isHero ? 'high' : undefined}
        unoptimized
      />
    </div>
  );
}
