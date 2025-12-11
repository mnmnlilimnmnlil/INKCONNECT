const mongoose = require('mongoose');

const collabSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 2000
    },
    styles: {
      type: [String],
      default: []
    },
    location: {
      type: String,
      default: '',
      trim: true
    },
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    },
    status: {
      type: String,
      enum: ['open', 'closed'],
      default: 'open'
    },
    participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  { timestamps: true }
);

collabSchema.index({ status: 1, createdAt: -1 });
collabSchema.index({ styles: 1 });
collabSchema.index({ location: 'text', title: 'text', description: 'text' });

module.exports = mongoose.model('Collab', collabSchema);

