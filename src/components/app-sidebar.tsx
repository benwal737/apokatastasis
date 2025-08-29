import Image from "next/image";

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

import { getRecommendedRooms } from "@/lib/recommended";

export async function AppSidebar() {
  const rooms = await getRecommendedRooms();
  return (
    <Sidebar className="top-[var(--header-height)]">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Recommended</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {rooms.map((room) => (
                <SidebarMenuItem key={room.id}>
                  <SidebarMenuButton asChild>
                    <a href={`/room/${room.slug}`}>
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <Image
                            src={room.host.imageUrl}
                            alt={room.host.username}
                            className="size-5 rounded-full"
                            width={40}
                            height={40}
                          />
                          <span>{room.name}</span>
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
