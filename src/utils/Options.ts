import { Application } from "@/models/candidate/application.model";
import Candidate from "@/models/portal/candidate.model";
import Employer from "@/models/portal/employer.model";
import Job from "@/models/portal/job.model";
import SubEmployer from "@/models/portal/SubEmployer.model";

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
    if (summarydata) {
      for (let job in summarydata) {
        summary[job] = summarydata[job] ? summarydata[job]["total"] : 0;
      }
    }
    return {options:options,summary:summary};
  }

  static async candidate() {
    const summary: Record<string, any> = {};
    const [options] = await Candidate.aggregate([
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
          skills: [
            {
              $unwind: {
                path: "$skills",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $group: {
                _id: "$skills.value",
                label: { $first: "$skills.label" },
                value: { $first: "$skills.value" },
              },
            },
            { $match: { _id: { $ne: null } } },
          ],
        }
      }
    ]);
    const [summarydata] = await Candidate.aggregate([
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
              $match:{"user.isActive":true}
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
    if (summarydata) {
      for (let candidate in summarydata) {
        summary[candidate] = summarydata[candidate] ? summarydata[candidate]["total"] : 0;
      }
    }
    return {options:options,summary:summary};
  }

  static async application() {
    const summary: Record<string, any> = {};
    const [options] = await Application.aggregate([
      {
        $facet: {
          statuses: [
            {
              $group: {
                _id: "$status",
                label: { $first: "$status" },
                value: { $first: "$status" },
              },
            },
            { $match: { _id: { $ne: null } } },
          ],
        }
      }
    ]);
    const [summarydata] = await Application.aggregate([
      {
        $facet: {
          total: [
            { $count: "total" },
            { $project: { _id: 0, total: { $ifNull: ["$total", 0] } } },
          ],
          pending: [
            {
              $match: { status: "pending" }
            },
            { $count: "total" },
            { $project: { _id: 0, total: { $ifNull: ["$total", 0] } } },
          ],
          shortlisted: [
            {
              $match: { status: "shortlisted" }
            },
            { $count: "total" },
            { $project: { _id: 0, total: { $ifNull: ["$total", 0] } } },
          ],
          rejected: [
            {
              $match: { status: "rejected" }
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
        $unwind: { path: "$pending", preserveNullAndEmptyArrays: true },
      },
      {
        $unwind: { path: "$shortlisted", preserveNullAndEmptyArrays: true },
      },
      {
        $unwind: { path: "$rejected", preserveNullAndEmptyArrays: true },
      },
    ]);
    if (summarydata) {
      for (let application in summarydata) {
        summary[application] = summarydata[application] ? summarydata[application]["total"] : 0;
      }
    }
    return {options:options,summary:summary};
  }

  static async subEmployer() {
    const summary: Record<string, any> = {};
    const [options] = await SubEmployer.aggregate([
      {
        $facet: {
          department: [
            {
              $group: {
                _id: "$department",
                label: {
                  $first: "$department"
                },
                value: { $first: "$department" },
              },
            },
            { $match: { _id: { $ne: null } } },
          ],
        }
      }
    ]);
    const [summarydata] = await SubEmployer.aggregate([
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
              $match:{"user.isActive":true}
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
    if (summarydata) {
      for (let subEmployer in summarydata) {
        summary[subEmployer] = summarydata[subEmployer] ? summarydata[subEmployer]["total"] : 0;
      }
    }
    return {options:options,summary:summary};
  }

  static async job() {
    const summary: Record<string, any> = {};
    const [options] = await Job.aggregate([
      {
        $facet: {
          locations: [
            {
              $group: {
                _id: "$place",
                label: {
                  $first: {
                    $concat: ["$place", ", ", "$location"],
                  },
                },
                value: { $first: "$place" },
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
    const [summarydata] = await Job.aggregate([
      {
        $facet: {
          total: [
            { $count: "total" },
            { $project: { _id: 0, total: { $ifNull: ["$total", 0] } } },
          ],
          inactive: [
            {
              $match: { isActive: false }
            },
            { $count: "total" },
            { $project: { _id: 0, total: { $ifNull: ["$total", 0] } } },
          ],
          active: [
            {
              $match: { isActive: true }
            },
            { $count: "total" },
            { $project: { _id: 0, total: { $ifNull: ["$total", 0] } } },
          ],
          closed: [
            {
              $match: {
                deadline: { $lt: new Date() },
              },
            },
            { $count: "total" },
            { $project: { _id: 0, total: { $ifNull: ["$total", 0] } } },
          ],
          opened: [
            {
              $match: {
                deadline: { $gte: new Date() },
              },
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
      {
        $unwind: { path: "$closed", preserveNullAndEmptyArrays: true },
      },
      {
        $unwind: { path: "$opened", preserveNullAndEmptyArrays: true },
      },
    ]);
    if (summarydata) {
      for (let job in summarydata) {
        summary[job] = summarydata[job] ? summarydata[job]["total"] : 0;
      }
    }
    return {options:options,summary:summary};
  }
}
