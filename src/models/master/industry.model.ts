import mongoose, { Document, Schema } from 'mongoose';

export interface IIndustry extends Document {
  label: string;
  value: string;
}

const industrySchema = new Schema<IIndustry>(
  {
    label: { 
      type: String, 
      required: [true, 'Label is required'] 
    },
    value: { 
      type: String, 
      required: [true, 'Value is required'] 
    }
  },
  { 
    timestamps: true,
    toJSON: {
      virtuals: true
    },
    toObject: {
      virtuals: true
    },
    versionKey: false
  }
);

const Industry = mongoose.model<IIndustry>('Industry', industrySchema);
export default Industry;
