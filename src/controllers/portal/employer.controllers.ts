import mongoose, { Types } from "mongoose";
import { NextFunction, Request, Response } from "express";

import Employer, {
  IEmployer,
  IEmployerFiles,
} from "@/models/portal/employer.model";
import { AppError } from "@/middlewares/error";
import { validateEmployer } from "@/validations/employer";
import Job from "@/models/portal/job.model";
import { Application } from "@/models/candidate/application.model";
import SubEmployer from "@/models/portal/SubEmployer.model";
import Candidate from "@/models/portal/candidate.model";
import ForwardedCV, {
  ForwardCVBody,
  ForwardingResult,
  ForwardingStatus,
  IForwardedCV,
} from "@/models/portal/Forwarwardedcv.model";
import { EmployerDashBoardGraph } from "@/utils/employerdashboardGraph";

/**
 @desc      Create an employer
 @route     POST /api/v1/employer
 @access    Public
**/
const createEmployer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const payload: IEmployer = req.body;

    payload["email"] = payload.email.toLowerCase();
    payload["userId"] = new Types.ObjectId(res.locals.userId);

    const employer = await Employer.create(payload);
    if (!employer) {
      throw new AppError("Failed to create employer", 400);
    }

    res.status(201).json({
      success: true,
      message: "employer created!",
      data: employer,
    });
  } catch (error) {
    next(error);
  }
};

interface DashboardData {
  jobs: object;
  business_name: string;
  // users: any;
  Applicationdata: object;
}

const EmployerDashboard = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.params.id;
    const checkEmployer = await Employer.findOne({ _id: userId });
    if (!checkEmployer) {
      throw new AppError(`Failed to find an employer`, 400);
    }
    const today: Date = new Date();
    const lastYear: Date = new Date(today.setFullYear(today.getFullYear() - 1));
    const monthsArray: string[] = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const baseStats: any[] = [
      {
        $match: {
          createdAt: { $gte: lastYear },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          total: { $sum: 1 },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
      {
        $project: {
          _id: 0,
          year: "$_id.year",
          month: {
            $arrayElemAt: [monthsArray, { $subtract: ["$_id.month", 1] }],
          },
          total: 1,
        },
      },
    ];

    const [totalpostedjobs]: any[] = await Job.aggregate([
      {
        $match: {
          employerId: checkEmployer._id,
        },
      },

      {
        $facet: {
          graph: EmployerDashBoardGraph,
          postedjobs: [
            { $group: { _id: "$employerId", total: { $sum: 1 } } },
            { $project: { _id: 0, total: { $ifNull: ["$total", 0] } } },
          ],
          stats: baseStats,
        },
      },
      {
        $unwind: {
          path: "$postedjobs",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          total: { $ifNull: ["$postedjobs.total", 0] },
          graph: 1,
          stats: 1,
        },
      },
    ]);

    // Application stats with status-based filtering
    const [Applicationdata]: any[] = await Application.aggregate([
      {
        $match: {
          employer: checkEmployer._id,
        },
      },
      {
        $facet: {
          Application: [
            { $group: { _id: null, total: { $sum: 1 } } },
            { $project: { _id: 0 } },
          ],
          Shortlist: [
            { $match: { status: "shortlisted" } },
            { $group: { _id: null, total: { $sum: 1 } } },
            { $project: { _id: 0 } },
          ],
          pendinglist: [
            { $match: { status: "pending" } },
            { $group: { _id: null, total: { $sum: 1 } } },
            { $project: { _id: 0 } },
          ],
          rejectedlist: [
            { $match: { status: "rejected" } },
            { $group: { _id: null, total: { $sum: 1 } } },
            { $project: { _id: 0 } },
          ],
          Applicationstats: baseStats,
          Shortliststats: [
            { $match: { status: "shortlisted" } }, // Filtering for accepted
            ...baseStats,
          ],
          pendingstats: [
            { $match: { status: "pending" } }, // Filtering for pending
            ...baseStats,
          ],
          rejectedstats: [
            { $match: { status: "rejected" } }, // Filtering for rejected
            ...baseStats,
          ],
        },
      },
      {
        $unwind: {
          path: "$Application",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$Shortlist",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$pendinglist",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$rejectedlist",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          Application: { $ifNull: ["$Application.total", 0] },
          Shortlist: { $ifNull: ["$Shortlist.total", 0] },
          pendinglist: { $ifNull: ["$pendinglist.total", 0] },
          rejectedlist: { $ifNull: ["$rejectedlist.total", 0] },
          Applicationstats: 1,
          Shortliststats: 1,
          pendingstats: 1,
          rejectedstats: 1,
        },
      },
    ]);

    let data: DashboardData = {
      jobs: totalpostedjobs,
      Applicationdata,
      business_name: checkEmployer.business_name, // Added business_name

      // users: users,
    };
    res.status(200).json({ data, message: "fetch data successful" });
  } catch (error) {
    next(error);
  }
};
/**
 @desc      Get all employer
 @route     POST /api/v1/employer
 @access    Public
**/
const getEmployers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { page, limit, ...queries } = req.query;

    const pageOptions = {
      page: parseInt(page as string, 0) || 0,
      limit: parseInt(limit as string, 10) || 10,
    };

    const matchQueries: { [key: string]: RegExp } = {};
    const createRegex = (value: string) =>
      new RegExp(`.*${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}.*`, "gi");

    for (const [key, value] of Object.entries(queries)) {
      if (typeof value === "string" && value !== "") {
        matchQueries[key] = createRegex(value);
      }
    }

    const employers = await Employer.aggregate([
      {
        $match: {
          ...matchQueries,
        },
      },
      {
        $facet: {
          data: [
            { $skip: pageOptions.page * pageOptions.limit },
            { $limit: pageOptions.limit },
          ],
          count: [{ $count: "total" }],
        },
      },
    ]);

    res.status(200).json({
      success: true,
      message: "employer fetched!",
      data: employers[0]?.data || [],
      count: employers[0]?.total[0]?.count || 0,
    });
  } catch (error) {
    next(error);
  }
};

/**
 @desc      Get an employer
 @route     POST /api/v1/employer/:id
 @access    Public
**/
const getEmployer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;

    const employer = await Employer.findOne({ userId: id });
    if (!employer) {
      throw new AppError("Failed to find employer", 400);
    }

    res.status(200).json({
      success: true,
      data: employer,
      message: "employer fetched",
    });
  } catch (error) {
    next(error);
  }
};
const getSubEmployers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.params.id;

    const subEmployers = await SubEmployer.find({
      parentEmployerId: userId,
    }).select("name");

    res.status(200).json({ sucesess: true, data: subEmployers });
  } catch (error) {
    next(error);
  }
};
const ForwardCV = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get the current user's ID from locals
    const { fromEmployerId } = req.query;
    const userId = new Types.ObjectId(res.locals.userId);
    const CheckEMployer = await Employer.findOne({ userId: userId });
    if (!CheckEMployer) {
      throw new AppError("EMployer not found", 404);
    }
    // Destructure request body
    const { candidateId, subEmployerIds, notes } = req.body as ForwardCVBody;

    // Validate candidate ID
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      throw new AppError("Candidate not found", 404);
    }

    // Prepare forwarding results
    const forwardingResults: Array<ForwardingResult> = [];
    if (fromEmployerId) {
      // Create new forwarding record
      await ForwardedCV.create({
        candidateId,
        fromEmployerId: CheckEMployer._id,
        status: ForwardingStatus.PENDING,
        additionalNotes: notes || undefined,
      });
    } else if (subEmployerIds && subEmployerIds.length > 0 && candidateId) {
      for (const subEmployerId of subEmployerIds) {
        // Check if already forwarded
        const alreadyForwarded = await ForwardedCV.isAlreadyForwarded(
          candidateId,
          subEmployerId
        );
        if (!alreadyForwarded) {
          // Create new forwarding record
          await ForwardedCV.create({
            candidateId,
            fromEmployerId: CheckEMployer._id,
            toSubEmployerId: subEmployerId,
            status: ForwardingStatus.PENDING,
            additionalNotes: notes || undefined,
          });
        }
      }
    }

    // Respond with results
    res.status(200).json({
      success: true,
      data: {
        candidateId,
        forwardedTo: subEmployerIds,
        forwardingResults,
      },
      message: "CV forwarding process completed",
    });
  } catch (error) {
    next(error);
  }
};

/**
 @desc      Update an employer
 @route     PUT /api/v1/employer/:id
 @access    Public
**/
const updateEmployer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const payload: IEmployer = JSON.parse(req.body.parse);
    const files = req.files as unknown as IEmployerFiles;

    payload["email"] = payload.email.toLowerCase();
    const checkEmailExist = await Employer.findOne({ email: payload["email"] });

    if (checkEmailExist) {
      // Check if the existing email belongs to a different user
      if (!checkEmailExist.userId.equals(req.params.id)) {
        throw new AppError(
          "Email already registered, please use a different email!",
          400
        );
      }
    }
    // formatting the payload
    payload.logo = files?.logo?.[0] || payload?.logo;
    payload.videos = files?.["video[]"]?.[0] || payload?.videos;
    payload.pictures = files?.["picture[]"]?.[0] || payload?.pictures;

    // validate the data
    const check = await validateEmployer(payload);
    if (!check) {
      return;
    }

    const checkEmployer = await Employer.findOne({
      userId: new Types.ObjectId(req.params.id),
    });
    if (!checkEmployer) {
      payload["userId"] = new Types.ObjectId(res.locals.userId);
      const newEmployer = await Employer.create(payload);
      if (!newEmployer) {
        throw new AppError("Failed to create employer", 400);
      }
      return res.status(201).json({
        success: true,
        message: "Employer created!",
        data: newEmployer,
      });
    }

    const employer = await Employer.findByIdAndUpdate(
      checkEmployer._id,
      { $set: payload },
      { new: true, runValidators: true }
    );
    if (!employer) {
      throw new AppError("Failed to update employer", 400);
    }

    res.status(200).json({
      success: true,
      message: "Employer updated!",
      data: employer,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

/**
 @desc      Delete an employer
 @route     DELETE /api/v1/employer/:id
 @access    Public
**/
const deleteEmployer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id;

    const employer = await Employer.findByIdAndDelete(id);
    if (!employer) {
      throw new AppError("Failed to find employer", 400);
    }

    res.status(200).json({
      success: true,
      data: {},
      message: "employer deleted",
    });
  } catch (error) {
    next(error);
  }
};

interface CandidatQuery {
  qualification?: string;
  keyword?: string;
  category?: string;
  experience_from?: number;
  experience_to?: number;
  limit: number;
  page: number;
}

const CandidatesForEmployer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      qualification,
      keyword,
      category,
      experience_from,
      experience_to,
      limit = 6,
      page = 1,
    } = req.query as Partial<CandidatQuery>;

    const matchConditions: any = {};

    // Qualification Match
    if (qualification) {
      matchConditions.education = {
        $elemMatch: { qualification },
      };
    }

    // Keyword Match
    if (keyword) {
      matchConditions.designation = { $regex: keyword, $options: "i" };
    }

    // Category Match
    if (category) {
      matchConditions.employment = {
        $elemMatch: {
          categories: { $elemMatch: { value: category } },
        },
      };
    }

    // Experience Match
    if (experience_from || experience_to) {
      matchConditions.experience = {};
      if (experience_from)
        matchConditions.experience.$gte = Number(experience_from);
      if (experience_to)
        matchConditions.experience.$lte = Number(experience_to);
    }

    // Aggregate Pipeline
    const [results] = await Candidate.aggregate([
      { $match: matchConditions },

      // Add Match Score
      {
        $addFields: {
          matchScore: {
            $add: [
              // Qualification Match (25 Points)
              {
                $cond: [
                  {
                    $and: [
                      { $ne: [qualification, null] },
                      {
                        $gt: [
                          {
                            $size: {
                              $filter: {
                                input: "$education",
                                cond: {
                                  $eq: ["$$this.qualification", qualification],
                                },
                              },
                            },
                          },
                          0,
                        ],
                      },
                    ],
                  },
                  25,
                  0,
                ],
              },

              // Keyword Match (25 Points)
              {
                $cond: [
                  {
                    $and: [
                      { $ne: [keyword, null] },
                      {
                        $regexMatch: {
                          input: "$designation",
                          regex: keyword || "",
                          options: "i",
                        },
                      },
                    ],
                  },
                  25,
                  0,
                ],
              },

              // Category Match (25 Points)
              {
                $cond: [
                  {
                    $and: [
                      { $ne: [category, null] },
                      {
                        $gt: [
                          {
                            $size: {
                              $filter: {
                                input: "$employment",
                                cond: {
                                  $gt: [
                                    {
                                      $size: {
                                        $filter: {
                                          input: "$$this.categories",
                                          cond: {
                                            $eq: ["$$this.value", category],
                                          },
                                        },
                                      },
                                    },
                                    0,
                                  ],
                                },
                              },
                            },
                          },
                          0,
                        ],
                      },
                    ],
                  },
                  25,
                  0,
                ],
              },

              // Experience Match (25 Points)
              {
                $cond: [
                  {
                    $and: [
                      {
                        $or: [
                          { $ne: [experience_from, null] },
                          { $ne: [experience_to, null] },
                        ],
                      },
                      {
                        $gte: ["$experience", Number(experience_from) || 0],
                      },
                      {
                        $lte: [
                          "$experience",
                          Number(experience_to) || Infinity,
                        ],
                      },
                    ],
                  },
                  25,
                  0,
                ],
              },
            ],
          },
        },
      },

      // Sort by Score and Date
      { $sort: { matchScore: -1, createdAt: -1 } },

      // Select Required Fields
      {
        $project: {
          name: 1,
          designation: 1,
          "employment.categories": 1,
          "profile.filename": 1,
          experience: 1,
          matchScore: 1,
          contact: 1,
        },
      },

      // Pagination with Facet
      {
        $facet: {
          data: [
            { $skip: (Number(page) - 1) * Number(limit) },
            { $limit: Number(limit) },
          ],
          totalCount: [{ $count: "count" }],
        },
      },

      // Unwind Total Count
      {
        $unwind: {
          path: "$totalCount",
          preserveNullAndEmptyArrays: true,
        },
      },
    ]);

    // Response
    res.status(200).json({
      success: true,
      data: results?.data || [],
      totalCount: results?.totalCount?.count || 0,
      totalPages: Math.ceil((results?.totalCount?.count || 0) / Number(limit)),
    });
  } catch (error) {
    next(error);
  }
};
const CandidateMatchGraphByEmployer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.params.id;
    const checkEmployer = await Employer.findOne({ _id: userId });
    const results = await Job.aggregate([
      // Lookup candidates using job details directly
      {
        $lookup: {
          from: "candidates",
          let: {
            jobTitle: "$title",
            jobCategories: "$categories",
            jobExperience: "$candidate_requirement.experience",
            jobQualifications: {
              $ifNull: [
                {
                  $reduce: {
                    input: {
                      $filter: {
                        input: { $ifNull: ["$personal_info", []] },
                        as: "info",
                        cond: {
                          $eq: ["$$info.info", "Degree and Specialisation"],
                        },
                      },
                    },
                    initialValue: [],
                    in: {
                      $concatArrays: [
                        "$$value",
                        {
                          $map: {
                            input: { $ifNull: ["$$this.assets", []] },
                            as: "asset",
                            in: "$$asset.value",
                          },
                        },
                      ],
                    },
                  },
                },
                [],
              ],
            },
          },
          pipeline: [
            {
              $addFields: {
                designationMatch: {
                  $let: {
                    vars: {
                      jobTitle: { $toLower: { $ifNull: ["$$jobTitle", ""] } },
                      candidateDesignation: {
                        $toLower: { $ifNull: ["$designation", ""] },
                      },
                      jobTitleWords: {
                        $split: [
                          { $toLower: { $ifNull: ["$$jobTitle", ""] } },
                          " ",
                        ],
                      },
                      candidateWords: {
                        $split: [
                          { $toLower: { $ifNull: ["$designation", ""] } },
                          " ",
                        ],
                      },
                    },
                    in: {
                      $cond: [
                        { $eq: ["$$jobTitle", "$$candidateDesignation"] },
                        true,
                        {
                          $gt: [
                            {
                              $size: {
                                $setIntersection: [
                                  "$$jobTitleWords",
                                  "$$candidateWords",
                                ],
                              },
                            },
                            0,
                          ],
                        },
                      ],
                    },
                  },
                },
                experienceMatch: {
                  $gte: [
                    { $ifNull: ["$experience", 0] },
                    { $ifNull: ["$$jobExperience", 0] },
                  ],
                },
                categoryMatch: {
                  $let: {
                    vars: {
                      candidateCategories: {
                        $map: {
                          input: { $ifNull: ["$categories", []] },
                          as: "cat",
                          in: "$$cat.value",
                        },
                      },
                      jobCategories: {
                        $map: {
                          input: { $ifNull: ["$$jobCategories", []] },
                          as: "cat",
                          in: "$$cat.value",
                        },
                      },
                    },
                    in: {
                      $gt: [
                        {
                          $size: {
                            $setIntersection: [
                              "$$jobCategories",
                              "$$candidateCategories",
                            ],
                          },
                        },
                        0,
                      ],
                    },
                  },
                },
                qualificationMatch: {
                  $let: {
                    vars: {
                      requiredQualifications: {
                        $reduce: {
                          input: {
                            $filter: {
                              input: { $ifNull: ["$$jobQualifications", []] },
                              as: "qualification",
                              cond: { $ne: ["$$qualification", null] },
                            },
                          },
                          initialValue: [],
                          in: { $concatArrays: ["$$value", ["$$this"]] },
                        },
                      },
                      candidateQualifications: {
                        $map: {
                          input: { $ifNull: ["$education", []] },
                          as: "edu",
                          in: "$$edu.qualification",
                        },
                      },
                    },
                    in: {
                      $gt: [
                        {
                          $size: {
                            $setIntersection: [
                              "$$requiredQualifications",
                              "$$candidateQualifications",
                            ],
                          },
                        },
                        0,
                      ],
                    },
                  },
                },
              },
            },
            {
              $project: {
                _id: 1,
                designationMatch: 1,
                experienceMatch: 1,
                categoryMatch: 1,
                qualificationMatch: 1,
              },
            },
          ],
          as: "candidates",
        },
      },

      // Unwind candidates array for analysis
      { $unwind: { path: "$candidates", preserveNullAndEmptyArrays: true } },

      // Group and calculate counts
      {
        $group: {
          _id: null,
          totalCandidates: { $sum: 1 },
          designationMatchCount: {
            $sum: {
              $cond: [{ $eq: ["$candidates.designationMatch", true] }, 1, 0],
            },
          },
          experienceMatchCount: {
            $sum: {
              $cond: [{ $eq: ["$candidates.experienceMatch", true] }, 1, 0],
            },
          },
          categoryMatchCount: {
            $sum: {
              $cond: [{ $eq: ["$candidates.categoryMatch", true] }, 1, 0],
            },
          },
          qualificationMatchCount: {
            $sum: {
              $cond: [{ $eq: ["$candidates.qualificationMatch", true] }, 1, 0],
            },
          },
        },
      },

      // Final projection
      {
        $project: {
          _id: 0,
          totalCandidates: 1,
          matchCounts: {
            designation: "$designationMatchCount",
            experience: "$experienceMatchCount",
            categories: "$categoryMatchCount",
            qualification: "$qualificationMatchCount",
          },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

export {
  createEmployer,
  getEmployers,
  getEmployer,
  CandidatesForEmployer,
  updateEmployer,
  deleteEmployer,
  EmployerDashboard,
  CandidateMatchGraphByEmployer,
  ForwardCV,
  getSubEmployers,
};
