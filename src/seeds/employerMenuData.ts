const employerMenu = [
  {
    id: 1,
    name: "Dashboard",
    icon: "la-home",
    routePath: "/employers-dashboard/dashboard",
    active: "active",
    paramtype:"",
  },
  {
    id: 2,
    name: "Company Profile",
    icon: "la-user-tie",
    routePath: "/employers-dashboard/company-profile",
    active: "",
    paramtype:"",
  },
  {
    id: 3,
    name: "Post a New Job",
    icon: "la-paper-plane",
    routePath: "/employers-dashboard/post-jobs",
    active: "",
    paramtype:"",
  },
  {
    id: 4,
    name: "Manage Jobs",
    icon: "la-briefcase",
    routePath: "/employers-dashboard/manage-jobs",
    active: "",
    paramtype:"",
  },
  {
    id: 5,
    name: "All Applicants",
    icon: "la-file-invoice",
    routePath: "/employers-dashboard/all-applicants",
    active: "",
    paramtype:"",
  },
  {
    id: 6,
    name: "Forwrad Applications",
    icon: "la-bookmark-o",
    routePath: "/employers-dashboard/forward-resumes",
    active: "",
    paramtype:"EmployerId",
  },
  {
    id: 6,
    name: "Shortlisted Candidates",
    icon: "la-bookmark-o",
    routePath: "/employers-dashboard/shortlisted-candidates/shortlisted",
    active: "",
    paramtype:"",
  },
  {
    id: 6,
    name: "Sub Employer List",
    icon: "la-bookmark-o",
    routePath: "/employers-dashboard/subemployer",
    active: "",
    paramtype:"",
  },
  // {
  //   id: 6,
  //   name: "Messages",
  //   icon: "la-bookmark-o",
  //   routePath: "/employers-dashboard/messages",
  //   active: "",
  //   paramtype:"",
  // },
  {
    id: 2,
    name: "Meeting links",
    icon: "la-user-tie",
    routePath: "/employers-dashboard/meetinglinks",
    active: "",
    paramtype:"createdBy",
    userAcitive:""
  },
  // {
  //   id: 7,
  //   name: "Packages",
  //   icon: "la-box",
  //   routePath: "/employers-dashboard/packages",
  //   active: "",
  // paramtype:"",
  // },
  {
    id: 10,
    name: "Change Password",
    icon: "la-lock",
    routePath: "/employers-dashboard/change-password",
    active: "",
    paramtype:"",
  },
  {
    id: 11,
    name: "Logout",
    icon: "la-sign-out",
    routePath: "/login",
    active: "",
    paramtype:"",
  },
  {
    id: 12,
    name: "Delete Profile",
    icon: "la-trash",
    routePath: "/",
    active: "",
    paramtype:"",
  },
];
export default  employerMenu