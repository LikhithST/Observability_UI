import React from "react";
import { Link } from "react-router-dom";

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  to?: string;
  isActive?: boolean;
  onClick?: () => void;
}

const NavItem = ({
  icon: Icon,
  label,
  to,
  isActive = false,
  onClick,
}: NavItemProps) => {
  const commonClasses =
    "flex items-center gap-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors";
  const activeClasses = isActive? "bg-gray-200 dark:bg-gray-800 font-medium text-blue-500" : "";

  const content = (
    <>
      <Icon className="w-6 h-6" />
      {label && <span className="truncate">{label}</span>}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={`${commonClasses} ${activeClasses}`} onClick={onClick}>
        {content}
      </Link>
    );
  }

  return <button onClick={onClick} className={`${commonClasses} ${activeClasses} w-full`}>{content}</button>;
};

export default NavItem;