import { UserIcon } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const items = [
  {
    title: "Kai Cenat",
    url: "#",
    icon: UserIcon,
  },
  {
    title: "Shadow Lord",
    url: "#",
    icon: UserIcon,
  },
  {
    title: "Random Channel",
    url: "#",
    icon: UserIcon,
  },
  {
    title: "Random Event",
    url: "#",
    icon: UserIcon,
  },
];

export function AppSidebar() {
  return (
    <Sidebar className="top-[var(--header-height)]">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Recommended</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <div className="rounded-full bg-sidebar-accent p-1">
                            <item.icon className="size-4" />
                          </div>
                          <span>{item.title}</span>
                        </div>
                        <div className="bg-destructive size-1 rounded-full"></div>
                      </div>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
