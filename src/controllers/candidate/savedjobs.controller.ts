import { Request, Response, NextFunction } from "express";
import { ISavedJobs, SavedJobs } from "../../models/candidate/savedjobs";
import mongoose, { Types } from "mongoose";

// Create a new SavedJobs
export const manageSavedJobs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  const session = await mongoose.startSession();
  session.startTransaction(); // Start transaction
  try {
    const userId = res.locals.userId as Types.ObjectId;
    const Id = new Types.ObjectId(req.body.id as string);
    const { operation } = req.body; // Assuming the operation is passed in the request body

    // Validate operation type
    if (!["add", "remove"].includes(operation)) {
      return res
        .status(400)
        .json({ message: "Invalid operation", success: false });
    }

    // Check if the user's SavedJobs already exists
    const existingSavedJobs = await SavedJobs.findOne(
      { userId },
      { _id: 1 }
    ).session(session);

    if (existingSavedJobs) {
      if (operation === "add") {
        // Add the jobId to the SavedJobs (if not already present)
        await SavedJobs.findOneAndUpdate(
          { userId },
          { $addToSet: { jobs: Id } }, // Ensure jobId uniqueness
          { new: true }
        ).session(session);
      } else if (operation === "remove") {
        // Remove the jobId from the SavedJobs
        await SavedJobs.findOneAndUpdate(
          { userId },
          { $pull: { jobs: Id } }, // Remove jobId from array
          { new: true }
        ).session(session);
      }
    } else if (operation === "add") {
      // If SavedJobs doesn't exist and operation is 'add', create a new SavedJobs
      await SavedJobs.create([{ userId, jobs: [Id] }], { session });
    }

    await session.commitTransaction();
    await session.endSession();

    return res
      .status(200)
      .json({
        message: `${operation === "add" ? "Added" : "Removed"}`,
        success: true,
      });
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    next(error);
  }
};

// Get all SavedJobs
export const getSavedJobs = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = res.locals.userId as Types.ObjectId;

    const [data] = await SavedJobs.aggregate([
      { $match: { userId: new Types.ObjectId(userId) } },
      {
        $project: {
          jobs: 1,
          _id: 0,
        },
      },
      { $limit: 1 },
    ]);
    res.status(200).json({ data: data?.jobs || [], mssage: "" });
  } catch (error) {
    next(error);
  }
};
export const getSavedJobsAll = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = res.locals.userId as Types.ObjectId;

    let { page = 1, limit = 10 } = req.query;

    const options = {
      page: parseInt(page as string, 10) || 1,
      limit: parseInt(limit as string, 10) || 8,
    };

    // Calculate skip value for pagination
    const skip = (options.page - 1) * options.limit;

    const [data] = await SavedJobs.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
        },
      },
      {
        $lookup: {
          from: "jobs",
          localField: "jobs",
          foreignField: "_id",
          pipeline: [
            {
              $lookup: {
                from: "employers",
                localField: "employerId",
                foreignField: "_id",
                as: "employerId",
              },
            },
            {
              $unwind: {
                path: "$employerId",
                preserveNullAndEmptyArrays: true,
              },
            },
          ],
          as: "jobs",
        },
      },
      {
        $set: {
          totalJobs: { $size: "$jobs" }, // Add the total count of jobs
        },
      },
      {
        $project: {
          jobs: { $slice: ["$jobs", skip, options.limit] }, // Paginate jobs array
          totalJobs: 1, // Include total count in the response
          _id: 0,
        },
      },
    ]);

    res.status(200).json({ data: data?.jobs || [],totalPages:Math.ceil((data.totalJobs || 0)/options.limit), mssage: "" });
  } catch (error) {
    next(error);
  }
};
