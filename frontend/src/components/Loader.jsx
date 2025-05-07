import { useLoading } from '../context/LoadingContext';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const Loader = () => {
  const { isLoading, loadingMessage, hideLoader } = useLoading();
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  // No mostrar loader en la página de inicio
  useEffect(() => {
    if (isHomePage && isLoading) {
      hideLoader();
    }
  }, [isHomePage, isLoading, hideLoader]);

  // No mostrar nada si no hay carga o estamos en la página de inicio
  if (!isLoading || isHomePage) return null;

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 z-50">
      <div className="flex flex-col items-center bg-white p-8 rounded-lg shadow-xl">
        <div className="w-16 h-16 mb-4">
          <svg
            className="animate-spin w-full h-full text-blue-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          {loadingMessage}
        </h3>
        <div className="flex space-x-2 mt-3">
          <div className="w-3 h-3 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-3 h-3 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-3 h-3 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
};

export default Loader; 