import { SideNavigation } from "@bosch/react-frok";
import { useNavigate, useLocation } from "react-router-dom";

// Define page titles locally for simplicity
const pageTitles: Record<string, string> = {
  "/": "Workspace",
  "/dashboard": "Dashboard",
};

const SideBar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Simplified map to find the selected item based on current path
  const routeToValueMap: Record<string, string> = {
    "/": "Workspace",
    "/dashboard": "Dashboard",
  };
  
  const selectedItem = routeToValueMap[location.pathname] || "Workspace";

  // Simplified list of sidebar items
  const sidebarItems = [
    {
      icon: "panel-control",
      label: pageTitles["/"],
      value: "Workspace",
      link: {
        as: "button",
        onClick: () => navigate("/"),
      },
    },
    {
      icon: "desktop-dashboard",
      label: pageTitles["/dashboard"],
      value: "Dashboard",
      link: {
        as: "button",
        onClick: () => navigate("/dashboard"),
      },
    },
    {
      icon: "logout",
      label: "Logout",
      value: "Logout",
      link: {
        as: "button",
        onClick: () => {
            console.log("Logout clicked from sidebar");
            alert("Logout functionality would be here.");
        },
      },
    },
  ];

  return (
    <SideNavigation
      body={{
        menuItems: sidebarItems,
      }}
      defaultSelectedItem="Workspace"
      selectedItem={selectedItem}
      header={{
        label: "vHub",
      }}
    />
  );
};

export default SideBar;