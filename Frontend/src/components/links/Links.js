import React from "react";
import Icon from "../icon/Icon";
import classNames from "classnames";
import { Link } from "react-router-dom";

export const LinkItem = ({ ...props }) => {
  // If onClick is provided, use it instead of link navigation
  if (props.onClick) {
    return (
      <li>
        <a href="#" onClick={(ev) => {
          ev.preventDefault();
          props.onClick();
        }}>
          {props.icon ? <Icon name={props.icon} /> : null} <span>{props.text || props.children}</span>
        </a>
      </li>
    );
  }

  // If link is provided, use React Router navigation
  if (props.link) {
    return (
      <li>
        <Link to={props.link} {...props}>
          {props.icon ? <Icon name={props.icon} /> : null} <span>{props.text || props.children}</span>
        </Link>
      </li>
    );
  }

  // Default fallback
  return (
    <li>
      <a href="#" onClick={(ev) => ev.preventDefault()}>
        {props.icon ? <Icon name={props.icon} /> : null} <span>{props.text || props.children}</span>
      </a>
    </li>
  );
};

export const LinkList = ({ ...props }) => {
  const listClasses = classNames({
    "link-list": !props.opt,
    "link-list-opt": props.opt,
    [`${props.className}`]: props.className,
  });
  return <ul className={listClasses}>{props.children}</ul>;
};
