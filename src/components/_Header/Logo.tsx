import { Menu } from "lucide-react";
import { Link } from "react-router-dom";

interface LogoProps {
  onMenuClick?: () => void;
}

const Logo = ({ onMenuClick = () => {} }: LogoProps) => {
  return (
    <div className="flex items-center gap-4 h-10 bg-transparent">
      <button
        onClick={onMenuClick}
        className="p-2 hover:bg-gray-700 rounded-full"
        aria-label="Menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      <Link to="/" className="flex items-center">
        <span className="text-xl font-semibold">Observability</span>
      </Link>
    </div>
  );
};

export default Logo;
