import { Video, Bell, User } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";

interface UserControlsProps {
  onUploadClick?: () => void;
  onNotificationsClick?: () => void;
  onUserClick?: () => void;
  userAvatarUrl?: string;
  notificationCount?: number;
}

const UserControls = ({
  onUploadClick = () => {},
  onNotificationsClick = () => {},
  onUserClick = () => {},
  userAvatarUrl = "../../../images/user.png",
  notificationCount = 3,
}: UserControlsProps) => {
  return (
    <div className="flex items-center gap-2 h-10 bg-transparent">
      {/* <button
        onClick={onUploadClick}
        className="p-2 hover:bg-gray-700 rounded-full"
        aria-label="Create"
      >
        <Video className="w-6 h-6" />
      </button>

      <div className="relative">
        <button
          onClick={onNotificationsClick}
          className="p-2 hover:bg-gray-700 rounded-full"
          aria-label="Notifications"
        >
          <Bell className="w-6 h-6" />
          {notificationCount > 0 && (
            <span className="absolute top-1 right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {notificationCount}
            </span>
          )}
        </button>
      </div> */}

      <button
        onClick={onUserClick}
        className="p-1 hover:bg-gray-700 rounded-full"
        aria-label="Account"
      >
        {userAvatarUrl ? (
          <Avatar className="w-8 h-8">
            <img
              src={userAvatarUrl}
              alt="User avatar"
              className="w-full h-full object-cover rounded-full"
            />
          </Avatar>
        ) : (
          <User className="w-6 h-6" />
        )}
      </button>
    </div>
  );
};

export default UserControls;
