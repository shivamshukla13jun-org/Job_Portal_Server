import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IInterviewDetails {
  message: string;
  confirm: boolean;
}

export interface ISubEmployers {
  subEmployerId: Types.ObjectId;
  status: 'pending' | 'shortlisted' | 'rejected';
  additionalNotes?: string;
}
export interface StatusPayload {
  status: 'pending' | 'shortlisted' | 'rejected';
  shortlistedby?: Types.ObjectId;
  rejectedby?: Types.ObjectId;
  
} 

export interface IApplication extends Document {
  job: mongoose.Types.ObjectId;
  statusPerformBy?: mongoose.Types.ObjectId;
  candidate: mongoose.Types.ObjectId;
  employer: mongoose.Types.ObjectId;
  status: 'pending' | 'shortlisted' | 'rejected';
  shortlistedby?: Types.ObjectId;
  rejectedby?: Types.ObjectId;
  toSubEmployers: ISubEmployers[]; // Array of sub-employers
  meeting: {
    date: string;
    time: string;
    timeDuration: string;
    email: string;
    phone: string;
    message: string;
    intrviewConfirmation: IInterviewDetails;
    meetingLink: string;
    createdBy?: mongoose.Types.ObjectId;
  };
}

const applicationSchema: Schema<IApplication> = new Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    statusPerformBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate',
      required: true,
    },
    employer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employer',
      required: true,
    },
    toSubEmployers: [
      {
        _id: false,
        subEmployerId: {
          type: Schema.Types.ObjectId,
          ref: 'SubEmployer',
        },
        status: {
          type: String,
          enum: ['pending', 'shortlisted', 'rejected'],
          default: 'pending',
        },
        additionalNotes: {
          type: String,
          default: '',
        },
      },
    ],

    meeting: {
      date: { type: String },
      time: { type: String },
      timeDuration: { type: String },
      email: { type: String },
      phone: { type: String },
      message: { type: String,  },
      meetingLink: { type: String,  },
      createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      intrviewConfirmation: {
        message: { type: String,   },
        confirm: { type: Boolean, },
      },
    },

    status: {
      type: String,
      enum: ['pending', 'shortlisted', 'rejected'],
      default: 'pending',
    },
    shortlistedby: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectedby: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

const Application = mongoose.model<IApplication>('Application', applicationSchema);
export { Application };
