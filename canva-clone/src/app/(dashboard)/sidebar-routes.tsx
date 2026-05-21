"use client";

import { CreditCard, Home, MessageCircleQuestion } from "lucide-react";
import { usePathname } from "next/navigation";

import { useBilling } from "@/features/subscriptions/api/use-billing";
import { useLanguage } from "@/contexts/language-context";
import { Separator } from "@/components/ui/separator";
import { SidebarItem } from "./sidebar-item";

export const SidebarRoutes = () => {
  const billingMutation = useBilling();
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <div className="flex flex-col gap-y-4 flex-1">
      <ul className="flex flex-col gap-y-1 px-3">
        <SidebarItem href="/" icon={Home} label={t.home} isActive={pathname === "/"} />
      </ul>
      <div className="px-3">
        <Separator />
      </div>
      <ul className="flex flex-col gap-y-1 px-3">
        <SidebarItem href={pathname} icon={CreditCard} label={t.billing} onClick={() => billingMutation.mutate()} />
        <SidebarItem
          href="mailto:support@example.com"
          icon={MessageCircleQuestion}
          label={t.getHelp}
        />
      </ul>
    </div>
  );
};
