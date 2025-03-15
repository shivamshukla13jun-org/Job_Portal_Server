import mongoose, { Schema } from 'mongoose';

const CitySchema: Schema = new Schema({
  name: { type: String, required: true },
  state: { type: Schema.Types.ObjectId, ref: 'State', required: true },
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

// Compound index to ensure city names are unique within a state
CitySchema.index({ name: 1, state: 1 }, { unique: true });

export default mongoose.model('City', CitySchema);
