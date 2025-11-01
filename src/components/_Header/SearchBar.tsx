import { Search, Mic } from "lucide-react";

interface SearchBarProps {
  onSearch?: (query: string) => void;
}

const SearchBar = ({ onSearch = () => {} }: SearchBarProps) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const input = form.elements.namedItem("search") as HTMLInputElement;
    onSearch(input.value);
  };

  return (
    <div className="flex items-center gap-4 max-w-[640px] w-full bg-transparent">
      <form onSubmit={handleSubmit} className="flex flex-1 items-center">
        <div className="flex flex-1 items-center border border-gray-600 rounded-l-sm bg-gray-800 hover:border-blue-400 focus-within:border-blue-400">
          <input
            type="text"
            name="search"
            placeholder="Search"
            className="w-full py-2 px-4 text-base outline-none bg-transparent text-white"
            defaultValue=""
          />
        </div>
        <button
          type="submit"
          className="h-full px-6 py-2 bg-gray-700 border border-l-0 border-gray-600 rounded-r-sm hover:bg-gray-600"
          aria-label="Search"
        >
          <Search className="w-5 h-5 text-gray-300" />
        </button>
      </form>

      <button
        className="p-2 hover:bg-gray-700 rounded-full"
        aria-label="Search with voice"
      >
        <Mic className="w-5 h-5 text-gray-600" />
      </button>
    </div>
  );
};

export default SearchBar;
