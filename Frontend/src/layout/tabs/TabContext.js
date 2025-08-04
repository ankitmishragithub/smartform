import React, { createContext, useContext, useState, useCallback } from 'react';

const TabContext = createContext();

export const useTabLayout = () => {
  const context = useContext(TabContext);
  if (!context) {
    throw new Error('useTabLayout must be used within a TabProvider');
  }
  return context;
};

export const TabProvider = ({ children }) => {
  const [tabs, setTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [showTabs, setShowTabs] = useState(false);

  const setLayoutTabs = useCallback((newTabs, defaultTab = 0) => {
    setTabs(newTabs);
    setActiveTab(defaultTab);
    setShowTabs(newTabs.length > 0);
  }, []);

  const hideTabs = useCallback(() => {
    setShowTabs(false);
    setTabs([]);
  }, []);

  const switchTab = useCallback((tabIndex) => {
    if (tabIndex >= 0 && tabIndex < tabs.length) {
      setActiveTab(tabIndex);
    }
  }, [tabs.length]);

  const value = {
    tabs,
    activeTab,
    showTabs,
    setLayoutTabs,
    hideTabs,
    switchTab
  };

  return (
    <TabContext.Provider value={value}>
      {children}
    </TabContext.Provider>
  );
}; 