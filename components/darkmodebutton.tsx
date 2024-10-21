import { DarkModeProvider, useDarkMode } from '@/components/DarkModeContext';
import { ArrowLeft, Moon, Sun } from 'lucide-react';

export default function Darkmodebutton(){
    const { isDarkMode, toggleDarkMode } = useDarkMode();
    return(
        <button
              onClick={toggleDarkMode}
              className="absolute top-0 right-0 p-2 rounded-full bg-gray-200 dark:bg-gray-700"
            >
              {isDarkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
            </button>

    )
}

