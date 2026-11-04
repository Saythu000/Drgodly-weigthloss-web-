import Link from "next/link";

export function DrGodlyLogo({ href = "/" }: { href?: string }) {
  const content = (
    <span className="flex items-center gap-2">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0F2F2A] text-xl font-black leading-none text-[#F7FFF9] shadow-sm">
        DG
      </span>
      <span className="text-xl font-black tracking-tight text-zinc-950 dark:text-zinc-50">
        DrGodly
      </span>
    </span>
  );

  if (!href) {
    return <div aria-label="DrGodly">{content}</div>;
  }

  return (
    <Link href={href} aria-label="DrGodly home" className="shrink-0">
      {content}
    </Link>
  );
}
