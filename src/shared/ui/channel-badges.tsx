import Image from 'next/image';

import { CHANNEL_LABEL } from '@/shared/lib/labels';
import { cn } from '@/shared/lib/utils';

const TONE: Record<string, string> = {
  AVITO: 'bg-white text-zinc-800 border-zinc-200',
  XO_MARKET: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  YULA: 'bg-amber-50 text-amber-900 border-amber-200',
  OZON: 'bg-blue-50 text-blue-800 border-blue-200',
  WILDBERRIES: 'bg-violet-50 text-violet-800 border-violet-200',
  DROM: 'bg-orange-50 text-orange-800 border-orange-200',
};

const MARK: Record<string, string> = {
  AVITO: 'A',
  XO_MARKET: 'XO',
  YULA: 'Ю',
  OZON: 'Oz',
  WILDBERRIES: 'WB',
  DROM: 'Dr',
};

const ICONS: Record<string, string> = {
  AVITO: '/channels/avito.webp',
};

export function ChannelIcon({ channel, size = 20 }: { channel: string; size?: number }) {
  const src = ICONS[channel];
  if (src) {
    return (
      <Image
        src={src}
        alt={CHANNEL_LABEL[channel] ?? channel}
        width={size}
        height={size}
        unoptimized
        className="shrink-0 rounded-sm object-contain"
      />
    );
  }

  return (
    <span className="inline-flex h-4 min-w-4 items-center justify-center text-[10px] font-semibold tabular-nums">
      {MARK[channel] ?? channel.slice(0, 2)}
    </span>
  );
}

export function ChannelBadges({
  channels,
}: {
  channels: Array<{ channel: string; active?: boolean }>;
}) {
  if (channels.length === 0) {
    return <span className="text-xs text-zinc-400">Нет публикаций</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {channels.map((item) => (
        <span
          key={item.channel}
          title={CHANNEL_LABEL[item.channel] ?? item.channel}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium',
            TONE[item.channel] ?? 'bg-zinc-100 text-zinc-700 border-zinc-200',
            item.active === false && 'opacity-40',
          )}
        >
          <ChannelIcon channel={item.channel} />
          {CHANNEL_LABEL[item.channel] ?? item.channel}
        </span>
      ))}
    </div>
  );
}
