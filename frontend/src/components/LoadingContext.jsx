import React, { createContext, useContext, useState } from 'react';
import LoadingOverlay from '../components/LoadingOverlay'; 

const LoadingContext = createContext();


export const useLoading = () => {
  return useContext(LoadingContext);
};

export function LoadingProvider({ children }) {
  const [isLoading, setIsLoading] = useState(false);


  const contextValue = {
    isLoading,
    startLoading: () => setIsLoading(true),
    stopLoading: () => setIsLoading(false),
  };

  return (
    <LoadingContext.Provider value={contextValue}>
      {children}
      {/* Conditionally render the overlay over the entire app */}
      {isLoading && <LoadingOverlay />} 
    </LoadingContext.Provider>
  );
}