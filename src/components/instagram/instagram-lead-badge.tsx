import { Badge } from '@/components/ui/badge';
import { Instagram, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InstagramLeadBadgeProps {
  source: 'instagram_comment' | 'instagram_dm';
  className?: string;
}

export function InstagramLeadBadge({ source, className }: InstagramLeadBadgeProps) {
  const config = {
    instagram_comment: {
      label: 'Instagram Comment',
      icon: Instagram,
      variant: 'default' as const,
      className: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
    },
    instagram_dm: {
      label: 'Instagram DM',
      icon: MessageCircle,
      variant: 'secondary' as const,
      className: 'bg-gradient-to-r from-pink-500 to-rose-500 text-white',
    },
  };

  const { label, icon: Icon, className: badgeClassName } = config[source];

  return (
    <Badge className={cn(badgeClassName, className)}>
      <Icon className="w-3 h-3 mr-1" />
      {label}
    </Badge>
  );
}
