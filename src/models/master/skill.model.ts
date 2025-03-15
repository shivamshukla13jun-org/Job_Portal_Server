import mongoose, { Document, Schema } from 'mongoose';

export interface ISkill extends Document {
  label: string;
  value: string;
}

const skillSchema = new Schema<ISkill>(
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

const Skill = mongoose.model<ISkill>('Skill', skillSchema);
export default Skill;