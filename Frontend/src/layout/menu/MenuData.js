const menu = [
  {
    //form-builder
    icon: "dashlite",
    text: "Create Form",
    link: "/formBuilder"
  },
  
  {
    icon: "card-view",
    text: "Forms",
    active: false,
    subMenu: [
      {
        text: "Folders",
        link: "/forms/folders",
      },
      // Future: could add "All Forms", "Recent", etc.
    ],
  },
  
  // {
  //   icon: "check-circle",
  //   text: "Submitted Forms",
  //   link: "/forms/manage",
  // },
  
  {
    icon: "card-view",
    text: "Reports",
    active: false,
    subMenu: [
      {
        text: "Form Analytics",
        link: "/reports/analytics",
      },
      {
        text: "Response Reports",
        link: "/reports/responses",
      },
      // {
      //   text: "Folder Reports",
      //   link: "/reports/folders",
      // },
          {
        text: "All Submissions",
        link: "/reports/submissions",
      },
      // {
      //   text: "Export Data",
      //   link: "/reports/export",
      // },
    ],
  },
 
];
export default menu;
