import { Schema, Document, model, Types } from "mongoose"
import bcrypt from "bcrypt";
import { IUserType } from "./userType.model";

export type IJobStatus = {
  jobId: Types.ObjectId;
  date: Date;
}

export interface IUser extends Document {
  name?: string;
  isActive:boolean;
  email: string;
  password?: string;
  subscription:Types.ObjectId;
  isresume:boolean,
  candidateId?: Types.ObjectId;
  employerId?: Types.ObjectId;
  parentEmployerId?: Types.ObjectId;
  subEmployerId?: Types.ObjectId;
  // jobs?: IJobStatus[];
  // shortListedJobs?: IJobStatus[];
  // rejectedJobs?: IJobStatus[];

  userType: Types.ObjectId | IUserType;
  user_otp: number;
  oauth: 'email' | 'google';
  user_verified?: boolean;
  isBlocked?: boolean;
  matchPassword: (pass: string) =>boolean;
}

const userSchema = new Schema<IUser>({
  name: {
    type: String
  },
  email: {
    type: String,
    required: [true, 'Email is required']
  },
  password: {
    type: String,
  },
  candidateId: {
    type: Schema.Types.ObjectId,
    ref: 'Candidate'
  },
  isresume:{
    type:Boolean,
    default:false,
  },
  employerId: {
    type: Schema.Types.ObjectId,
    ref: 'Employer'
  },
  parentEmployerId: {
    type: Schema.Types.ObjectId,
    ref: 'Employer'
  },
  subEmployerId: {
    type: Schema.Types.ObjectId,
    ref: 'SubEmployer'
  },
  
  // shortListedJobs: [
  //   {
  //     jobId: {
  //       type: Schema.Types.ObjectId,
  //       ref: 'Job'
  //     },
  //     date: { type: Date, required: true }
  //   }
  // ],
  // rejectedJobs: [
  //   {
  //     jobId: {
  //       type: Schema.Types.ObjectId,
  //       ref: 'Job'
  //     },
  //     date: { type: Date, required: true }
  //   }
  // ],
  userType: {
    type: Schema.Types.ObjectId, ref: 'UserType'
  },
  subscription: {
    type: Schema.Types.ObjectId, ref: 'subscriptions'
  },
  user_otp: {
    type: Number
  },
  isActive: {
    type: Boolean,
    default: true
},
  user_verified: {
    type: Boolean,
    default: false
  },
  oauth: {
    type: String,
    default: "email"
  },
  isBlocked: {
    type: Boolean,
    default: false
  }
}, { timestamps: true })


// encrypt the password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password as string, salt);
  next();
});

// match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (pass: string) {
  return await bcrypt.compare(pass, this.password);
};

const User = model<IUser>("User", userSchema);

export default User;