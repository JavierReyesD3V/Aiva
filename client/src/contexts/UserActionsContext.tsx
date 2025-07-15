import { createContext, useContext, ReactNode, useState, useCallback } from 'react';

interface UserActionsContextType {
  onShowTradeForm?: () => void;
  onShowImportModal?: (mode: 'new' | 'change' | 'clear') => void;
  setUserActions: (actions: {
    onShowTradeForm?: () => void;
    onShowImportModal?: (mode: 'new' | 'change' | 'clear') => void;
  }) => void;
}

const UserActionsContext = createContext<UserActionsContextType>({
  setUserActions: () => {}
});

interface UserActionsProviderProps {
  children: ReactNode;
}

export function UserActionsProvider({ children }: UserActionsProviderProps) {
  const [actions, setActions] = useState<{
    onShowTradeForm?: () => void;
    onShowImportModal?: (mode: 'new' | 'change' | 'clear') => void;
  }>({});

  const setUserActions = useCallback((newActions: typeof actions) => {
    setActions(newActions);
  }, []);

  return (
    <UserActionsContext.Provider value={{ 
      ...actions, 
      setUserActions 
    }}>
      {children}
    </UserActionsContext.Provider>
  );
}

export const useUserActions = () => {
  return useContext(UserActionsContext);
};