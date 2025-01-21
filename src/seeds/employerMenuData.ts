const employerMenu = [
  {
    id: 1,
    name: "Dashboard",
    key:"dashboard",
    icon: "la-home",
    routePath: "/employers-dashboard/dashboard",
    active: "active",
    permissions: { view: true },
    paramtype: "",
  },
  {
    id: 2,
    name: "Company Profile",
    key:"company",
    icon: "la-user-tie",
    routePath: "/employers-dashboard/company-profile",
    active: "",
    permissions: { view: true, edit: true, delete: true },
    paramtype: "",
  },
  {
    id: 3,
    name: "Post a New Job",
    key:"managejobs",
    icon: "la-paper-plane",
    routePath: "/employers-dashboard/post-jobs",
    active: "",
    permissions: { view: true },
    paramtype: "",
  },
  {
    id: 4,
    name: "Manage Jobs",
    key:"managejobs",
    icon: "la-briefcase",
    routePath: "/employers-dashboard/manage-jobs",
    active: "",
    permissions: { view: true, edit: true, delete: true },
    paramtype: "",
  },
  {
    id: 5,
    name: "All Applicants",
    key:'applications',
    icon: "la-file-invoice",
    routePath: "/employers-dashboard/all-applicants",
    active: "",
    permissions: { view: true, delete: true, meeting: true, reject: true, approve: true, download: true },
    paramtype: "",
  },
  {
    id: 6,
    name: "Forwrad Applications",
    icon: "la-bookmark-o",
    key:"forwardapplications",
    routePath: "/employers-dashboard/forward-resumes",
    active: "",
    permissions: { view: true, delete: true, meeting: true, reject: true, approve: true, download: true },
    paramtype: "EmployerId",
  },
  {
    id: 6,
    name: "Shortlisted Candidates",
    key:"shortlistcandidates",
    icon: "la-bookmark-o",
    routePath: "/employers-dashboard/shortlisted-candidates/shortlisted",
    active: "",
    permissions: { view: true, delete: true, meeting: true, reject: true, approve: true, download: true },
    paramtype: "",
  },
  {
    id: 6,
    name: "Sub Employer List",
    key:"subemployerlist",
    icon: "la-bookmark-o",
    routePath: "/employers-dashboard/subemployer",
    active: "",
    permissions: { view: true, edit: true, delete: true },
    paramtype: "",
  },
  {
    id: 2,
    name: "Meeting links",
    icon: "la-user-tie",
    key:"meetinglinks",
    routePath: "/employers-dashboard/meetinglinks",
    active: "",
    permissions: { view: true, delete: true },
    paramtype: "",
    userAcitive: "",
  },

  {
    id: 12,
    name: "Delete Profile",
    key:"profiledelete",
    icon: "la-trash",
    routePath: "/",
    active: "",
    permissions: { view: true },
    paramtype: "",
  },
];
export default employerMenu;
