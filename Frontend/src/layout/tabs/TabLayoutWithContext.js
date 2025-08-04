import React from "react";
import { Nav, NavItem, NavLink, TabContent, TabPane } from "reactstrap";
import classNames from "classnames";
import { useTabLayout } from "./TabContext";

const TabLayoutWithContext = ({ children, className = "" }) => {
  const { tabs, activeTab, showTabs, switchTab } = useTabLayout();

  if (!showTabs || tabs.length === 0) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={classNames("tab-layout", className)}>
      {/* Tab Navigation */}
      <div className="nk-tabs">
        <Nav tabs className="nav-tabs-s2">
          {tabs.map((tab, index) => (
            <NavItem key={tab.id || index}>
              <NavLink
                className={classNames({
                  active: activeTab === index,
                  disabled: tab.disabled
                })}
                onClick={() => !tab.disabled && switchTab(index)}
                style={{ cursor: tab.disabled ? 'not-allowed' : 'pointer' }}
              >
                {tab.icon && <i className={classNames(tab.icon, "me-1")}></i>}
                {tab.label}
                {tab.badge && (
                  <span className="badge badge-sm badge-outline ms-1">
                    {tab.badge}
                  </span>
                )}
              </NavLink>
            </NavItem>
          ))}
        </Nav>
      </div>

      {/* Tab Content */}
      <TabContent activeTab={activeTab} className="mt-3">
        {tabs.map((tab, index) => (
          <TabPane key={tab.id || index} tabId={index}>
            {activeTab === index && (
              <div className="tab-content-wrapper">
                {tab.content || children}
              </div>
            )}
          </TabPane>
        ))}
      </TabContent>
    </div>
  );
};

export default TabLayoutWithContext; 