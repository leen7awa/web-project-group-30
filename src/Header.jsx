import { useState, useEffect } from 'preact/hooks';
import { route } from 'preact-router';

const Header = ({ currentPage, onScrollToAllEvents }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('isDarkMode');
    return savedMode !== null ? JSON.parse(savedMode) : false;
  });

  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState('');

  useEffect(() => {
    const savedUsername = localStorage.getItem("loggedInUsername");
    if (savedUsername) {
      setLoggedIn(true);
      setUsername(savedUsername);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('isDarkMode', JSON.stringify(isDarkMode));
    toggleTheme(isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    toggleTheme(isDarkMode);
  }, []);

  const toggleTheme = (isDark) => {
    const htmlElement = document.documentElement;
    if (isDark) {
      htmlElement.classList.add('dark');
    } else {
      htmlElement.classList.remove('dark');
    }
  };

  const toggleLight = (event) => {
    const id = event.currentTarget.id;
    switch (id) {
      case 'light-mode':
        setIsDarkMode(false);
        break;
      case 'dark-mode':
        setIsDarkMode(true);
        break;
      default:
        alert('Unknown mode!');
        console.log(id);
        break;
    }
  };

  const logout = () => {
    localStorage.removeItem('loggedInUsername');
    setLoggedIn(false);
    route('/login');
  };

  return (
    <div className="bg-white dark:bg-slate-800 shadow-md fixed top-0 left-0 right-0 z-10">
      <div className="container mx-auto flex justify-between items-center p-4">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-blue-600">
            {currentPage === 'event' ? 'Event Calendar' : 'Virtual Event Platform'}
          </h1>
          {loggedIn && <p className="ml-4 text-gray-600 dark:text-gray-300">Logged in as: {username}</p>}
        </div>
        <nav className="ml-auto flex space-x-4 text-gray-700 hover:text-blue-600">
          {!loggedIn ? (
            <a href="./login" id="login-btn" className="text-gray-700 dark:text-blue-500 hover:text-blue-600">Login</a>
          ) : (
            <div className="flex items-center space-x-4">
              {currentPage === 'event' && (
                <button
                  onClick={onScrollToAllEvents}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-700 text-white font-bold rounded-md mr-2"
                >
                  All Events
                </button>
              )}
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-500 text-white rounded-md"
              >
                Logout
              </button>
            </div>
          )}
          <button
            id="light-mode"
            className="text-gray-700 hover:text-blue-600"
            onClick={toggleLight}
          >
            <img
              src="https://static-00.iconduck.com/assets.00/sun-symbol-emoji-2048x2048-wityey4r.png"
              className="h-6 w-6"
              alt="Light Mode"
            />
          </button>
          <button
            id="dark-mode"
            className="text-gray-700 hover:text-blue-600"
            onClick={toggleLight}
          >
            <img
              src="https://static.thenounproject.com/png/2712425-200.png"
              className="h-6 w-6"
              alt="Dark Mode"
            />
          </button>
        </nav>
      </div>
    </div>
  );
};

export default Header;
