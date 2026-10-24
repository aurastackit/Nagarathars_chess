import { WhatsAppIcon } from "@/components/icons/misc";
import { whatsappLink } from "@/data/contact";

/** Opens a WhatsApp chat with the organisers in a new tab, the message prefilled. */
export function WhatsAppButton({
  text,
  children = "Chat on WhatsApp",
  className = "",
}: {
  text: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      href={whatsappLink(text)}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 rounded-md bg-[#1f7a4d] px-5 py-2.5 font-semibold text-white shadow-sm transition-colors hover:bg-[#18643f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f7a4d] ${className}`}
    >
      <WhatsAppIcon className="h-5 w-5 flex-none" aria-hidden="true" />
      {children}
      <span className="sr-only"> (opens WhatsApp in a new tab)</span>
    </a>
  );
}
