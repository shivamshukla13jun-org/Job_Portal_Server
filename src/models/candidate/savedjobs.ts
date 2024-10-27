import { Schema, model, Document } from 'mongoose';

export interface ISavedJobs extends Document {
  userId: Schema.Types.ObjectId;
  jobs: Schema.Types.ObjectId[];
}

const SavedJobschema = new Schema<ISavedJobs>(
  {
    jobs: {
      type: [Schema.Types.ObjectId],
      default: [],
      ref: 'Job',
      required: [true, 'Job id is required'],
      validate: {
        validator: function (v: Schema.Types.ObjectId[]) {
          // Check for duplicates in the jobids array
          return Array.isArray(v) && new Set(v.map((id) => id.toString())).size === v.length;
        },
        message: (props: any) => `Duplicate values found in jobids array: ${props.value}`,
      },
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'Candidate',
      required: [true, 'Candidate id is required'],
    },
  },
  { timestamps: true }
);

export const SavedJobs = model<ISavedJobs>('SavedJobs', SavedJobschema);
