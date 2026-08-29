import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../features/auth/AuthContext.js";
import { listNotifications } from "../features/social/api.js";
import { UserMenu } from "./UserMenu.js";
import { Logo } from "./Logo.js";

const linkCls = "text-sm text-neutral-300 transition-colors duration-200 hover:text-white";

export function Navbar() {
  const { user } = useAuth();

  const { data: notif } = useQuery({
    queryKey: ["notifications"],
    queryFn: listNotifications,
    enabled: !!user,
    refetchInterval: 30000,
  });
  const unread = notif?.unreadCount ?? 0;

  return (
    <header className="border-b border-neutral-800">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="transition-opacity hover:opacity-80">
          <Logo />
        </Link>

        <nav className="flex items-center gap-4">
          <Link to="/" className={linkCls}>
            Carte
          </Link>
          <Link to="/recherche" className={linkCls}>
            Artistes
          </Link>

          {user && (
            <Link to="/notifications" className="relative text-lg leading-none" title="Notifications">
              🔔
              {unread > 0 && (
                <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-fuchsia-500 px-1 text-[10px] font-bold text-white">
                  {unread}
                </span>
              )}
            </Link>
          )}

          <UserMenu />
        </nav>
      </div>
    </header>
  );
}
