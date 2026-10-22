import { AIConnect } from "@/components/ai-connect";
import { localMode } from "@/lib/local-mode";
import { notFound } from "next/navigation";
export default function ConnectPage() {
  if (!localMode()) notFound();
  return <AIConnect />;
}
