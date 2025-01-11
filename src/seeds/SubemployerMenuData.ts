const SubemployerMenu = [
  {
    id: 1,
    name: "Dashboard",
    icon: "la-home",
    routePath: "/subemployers-dashboard/dashboard",
    active: "active",
    paramtype:"",
  },
  {
    id: 2,
    name: "Meeting links",
    icon: "la-user-tie",
    routePath: "/subemployers-dashboard/meetinglinks",
    active: "",
    paramtype:"createdBy",
    userAcitive:""
  },
 
  {
    id: 6,
    name: "Forwrad Applications",
    icon: "la-bookmark-o",
    routePath: "/subemployers-dashboard/forward-resumes",
    active: "",
     paramtype:"SubEmployerId",
  },
  {
    id: 11,
    name: "Logout",
    icon: "la-sign-out",
    routePath: "/login",
    active: "",
     paramtype:"",
  },

];
export default  SubemployerMenu