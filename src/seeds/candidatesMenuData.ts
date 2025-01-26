const candidateMenus = [
  {
    id: 1,
    name: "Dashboard",
    icon: "la-home",
    routePath: "/candidates-dashboard/dashboard",
    active: "active",
    key:"dashbord",
    subMenu: [
      {
        id: 1.1,
        name: "Matching Jobs",
        key: "matchingjobs",
        icon: "la-user",
        routePath: "/employers-candidates/dashboard",
        permissions: { view: true },
      },
      {
        id: 1.2,
        name: "Applied Jobs",
        key: "appliedjobs",
        icon: "la-users",
        routePath: "/candidates-dashboard/dashboard",
        permissions: { view: true },
      },
    ],
    permissions: { view: true, edit: true, delete: true, meeting: true, export: true, import: true, reject: true, approve: true, download: true }
  },
  {
    id: 2,
    name: "My Profile",
    icon: "la-user-tie",
    key:"myprofile",
    routePath: "/candidates-dashboard/my-profile",
    active: "",
    permissions: { view: true, edit: true, delete: true, meeting: true, export: true, import: true, reject: true, approve: true, download: true }
  },
  {
    id: 3,
    name: "My Resume",
    key:"myresume",
    icon: "la la-file-invoice",
    routePath: "/candidates-dashboard/my-resume",
    active: "",
    permissions: { view: true, edit: true, delete: true, meeting: true, export: true, import: true, reject: true, approve: true, download: true }
  },
  {
    id: 4,
    name: "Applied Jobs",
    key:"appliedjobs",
    icon: "la-briefcase",
    routePath: "/candidates-dashboard/applied-jobs",
    active: "",
    permissions: { view: true, edit: true, delete: true, meeting: true, export: true, import: true, reject: true, approve: true, download: true }
  },
  {
    id: 4,
    name: "Saved Jobs",
    key:"savedjobs",
    icon: "la-briefcase",
    routePath: "/candidates-dashboard/saved-jobs",
    active: "",
    permissions: { view: true, edit: true, delete: true, meeting: true, export: true, import: true, reject: true, approve: true, download: true }
  },
  {
    id: 6,
    name: "Shortlisted Jobs",
    key:"shortlistjobs",
    icon: "la-bookmark-o",
    routePath: "/candidates-dashboard/short-listed-jobs",
    active: "",
    permissions: { view: true, edit: true, delete: true, meeting: true, export: true, import: true, reject: true, approve: true, download: true }
  },
  {
    id: 12,
    name: "Delete Profile",
    key:"profiledelete",
    icon: "la-trash",
    routePath: "/",
    active: "",
    permissions: { view: true }
  },
];
export default candidateMenus;
