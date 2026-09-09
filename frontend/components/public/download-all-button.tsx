import { Download } from "lucide-react";

type DownloadAllButtonProps = {
  href: string;
  fileName: string;
  label?: string;
};

export function DownloadAllButton({
  href,
  fileName,
  label = "Download all",
}: DownloadAllButtonProps) {
  return (
    <a
      href={href}
      download={fileName}
      className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-brand shadow-sm transition hover:bg-accent-hover sm:px-5 sm:text-base"
    >
      <Download className="size-4 sm:size-5" aria-hidden />
      {label}
    </a>
  );
}
