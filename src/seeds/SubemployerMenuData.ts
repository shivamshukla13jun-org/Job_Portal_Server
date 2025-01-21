const SubemployerMenu = [
  {
    id: 1,
    name: "Dashboard",
    icon: "la-home",
    key:"dashboard",
    routePath: "/subemployers-dashboard/dashboard",
    active: "active",
    permissions: ["view", "edit", "delete", "meeting", "export", "import", "reject", "approve","download"],
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
    permissions: ["view", "edit", "delete", "meeting", "export", "import", "reject", "approve","download"],
    userAcitive: ""
  },
  {
    id: 6,
    name: "Forwrad Applications",
    key:"forwardapplications",
    icon: "la-bookmark-o",
    routePath: "/subemployers-dashboard/forward-resumes",
    active: "",
    permissions: ["view", "edit", "delete", "meeting", "export", "import", "reject", "approve","download"],
    paramtype: "SubEmployerId",
  },
 
];
export default SubemployerMenu;