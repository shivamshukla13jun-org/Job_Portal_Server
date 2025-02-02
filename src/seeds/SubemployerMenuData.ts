const SubemployerMenu = [
  {
    id: 1,
    name: "Dashboard",
    icon: "la-home",
    key:"dashboard",
    routePath: "/subemployers-dashboard/dashboard",
    active: "active",
    permissions: { view: true, edit: true, delete: true, meeting: true, export: true, import: true, reject: true, approve: true, download: true },
    paramtype: "",
  },
  {
    id: 2,
    name: "Meeting links",
    key:"meetinglinks",
    icon: "la-user-tie",
    routePath: "/subemployers-dashboard/meetinglinks",
    active: "",
    paramtype: "createdBy",
    permissions: { view: true, edit: true, delete: true, meeting: true, export: true, import: true, reject: true, approve: true, download: true },
    userAcitive: ""
  },
  {
    id: 6,
    name: "Forwrad Applications",
    key:"forwardapplications",
    icon: "la-bookmark-o",
    routePath: "/subemployers-dashboard/forward-resumes",
    active: "",
    permissions: { view: true, edit: true, delete: true, meeting: true, export: true, import: true, reject: true, approve: true, download: true },
    paramtype: "SubEmployerId",
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
export default SubemployerMenu;