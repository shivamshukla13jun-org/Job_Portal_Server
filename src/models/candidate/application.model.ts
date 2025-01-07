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

export interface IApplication extends Document {
  job: mongoose.Types.ObjectId;
  candidate: mongoose.Types.ObjectId;
  employer: mongoose.Types.ObjectId;
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
  status: 'pending' | 'shortlisted' | 'rejected';
}

const applicationSchema: Schema<IApplication> = new Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
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
          unique: true,
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
      message: { type: String, default: '' },
      meetingLink: { type: String, default: '' },
      createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      intrviewConfirmation: {
        message: { type: String, default: '' },
        confirm: { type: Boolean, default: false },
      },
    },

    status: {
      type: String,
      enum: ['pending', 'shortlisted', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

const Application = mongoose.model<IApplication>('Application', applicationSchema);
export { Application };
