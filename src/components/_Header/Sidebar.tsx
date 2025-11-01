import {
  HomeIcon,
  Compass,
  Clapperboard,
  PlaySquare,
  Library,
  History,
  PlayCircle,
  Clock,
  ThumbsUp,
  ChevronDown,
  Ship
} from "lucide-react";
import NavItem from "./NavItem";

interface SidebarProps {
  isCollapsed?: boolean;
  onNavItemClick?: (item: string) => void;
  activeItem?: string;
  onClose?: () => void;
}

const Sidebar = ({
  isCollapsed = false,
  onNavItemClick = () => {},
  activeItem = "Home",
  onClose = () => {},
}: SidebarProps) => {
  const mainNavItems = [
    { icon: Ship, label: "Home", to: "/" },
    // { icon: Compass, label: "Explore", to: "/explore" },
    // { icon: Clapperboard, label: "Shorts", to: "/shorts" },
    // { icon: PlaySquare, label: "Subscriptions", to: "/subscriptions" },
  ];

  const libraryNavItems = [
    { icon: Library, label: "Library", to: "/library" },
    { icon: History, label: "History", to: "/history" },
    { icon: PlayCircle, label: "Your Videos", to: "/channel/videos" },
    { icon: Clock, label: "Watch Later", to: "/playlist?list=WL" },
    { icon: ThumbsUp, label: "Liked Videos", to: "/playlist?list=LL" },
    {
      icon: ChevronDown,
      label: "Show More",
      onClick: () => console.log("Show more clicked"),
    },
  ];

  return (
    <aside
      className={`fixed left-0 top-14 h-[calc(100vh-56px)] bg-gray-900 text-white transition-all duration-300 overflow-y-auto ${isCollapsed ? "w-14" : "w-60"} z-40`}
    >
      <nav className="p-2 flex flex-col gap-1">
        {mainNavItems.map((item) => (
          <NavItem
            key={item.label}
            icon={item.icon}
            label={isCollapsed ? "" : item.label}
            to={item.to}
            isActive={activeItem === item.label}
            onClick={() => {
              onNavItemClick(item.label);
              if (window.innerWidth < 1024) {
                onClose();
              }
            }}
          />
        ))}

        {/* <div className="my-2 border-t border-gray-700" /> */}

        {/* {libraryNavItems.map((item) => (
          <NavItem
            key={item.label}
            icon={item.icon}
            label={isCollapsed ? "" : item.label}
            to={item.to}
            onClick={item.onClick || (() => onNavItemClick(item.label))}
            isActive={activeItem === item.label}
          />
        ))} */}

        {/* <div className="my-2 border-t border-gray-700" /> */}

        {!isCollapsed && (
          <div className="px-3">
            <h3 className="text-base font-medium mb-2">Subscriptions</h3>
            {/* Placeholder subscription items */}
            {Array.from({ length: 5 }).map((_, i) => (
              <NavItem
                key={`sub-${i}`}
                icon={() => (
                  <img
                    src={`https://dummyimage.com/24x24/666/fff&text=${i + 1}`}
                    alt={`Channel ${i + 1}`}
                    className="rounded-full"
                  />
                )}
                label={`Channel ${i + 1}`}
                to={`/channel/${i + 1}`}
              />
            ))}
          </div>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;
