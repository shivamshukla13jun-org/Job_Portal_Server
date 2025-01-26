const employerMenu = [
  {
    id: 1,
    name: "Dashboard",
    key: "dashboard",
    icon: "la-home",
    routePath: "/employers-dashboard/dashboard",
    active: "active",
    permissions: { view: true },
    paramtype: "",
    subMenu: [
      {
        id: 1.1,
        name: "Matching Candidates",
        key: "matchingcandidates",
        icon: "la-user",
        routePath: "/employers-dashboard/dashboard",
        permissions: { view: true },
      },
      {
        id: 1.2,
        name: "Recent Applicants",
        key: "recentapplicants",
        icon: "la-users",
        routePath: "/employers-dashboard/dashboard",
        permissions: { view: true },
      },
    ],
  },
  // Other menu items remain unchanged
  {
    id: 2,
    name: "Company Profile",
    key: "company",
    icon: "la-user-tie",
    routePath: "/employers-dashboard/company-profile",
    active: "",
    permissions: { view: true, edit: true, delete: true },
    paramtype: "",
  },
  {
    id: 3,
    name: "Post a New Job",
    key: "managejobs",
    icon: "la-paper-plane",
    routePath: "/employers-dashboard/post-jobs",
    active: "",
    permissions: { view: true },
    paramtype: "",
  },
  // Rest of the menu items
];
export default employerMenu;
