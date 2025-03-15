import mongoose, { Document, Schema } from 'mongoose';

export interface IDegree extends Document {
  label: string;
  value: string;
}

const degreeSchema = new Schema<IDegree>(
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

const Degree = mongoose.model<IDegree>('Degree', degreeSchema);
export default Degree;
