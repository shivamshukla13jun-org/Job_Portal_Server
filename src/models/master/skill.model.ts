import mongoose, { Document, Schema } from 'mongoose';

export interface ISkill extends Document {
  label: string;
  value: Schema.Types.ObjectId;
  isActive: boolean;
  createdBy: Schema.Types.ObjectId;
  updatedBy?: Schema.Types.ObjectId;
}

const skillSchema = new Schema<ISkill>(
  {
    label: { 
      type: String, 
      required: [true, 'Label is required'] 
    },
    value: { 
      type: Schema.Types.ObjectId,
      default: function() {
        if (this instanceof mongoose.Document) {
          return this._id;
        }
        return undefined;
      }
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
      required: [true, 'Created by is required']
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Admin'
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