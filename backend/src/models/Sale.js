import mongoose from 'mongoose';

const saleSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'newInvoice' }
});

saleSchema.index({ date: 1 }); // Índice para mejorar consultas por fecha
export default mongoose.model('Sale', saleSchema);