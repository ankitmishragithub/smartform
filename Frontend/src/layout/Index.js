import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./sidebar/Sidebar";
import Head from "./head/Head";
import Header from "./header/Header";
import Footer from "./footer/Footer";
import AppRoot from "./global/AppRoot";
import AppMain from "./global/AppMain";
import AppWrap from "./global/AppWrap";

const Layout = ({title, ...props}) => {
  return (
    <>
      <Head title={!title && 'Loading'} />
      <AppRoot>
        <AppMain>
          <Sidebar fixed />
          <AppWrap>
            <Header fixed />
            <div style={{ marginTop: '80px', padding: '20px' }}>
              <Outlet />
            </div>
            <Footer />
          </AppWrap>
        </AppMain>
      </AppRoot>
    </>
  );
};
export default Layout;
