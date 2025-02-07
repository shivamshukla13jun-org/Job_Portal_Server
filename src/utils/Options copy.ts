import Employer from "@/models/portal/employer.model";
import Job from "@/models/portal/job.model";
export class OptionsQuery {
  static async employer() {
    const today = new Date();
    const summary:Record<string,any>={}
    const [options] = await Employer.aggregate([
      {
        $facet: {
          locations: [
            {
              $group: {
                _id: "$address.city",
                label: {
                  $first: {
                    $concat: ["$address.city", ", ", "$address.state"],
                  },
                },
                value: { $first: "$address.city" },
              },
            },
            { $match: { _id: { $ne: null } } },
          ],
          categories: [
            {
              $unwind: {
                path: "$categories",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $group: {
                _id: "$categories.value",
                label: { $first: "$categories.label" },
                value: { $first: "$categories.value" },
              },
            },
            { $match: { _id: { $ne: null } } },
          ],
        }
      }
    ]);
    const [summarydata] = await Employer.aggregate([
      {
        $facet: {
          total: [
            { $count: "total" },
            { $project: { _id: 0, total: { $ifNull: ["$total", 0] } } },
          ],
          inactive: [
            {
              $lookup:{
                from:"users",
                localField:"userId",
                foreignField:"_id",
                as:"user"
              }
            },
            {
              $unwind: { path: "$user", preserveNullAndEmptyArrays: true },
            },
            {
              $match:{"user.isActive":false}
            },
            { $count: "total" },
            { $project: { _id: 0, total: { $ifNull: ["$total", 0] } } },
          ],
          active: [
            {
              $lookup:{
                from:"users",
                localField:"userId",
                foreignField:"_id",
                as:"user"
              }
            },
            {
              $unwind: { path: "$user", preserveNullAndEmptyArrays: true },
            },
            {
              $match:{"user.isActive":false}
            },
            { $count: "total" },
            { $project: { _id: 0, total: { $ifNull: ["$total", 0] } } },
          ],
        },
      },
      {
        $unwind: { path: "$total", preserveNullAndEmptyArrays: true },
      },
      {
        $unwind: { path: "$inactive", preserveNullAndEmptyArrays: true },
      },
      {
        $unwind: { path: "$active", preserveNullAndEmptyArrays: true },
      },
    ]);
    // let [jobsResult] = await Job.aggregate([
    //   {
    //     $facet: {
    //       totalJobs: [
    //         { $count: "total" },
    //         { $project: { _id: 0, total: { $ifNull: ["$total", 0] } } },
    //       ],
    //       totalClosedJobs: [
    //         {
    //           $match: {
    //             deadline: { $lt: today },
    //           },
    //         },
    //         { $count: "total" },
    //         { $project: { _id: 0, total: { $ifNull: ["$total", 0] } } },
    //       ],
    //       totalOpenJobs: [
    //         {
    //           $match: {
    //             deadline: { $gte: today },
    //           },
    //         },
    //         { $count: "total" },
    //         { $project: { _id: 0, total: { $ifNull: ["$total", 0] } } },
    //       ],
    //       totalActiveJobs: [
    //         {
    //           $match: { isActive: true },
    //         },
    //         { $count: "total" },
    //         { $project: { _id: 0, total: { $ifNull: ["$total", 0] } } },
    //       ],
    //     },
    //   },
    //   {
    //     $unwind: { path: "$totalJobs", preserveNullAndEmptyArrays: true },
    //   },
    //   {
    //     $unwind: { path: "$totalClosedJobs", preserveNullAndEmptyArrays: true },
    //   },
    //   {
    //     $unwind: { path: "$totalOpenJobs", preserveNullAndEmptyArrays: true },
    //   },
    //   {
    //     $unwind: {
    //       path: "$totalActiveJobs",
    //       preserveNullAndEmptyArrays: true,
    //     },
    //   },
    // ]);
  
    // if (jobsResult) {
    //   for (let job in jobsResult) {
    //     summary[job] = jobsResult[job] ? jobsResult[job]["total"] : 0;
    //   }
    // }
    if (summarydata) {
      for (let job in summarydata) {
        summary[job] = summarydata[job] ? summarydata[job]["total"] : 0;
      }
    }
   
   
  
    return {options:options,summary:summary};
  }
}
