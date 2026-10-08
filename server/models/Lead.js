const mongoose = require('mongoose');

const LEAD_STATUSES = ['New', 'Contacted', 'Follow-up', 'Interested', 'Converted', 'Not Interested', 'Closed'];
const LEAD_SOURCES = ['Meta Lead Form', 'Facebook Instant Form', 'Instagram Instant Form', 'Meta Ad', 'Manual Entry', 'CSV Import'];

const noteSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    author: { type: String, default: 'System' },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const leadSchema = new mongoose.Schema(
  {
    metaLeadId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Lead name is required'],
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      index: true,
    },
    course: {
      type: String,
      default: '',
      trim: true,
    },
    location: {
      type: String,
      default: '',
    },
    formData: [
      {
        field: String,
        label: String,
        value: String,
      },
    ],
    source: {
      type: String,
      default: 'Manual Entry',
      enum: LEAD_SOURCES,
    },
    campaignName: {
      type: String,
      default: '',
    },
    campaignId: {
      type: String,
      default: '',
    },
    adSetName: {
      type: String,
      default: '',
    },
    adSetId: {
      type: String,
      default: '',
    },
    adName: {
      type: String,
      default: '',
    },
    adId: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: LEAD_STATUSES,
      default: 'New',
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    notes: [noteSchema],
    followUpDate: {
      type: Date,
      default: null,
      index: true,
    },
    lastContactedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Search indexes
leadSchema.index({ name: 'text', email: 'text', phone: 'text', course: 'text', campaignName: 'text' });

const Lead = mongoose.model('Lead', leadSchema);
Lead.LEAD_STATUSES = LEAD_STATUSES;
Lead.LEAD_SOURCES = LEAD_SOURCES;

module.exports = Lead;
