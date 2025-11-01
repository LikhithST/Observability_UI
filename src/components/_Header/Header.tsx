import { useState } from "react";
import Logo from "./Logo";
import Sidebar from "./Sidebar";
// import SearchBar from "./SearchBar";
import UserControls from "./UserControls";

interface HeaderProps {
  onMenuClick?: () => void;
  onSearch?: (query: string) => void;
  onUploadClick?: () => void;
  onNotificationsClick?: () => void;
  onUserClick?: () => void;
  userAvatarUrl?: string;
  notificationCount?: number;
}

const Header = ({
  onMenuClick: onMenuClickProp = () => {},
  onSearch = () => {},
  onMenuClick = () => {},
  onUploadClick = () => {},
  onNotificationsClick = () => {},
  onUserClick = () => {},
  userAvatarUrl,
  notificationCount,
}: HeaderProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeItem, setActiveItem] = useState("Home");

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleNavItemClick = (item: string) => {
    setActiveItem(item);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-14 bg-gray-900 text-white border-b border-gray-700 z-50 px-4">
        <div className="flex items-center justify-between h-full max-w-[2000px] mx-auto">
          <Logo onMenuClick={toggleSidebar} />
          {/* <div className="flex-1 flex justify-center">
            <SearchBar onSearch={onSearch} />
          </div> */}
          <UserControls
            onUploadClick={onUploadClick}
            onNotificationsClick={onNotificationsClick}
            onUserClick={onUserClick}
            userAvatarUrl={userAvatarUrl}
            notificationCount={notificationCount}
          />
        </div>
      </header>
      <Sidebar isCollapsed={!isSidebarOpen} activeItem={activeItem} onNavItemClick={handleNavItemClick} />
    </>
  );
};

export default Header;
