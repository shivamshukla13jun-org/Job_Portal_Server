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
  SubEmployerId?:Types.ObjectId,
  EmployerId?:Types.ObjectId,

}
export const candidateaddresslokup=[
  {
    $lookup:{
      from:"cities",
      localField:"contact.current_address.city",
      foreignField:"_id",
      as:"contact.current_address.city"
    }
  },
  {
    $lookup:{
      from:"states",
      localField:"contact.current_address.state",
      foreignField:"_id",
      as:"contact.current_address.state"
    }
  },
  {
    $lookup:{
      from:"countries",
      localField:"contact.current_address.country",
      foreignField:"_id",
      as:"contact.current_address.country"
    }
  },
  {
    $lookup:{
      from:"cities",
      localField:"contact.permanent_address.city",
      foreignField:"_id",
      as:"contact.permanent_address.city"
    }
  },
  {
    $lookup:{
      from:"states",
      localField:"contact.permanent_address.state",
      foreignField:"_id",
      as:"contact.permanent_address.state"
    }
  },
  {
    $lookup:{
      from:"countries",
      localField:"contact.permanent_address.country",
      foreignField:"_id",
      as:"contact.permanent_address.country"
    }
  },
  {
    $unwind: { path: "$contact.current_address.city", preserveNullAndEmptyArrays: true }
  },
  {
    $unwind: { path: "$contact.current_address.state", preserveNullAndEmptyArrays: true }
  },
  {
    $unwind: { path: "$contact.current_address.country", preserveNullAndEmptyArrays: true }
  },
  {
    $unwind: { path: "$contact.permanent_address.city", preserveNullAndEmptyArrays: true }
  },
  {
    $unwind: { path: "$contact.permanent_address.state", preserveNullAndEmptyArrays: true }
  },
  {
    $unwind: { path: "$contact.permanent_address.country", preserveNullAndEmptyArrays: true }
  }
]
const ApplicationJOblookup=[
  // job lookup
  {
    $lookup:{
      from:"jobs",
      localField:"job",
      foreignField:"_id",
      as:"job"
    }
  },
  {
    $unwind: { path: "$job", preserveNullAndEmptyArrays: true }
  },
  // category lookup
  {
    $lookup:{
      from:"jobcategories",
      localField:"job.categories",
      foreignField:"_id",
      as:"job.categories"
    }
  },
  // location lookup
  {
    $lookup:{
      from:"states",
      localField:"job.location",
      foreignField:"_id",
      as:"job.location"
    }
  },
  {
    $unwind: { path: "$job.location", preserveNullAndEmptyArrays: true }
  },
  {
    $lookup:{
      from:"cities",
      localField:"job.place",
      foreignField:"_id",
      as:"job.place"
    }
  },
  {
    $unwind: { path: "$job.place", preserveNullAndEmptyArrays: true }
  },
  {
    $lookup:{
      from:"industries",
      localField:"job.industry",
      foreignField:"_id",
      as:"job.industry"
    }
  },
  {
    $lookup:{
      from:"degrees",
      localField:"job.degrees",
      foreignField:"_id",
      as:"job.degrees"
    }
  },
  // unset
  // {
  //   $unset: ["job"]
  // }
]
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
  let {  status, jobid,page,limit,EmployerId,SubEmployerId, qualification, keyword, category, experience_from, experience_to, createdAt, ...queries } = req.query as ApplicationQuery;
  const matchQueries: Record<string, any> = {};
  const createRegex = (value: string) =>
    new RegExp(`.*${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}.*`, "gi");

  for (const [key, value] of Object.entries(queries)) {
    if (typeof value === "string" && value !== "" && !["createdAt", "status", "name"].includes(key)) {
      matchQueries[key] = createRegex(value);
    }
    // if (typeof value === "string" && value !== "") {
    //   if (key === "name") {
    //     matchQueries["candidate.name"] = createRegex(value);
    //   }
    // }
  }

  if (qualification) {
    matchQueries["candidate.education"] = { $elemMatch: { qualification } };
  }
  if (keyword) {
    matchQueries["job.title"] = createRegex(keyword)
  }
  if (category) {
    matchQueries["candidate.employment"] = {
      $elemMatch: { categories: { $in: [new Types.ObjectId(category)] } }
    };
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
export {Applicationsstats,ApplicationsstatsUnwindPath,FilterApplications,ApplicationJOblookup}

  