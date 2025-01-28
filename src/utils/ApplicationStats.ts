import { Types } from "mongoose";
import { Request } from "express";
export interface ApplicationQuery {
  page?:string;
  limit?:string;
  status?:string;
  jobid?:Types.ObjectId;
  createdAt?:any;
  queries?:object;
  qualification?:string;
  keyword?:string;
  category?:string;
  experience_from?:number
  experience_to?:number;

}
export const getApplicationStats = (statuses: string[]) => {
    const stats: Record<string, any[]> = {};
    statuses.forEach((status) => {
      stats[status] = [
        {
          $match: status === "totals" ? {} : { status }, // Match specific status or all for totals
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            total: { $ifNull: ["$total", 0] },
          },
        },
      ];
    });
    return stats;
  };
  
  export const getApplicationStatsUnwind = () => [
    { $unwind: { path: "$totals", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$rejected", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$pending", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$shortlisted", preserveNullAndEmptyArrays: true } },
    {
      $addFields: {
        stats: {
          totals: { $ifNull: ["$totals.total", 0] },
          approved: { $ifNull: ["$shortlisted.total", 0] },
          pending: { $ifNull: ["$pending.total", 0] },
          rejected: { $ifNull: ["$rejected.total", 0] },
        },
      },
    },
  ];

  const statuses = ["totals", "pending","shortlisted", "rejected"]; // Define statuses for stats

const Applicationsstats = getApplicationStats(statuses);
const ApplicationsstatsUnwindPath = getApplicationStatsUnwind();

const FilterApplications=(req:Request)=>{
  let {  status, jobid, qualification, keyword, category, experience_from, experience_to, createdAt, ...queries } = req.query as ApplicationQuery;
  const matchQueries: Record<string, any> = {};
  const createRegex = (value: string) =>
    new RegExp(`.*${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}.*`, "gi");

  for (const [key, value] of Object.entries(queries)) {
    if (typeof value === "string" && value !== "" && !["createdAt", "status", "name"].includes(key)) {
      matchQueries[key] = createRegex(value);
    }
    if (typeof value === "string" && value !== "") {
      if (key === "name") {
        matchQueries["candidate.name"] = createRegex(value);
      }
    }
  }

  if (qualification) {
    matchQueries["candidate.education"] = { $elemMatch: { qualification } };
  }
  if (keyword) {
    matchQueries["job.title"] = { $regex: keyword, $options: "i" };
  }
  if (category) {
    matchQueries["candidate.employment"] = { $elemMatch: { categories: { $elemMatch: { value: category } } } };
  }
  if (experience_from || experience_to) {
    let experience:number[]=[]
   
    if (experience_from) {
      experience.push(+experience_from)
    }
    if (experience_to) {
      experience.push(+experience_to)
    }
    matchQueries["candidate.experience"] = {
      $in:experience
    };
  }
  return {matchQueries}
}
export {Applicationsstats,ApplicationsstatsUnwindPath,FilterApplications}

  