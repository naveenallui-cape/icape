"use client";

import { useState } from "react";
import { Check, Copy, MessageCircle } from "lucide-react";
import {
  WHATSAPP_APP_HREF,
  WHATSAPP_NUMBER,
} from "@/lib/registration-announcement";

export function WhatsAppContactActions() {
  const [copied, setCopied] = useState(false);

  async function copyNumber() {
    try {
      await navigator.clipboard.writeText(WHATSAPP_NUMBER);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <a
        href={WHATSAPP_APP_HREF}
        className="inline-flex items-center gap-1.5 font-bold text-red-800 underline underline-offset-2 hover:text-red-900"
      >
        <MessageCircle className="size-4 shrink-0" aria-hidden />
        {WHATSAPP_NUMBER}
      </a>
      <button
        type="button"
        onClick={() => void copyNumber()}
        className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-white px-2 py-1 text-xs font-semibold text-red-800 hover:bg-red-50"
        aria-label="Copy WhatsApp number"
      >
        {copied ? (
          <>
            <Check className="size-3.5" aria-hidden />
            Copied
          </>
        ) : (
          <>
            <Copy className="size-3.5" aria-hidden />
            Copy
          </>
        )}
      </button>
    </div>
  );
}
