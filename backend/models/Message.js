import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String },
  media: { type: String },
  mediaType: { type: String },
  timestamp: { type: Date, default: Date.now },
  isSeen: { type: Boolean, default: false },
  isAccepted: { type: Boolean, default: false }
});

const Message = mongoose.model('Message', messageSchema);
export default Message;
