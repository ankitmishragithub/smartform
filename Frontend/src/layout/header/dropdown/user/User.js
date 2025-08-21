import React, { useState, useEffect } from "react";
import UserAvatar from "../../../../components/user/UserAvatar";
import { DropdownToggle, DropdownMenu, Dropdown } from "reactstrap";
import { Icon } from "../../../../components/Component";
import { LinkList, LinkItem } from "../../../../components/links/Links";
import { useTheme, useThemeUpdate } from "../../../provider/Theme";
import { useAuth } from "../../../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const User = () => {
  const theme = useTheme();
  const themeUpdate = useThemeUpdate();
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const toggle = () => setOpen((prevState) => !prevState);

  const handleLogout = () => {
    toggle(); // Close dropdown first
    logout(); // Clear auth state
    // Use setTimeout to ensure logout completes before navigation
    setTimeout(() => {
      navigate('/login');
    }, 100);
  };

  return (
    <Dropdown isOpen={open} className="user-dropdown" toggle={toggle}>
      <DropdownToggle
        tag="a"
        href="#toggle"
        className="dropdown-toggle"
        onClick={(ev) => {
          ev.preventDefault();
        }}
      >
        <div className="user-toggle">
          <UserAvatar icon="user-alt" className="sm" />
          <div className="user-info d-none d-md-block">
            <div className="user-status">Administrator</div>
            <div className="user-name dropdown-indicator">Smartfactory worx</div>
          </div>
        </div>
      </DropdownToggle>
      <DropdownMenu end className="dropdown-menu-md dropdown-menu-s1">
        <div className="dropdown-inner user-card-wrap bg-lighter d-none d-md-block">
          <div className="user-card sm">
            <div className="user-avatar">
              <span>{user?.username?.charAt(0).toUpperCase() || 'U'}</span>
            </div>
            <div className="user-info">
              <span className="lead-text">{user?.username || 'User'}</span>
              <span className="sub-text">{user?.email || 'user@example.com'}</span>
            </div>
          </div>
        </div>
        <div className="dropdown-inner">
          <LinkList>
            {isAdmin() && (
              <LinkItem link="/admin" icon="setting-alt" onClick={toggle}>
                Admin Panel
              </LinkItem>
            )}
            <LinkItem link="/user-profile-regular" icon="user-alt" onClick={toggle}>
              View Profile
            </LinkItem>
            <LinkItem link="/user-profile-setting" icon="setting-alt" onClick={toggle}>
              Account Setting
            </LinkItem>
          </LinkList>
        </div>
        <div className="dropdown-inner">
          <LinkList>
            <LinkItem onClick={handleLogout} icon="signout">
              Sign Out
            </LinkItem>
          </LinkList>
        </div>
      </DropdownMenu>
    </Dropdown>
  );
};

export default User;
