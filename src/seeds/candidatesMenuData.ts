const candidateMenus = [
  {
    id: 1,
    name: "Dashboard",
    icon: "la-home",
    routePath: "/candidates-dashboard/dashboard",
    active: "active",
    key:"dashbord",
    permissions: ["view", "edit", "delete", "meeting", "export", "import", "reject", "approve","download"]
  },
  {
    id: 2,
    name: "My Profile",
    icon: "la-user-tie",
    key:"myprofile",
    routePath: "/candidates-dashboard/my-profile",
    active: "",
    permissions: ["view", "edit", "delete", "meeting", "export", "import", "reject", "approve","download"]
  },
  {
    id: 3,
    name: "My Resume",
    key:"myresume",
    icon: "la la-file-invoice",
    routePath: "/candidates-dashboard/my-resume",
    active: "",
    permissions: ["view", "edit", "delete", "meeting", "export", "import", "reject", "approve","download"]
  },
  {
    id: 4,
    name: "Applied Jobs",
    key:"appliedjobs",
    icon: "la-briefcase",
    routePath: "/candidates-dashboard/applied-jobs",
    active: "",
    permissions: ["view", "edit", "delete", "meeting", "export", "import", "reject", "approve","download"]
  },
  {
    id: 4,
    name: "Saved Jobs",
    key:"savedjobs",

    icon: "la-briefcase",
    routePath: "/candidates-dashboard/saved-jobs",
    active: "",
    permissions: ["view", "edit", "delete", "meeting", "export", "import", "reject", "approve","download"]
  },
  {
    id: 6,
    name: "Shortlisted Jobs",
    key:"shortlistjobs",
    icon: "la-bookmark-o",
    routePath: "/candidates-dashboard/short-listed-jobs",
    active: "",
    permissions: ["view", "edit", "delete", "meeting", "export", "import", "reject", "approve","download"]
  },
 
 
  {
    id: 12,
    name: "Delete Profile",
    key:"profiledelete",
    icon: "la-trash",
    routePath: "/",
    active: "",
    permissions: ["view", "edit", "delete", "meeting", "export", "import", "reject", "approve","download"]
  },
];
export default candidateMenus;
