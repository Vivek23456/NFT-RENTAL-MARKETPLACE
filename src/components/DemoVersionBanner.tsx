import { Info, Github } from 'lucide-react';
import { GITHUB_REPO_URL } from '@/lib/github';

/** Global headline: this build is for demonstration only. */
const DemoVersionBanner = () => (
  <div
    role="status"
    className="sticky top-0 z-[100] border-b border-primary/30 bg-primary/15 px-4 py-3 text-center backdrop-blur-sm"
  >
    <p className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-2 text-sm font-bold tracking-tight text-foreground md:text-base">
      <Info className="h-4 w-4 shrink-0 text-primary md:h-5 md:w-5" aria-hidden />
      <span>This is just a demo version</span>
      <a
        href={GITHUB_REPO_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-full border border-primary/35 bg-background/60 px-3 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/10 hover:text-foreground md:text-sm"
      >
        <Github className="h-3.5 w-3.5 md:h-4 md:w-4" aria-hidden />
        GitHub
      </a>
    </p>
    <p className="mt-1 text-xs text-muted-foreground md:text-sm">
      Explore listings are illustrative. On-chain actions use devnet and your own wallets at your own risk.
    </p>
  </div>
);

export default DemoVersionBanner;
