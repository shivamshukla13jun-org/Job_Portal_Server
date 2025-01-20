const candidateMenus = [
  {
    id: 1,
    name: "Dashboard",
    icon: "la-home",
    routePath: "/candidates-dashboard/dashboard",
    active: "active",
    permissions: ["view", "edit", "delete", "meeting", "export", "import", "reject", "approve","download"]
  },
  {
    id: 2,
    name: "My Profile",
    icon: "la-user-tie",
    routePath: "/candidates-dashboard/my-profile",
    active: "",
    permissions: ["view", "edit", "delete", "meeting", "export", "import", "reject", "approve","download"]
  },
  {
    id: 3,
    name: "My Resume",
    icon: "la la-file-invoice",
    routePath: "/candidates-dashboard/my-resume",
    active: "",
    permissions: ["view", "edit", "delete", "meeting", "export", "import", "reject", "approve","download"]
  },
  {
    id: 4,
    name: "Applied Jobs",
    icon: "la-briefcase",
    routePath: "/candidates-dashboard/applied-jobs",
    active: "",
    permissions: ["view", "edit", "delete", "meeting", "export", "import", "reject", "approve","download"]
  },
  {
    id: 4,
    name: "Saved Jobs",
    icon: "la-briefcase",
    routePath: "/candidates-dashboard/saved-jobs",
    active: "",
    permissions: ["view", "edit", "delete", "meeting", "export", "import", "reject", "approve","download"]
  },
  {
    id: 6,
    name: "Shortlisted Jobs",
    icon: "la-bookmark-o",
    routePath: "/candidates-dashboard/short-listed-jobs",
    active: "",
    permissions: ["view", "edit", "delete", "meeting", "export", "import", "reject", "approve","download"]
  },
  {
    id: 10,
    name: "Change Password",
    icon: "la-lock",
    routePath: "/candidates-dashboard/change-password",
    active: "",
    permissions: ["view", "edit", "delete", "meeting", "export", "import", "reject", "approve","download"]
  },
  {
    id: 11,
    name: "Logout",
    icon: "la-sign-out",
    routePath: "/login",
    active: "",
    permissions: ["view", "edit", "delete", "meeting", "export", "import", "reject", "approve","download"]
  },
  {
    id: 12,
    name: "Delete Profile",
    icon: "la-trash",
    routePath: "/",
    active: "",
    permissions: ["view", "edit", "delete", "meeting", "export", "import", "reject", "approve","download"]
  },
];
export default candidateMenus;
