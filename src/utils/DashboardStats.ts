
import { Request } from "express";

const getDashboardstats=(req:Request,matchStage:Record<string,any>,label:string)=>{
    const today = new Date();
const lastYear = new Date(today.setFullYear(today.getFullYear() - 1));
const monthsArray = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
console.log("match stage",matchStage)
// Base aggregation pipeline for monthly stats
const baseStats:any = [
  { $match: matchStage },
  {
    $group: {
      _id: {
        year: { $year: "$createdAt" },
        month: { $month: "$createdAt" }
      },
      total: { $sum: 1 }
    }
  },
  { $sort: { "_id.year": 1, "_id.month": 1 } },
  {
    $group: {
      _id: null,
      labels: {
        $push: { $arrayElemAt: [monthsArray, { $subtract: ["$_id.month", 1] }] }
      },
      data: { $push: "$total" }
    }
  },
  {
    $project: {
      _id: 0,
      labels: 1,
      data: "$data",
    }
  }
];
return baseStats
}

// Function to calculate percentages for numeric fields
const getNumericPercentageStats = (fields:string[]) => {
  return fields.map((field:string) => {
    let propertyName = `${field}.percentage`;
    let multiply = [{ $divide: [`$${field}.total`, `$total.total`] }, 100];

    return {
      $addFields: {
        [propertyName]: {
          $cond: [
            { $gt: ["$total.total", 0] },
            { $multiply: multiply },
            0
          ]
        }
      }
    };
  });
};

// Function to calculate percentages for string-based fields
const getStringPercentageStats = (fields:string[]) => {
  let addFieldsObj:Record<string,any> = {};
  fields.forEach((field) => {
    addFieldsObj[field] = {
      $map: {
        input: `$${field}`,
        as: "item",
        in: {
          [field]: `$$item.${field}`,
          total: "$$item.total",

          percentage: {
            $cond: [
              { $gt: ["$total.total", 0] },
              { $multiply: [{ $divide: ["$$item.total", "$total.total"] }, 100] },
              0
            ]
          },
          _id:"$$item._id"
        }
      }
    };
  });

  return [{ $addFields: addFieldsObj }];
};
export  {getDashboardstats,getNumericPercentageStats,getStringPercentageStats}