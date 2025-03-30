import { Types } from "mongoose";
import { NextFunction, Request, Response } from "express";

import { AppError } from "@/middlewares/error";
import Job from "@/models/portal/job.model";
import { validateCantactUs } from "@/validations/candidate";
import { sendEmail } from "@/services/emails";
import Candidate from "@/models/portal/candidate.model";
import { Application } from "@/models/candidate/application.model";
import Employer from "@/models/portal/employer.model";

/**
 @desc      Get an company
 @route     POST /api/v1/company/:id
 @access    Public
// **/
const getSalaryRnage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const [maxsalary, maxeperience] = await Promise.all([
      Job.findOne({}, { _id: 0, "candidate_requirement.salary_to": 1 })
        .sort({ "candidate_requirement.salary_to": -1 })
        .lean(),
      Job.findOne({}, { _id: 0, "candidate_requirement.experience": 1 })
        .sort({ "candidate_requirement.experience": -1 })
        .lean(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        maxsalary: maxsalary,
        maxeperience: maxeperience,
      },
      message: "company and jobs fetched successfully",
    });
  } catch (error) {
    next(error);
  }
};
/**
 @desc      Get an company
 @route     POST /api/v1/options/:id
 @access    Public
// **/
interface OptionsQuery {
  type?: string;
  id?: Types.ObjectId;
}
const Options = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let { type, id } = req.params as OptionsQuery;
    
    if (!type) {
      throw new AppError("Provide type", 400);
    }

    const match: Record<string, any> = {
      employerId: new Types.ObjectId(id),
    };

    // Base pipeline with match condition
    const pipeline: any[] = [{ $match: match }];
    
    // Process pipeline based on type
    const result = await processOptionsPipeline(type, pipeline, Job);
    
    res.status(200).json({
      success: true,
      data: result,
      message: "Data fetched successfully",
    });
  } catch (error) {
    next(error);
  }
};

const ApplicationOptions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let { type, id } = req.params as OptionsQuery;
    const status = req.query.status;
    
    if (!type) {
      throw new AppError("Provide type", 400);
    }

    const match: Record<string, any> = {
      employer: new Types.ObjectId(id),
    };

    if (status) {
      match["status"] = status;
    }

    // Base pipeline with lookups
    const pipeline: any[] = [
      { $match: match },
      {
        $lookup: {
          from: "candidates",
          localField: "candidate",
          foreignField: "_id",
          as: "candidate",
        },
      },
      {
        $unwind: "$candidate",
      },
    ];
    
    // Process pipeline based on type
    const result = await processApplicationPipeline(type, pipeline, Application);
    
    res.status(200).json({
      success: true,
      data: result,
      message: "Data fetched successfully",
    });
  } catch (error) {
    next(error);
  }
};

const allcandidatesOptions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let { type } = req.params as OptionsQuery;
    const status = req.query.status;
    
    if (!type) {
      throw new AppError("Provide type", 400);
    }

    const match: Record<string, any> = {};
    
    if (status) {
      match["status"] = status;
    }

    // Base pipeline with lookups
    const pipeline: any[] = [
      { $match: match },
      {
        $lookup: {
          from: "candidates",
          localField: "candidate",
          foreignField: "_id",
          as: "candidate",
        },
      },
      {
        $unwind: "$candidate",
      },
    ];
    
    // Process pipeline based on type - reusing the same function as ApplicationOptions
    const result = await processApplicationPipeline(type, pipeline, Application);
    
    res.status(200).json({
      success: true,
      data: result,
      message: "Data fetched successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Helper functions to process pipelines based on type
async function processOptionsPipeline(type: string, pipeline: any[], model: any) {
  const pipelineProcessors: Record<string, (pipeline: any[]) => any[]> = {
    "personal_info.info.degree": (pipeline) => {
      return pipeline.concat([
        { $unwind: "$degrees" },
        {
          $group: {
            _id: "$degrees",
            total: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: "degrees",
            localField: "_id",
            foreignField: "_id",
            as: "degree",
          },
        },
        { $project: { _id: 0, value: "$degree._id",label: "$degree.label", total: 1 } },
        { $sort: { value: 1 } }
      ]);
    },
    "degrees": (pipeline) => {
      return pipeline.concat([
        { $unwind: "$degrees" },
        {
          $group: {
            _id: "$degrees",
            total: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: "degrees",
            localField: "_id",
            foreignField: "_id",
            as: "degree",
          },
        },
        { $project: { _id: 0, value: "$degree._id",label: "$degree.label", total: 1 } },
        { $sort: { value: 1 } }
      ]);
    },
    "jobtype": (pipeline) => {
      return pipeline.concat([
        {
          $group: {
            _id: "$jobtype",
            total: { $sum: 1 },
          },
        },
        { $project: { _id: 0, value: "$_id",label: "$_id", total: 1 } },
        { $sort: { value: 1 } }
      ]);
    },
    
    "categories.label": (pipeline) => {
      return pipeline.concat([
        { $unwind: "$categories" },
        {
          $group: {
            _id: "$categories",
            total: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: "jobcategories",
            localField: "_id",
            foreignField: "_id",
            as: "category",
          },
        },
        {
          $unwind: { path: "$category", preserveNullAndEmptyArrays: true },
        },
        {
          $project: { value: "$category.value", label: "$category.label", _id: 0, total: 1 },
        },
        { $sort: { label: 1 } },
      ]);
    },
    "salary_experience": (pipeline) => {
      return pipeline.concat([
        {
          $group: {
            _id: null,
            minSalary: { $min: "$candidate_requirement.salary_from" },
            maxSalary: { $max: "$candidate_requirement.salary_to" },
          },
        },
        {
          $project: {
            _id: 0,
            maxSalary: 1,
            minSalary: 1,
          },
        }
      ]);
    },
    "experience": (pipeline) => {
      return pipeline.concat([
        {
          $group: {
            _id: null,
            minExperience: { $min: "$candidate_requirement.experience" },
            maxExperience: { $max: "$candidate_requirement.experience" },
          },
        },
        {
          $project: {
            _id: 0,
            minExperience: 1,
            maxExperience: 1,
          },
        }
      ]);
    },
    "default": (pipeline) => {
      return pipeline.concat([
        {
          $group: {
            _id: `$${type}`,
            total: { $sum: 1 },
          },
        },
        { $project: { _id: 0, value: "$_id", total: 1 } },
        { $sort: { value: 1 } }
      ]);
    }
  };

  // Get the appropriate processor function or default
  const processor = pipelineProcessors[type] || pipelineProcessors["default"];
  const processedPipeline = processor(pipeline);
  
  // Execute the query
  if (type === "salary_experience" || type === "experience") {
    const [data] = await model.aggregate(processedPipeline);
    return data;
  } else {
    return await model.aggregate(processedPipeline);
  }
}

async function processApplicationPipeline(type: string, pipeline: any[], model: any) {
  const pipelineProcessors: Record<string, (pipeline: any[]) => any[]> = {
    "degrees": (pipeline) => {
      return pipeline.concat([
        { $unwind: "$candidate.education" },
        {
          $group: {
            _id: `$candidate.education.qualification`,
            total: { $sum: 1 },
          },
        },
        { $project: {  value: "$_id",label: "$_id", total: 1 } },
        { $sort: { value: 1 } }
      ]);
    },
    "personal_info.info.degree": (pipeline) => {
      return pipeline.concat([
        { $unwind: "$candidate.education" },
        {
          $group: {
            _id: `$candidate.education.qualification`,
            total: { $sum: 1 },
          },
        },
        { $project: {  value: "$_id",label: "$_id", total: 1 } },
        { $sort: { value: 1 } }
      ]);
    },
    "categories.label": (pipeline) => {
      return pipeline.concat([
        { $unwind: "$candidate.employment" },
        { $unwind: "$candidate.employment.categories" },
        {
          $group: {
            _id: `$candidate.employment.categories`,
            total: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: "jobcategories",
            localField: "_id",
            foreignField: "_id",
            as: "category",
          },
        },
        {
          $unwind: { path: "$category", preserveNullAndEmptyArrays: true },
        },
        {
          $project: { value: "$category.value", label: "$category.label", _id: 0, total: 1 },
        },
        { $sort: { total: 1 } },
      ]);
    },
    "salary_experience": (pipeline) => {
      return pipeline.concat([
        {
          $group: {
            _id: null,
            minSalary: { $min: "$candidate.currentsalary" },
            maxSalary: { $max: "$candidate.currentsalary" },
          },
        },
        {
          $project: {
            _id: 0,
            maxSalary: 1,
            minSalary: 1,
          },
        }
      ]);
    },
    "experience": (pipeline) => {
      return pipeline.concat([
        {
          $group: {
            _id: null,
            minExperience: { $min: "$candidate.experience" },
            maxExperience: { $max: "$candidate.experience" },
          },
        },
        {
          $project: {
            _id: 0,
            minExperience: 1,
            maxExperience: 1,
          },
        }
      ]);
    },
    "default": (pipeline) => {
      return pipeline.concat([
        {
          $group: {
            _id: `$candidate.${type}`,
            total: { $sum: 1 },
          },
        },
        { $project: { _id: 0, value: "$_id", total: 1 } },
        { $sort: { value: 1 } }
      ]);
    }
  };

  // Get the appropriate processor function or default
  const processor = pipelineProcessors[type] || pipelineProcessors["default"];
  const processedPipeline = processor(pipeline);
  
  // Execute the query
  if (type === "salary_experience" || type === "experience") {
    const [data] = await model.aggregate(processedPipeline);
    return data;
  } else {
    return await model.aggregate(processedPipeline);
  }
}
const getAllEmployers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let { page, limit, keyword } = req.query as {
      page?: string;
      limit?: string;
      keyword?: string;
    };

    const pageOptions = {
      page: parseInt(page as string, 10) || 1,
      limit: parseInt(limit as string, 10) || 10,
    };
    const createRegex = (value: string) =>
      new RegExp(`.*${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}.*`, "i"); // Escape special characters

    const matchQueries: Record<string, any> = {};

    if (keyword) {
      const trimmedKeyword = keyword.trim();
      matchQueries["$or"] = [
        { name: createRegex(trimmedKeyword) },
        { business_name: createRegex(trimmedKeyword) },
      ];
    }

    const result = await Employer.aggregate([
      { $match: matchQueries }, // Apply filters
      { $sort: { createdAt: -1 } }, // Sort by latest
      { $project: { business_name: 1, name: 1,logo:1 } }, // Select fields
      {
        $facet: {
          metadata: [{ $count: "total" }], // Get total count
          data: [
            // { $skip: (pageOptions.page-1) * pageOptions.limit },
            // { $limit: pageOptions.limit },
           
          ],
        },
      },
    ]);

    const totalCount = result[0]?.metadata[0]?.total || 0;
    const totalPages = Math.ceil(totalCount / pageOptions.limit);
    const data = result[0]?.data || [];

    res.status(200).json({
      success: true,
      data,
      totalCount,
      totalPages,
      currentPage: pageOptions.page,
      message: "Data fetched successfully",
    });
  } catch (error) {
    next(error);
  }
};

const ContactUs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, email, subject, message } = req.body;
    const check = await validateCantactUs(req.body);
    if (!check) {
      return;
    }
    const mailOptions = {
      // From the user's email
      email, // Replace with your email
      subject, // Subject from form
      text: `
              You have received a new message from your website contact form:
        
              Name: ${username}
              Email: ${email}
              Subject: ${subject}
              Message: ${message}
            `,
    };
    sendEmail(mailOptions);
    res.status(200).json({
      success: true,
      message: "Email sent successfully",
    });
  } catch (error) {
    next(error);
  }
};

export {
  getSalaryRnage,
  ContactUs,
  Options,
  ApplicationOptions,
  getAllEmployers,allcandidatesOptions
};
