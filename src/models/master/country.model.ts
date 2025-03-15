import mongoose, { Schema } from 'mongoose';

const CountrySchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true },
  isActive: { type: Boolean, default: true },
  createdBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'Admin', 
    required: true 
  },
  updatedBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'Admin' 
  },
}, {
  timestamps: true
});

export default mongoose.model('Country', CountrySchema);
