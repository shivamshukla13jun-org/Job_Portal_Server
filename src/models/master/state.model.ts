import mongoose, { Schema } from 'mongoose';

const StateSchema: Schema = new Schema({
  name: { type: String, required: true },
  code: { type: String, required: true },
  country: { type: Schema.Types.ObjectId, ref: 'Country', required: true },
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

// Compound index to ensure state names are unique within a country
StateSchema.index({ name: 1, country: 1 }, { unique: true });
StateSchema.index({ code: 1, country: 1 }, { unique: true });

export default mongoose.model('State', StateSchema);
