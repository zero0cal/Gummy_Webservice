const mongoose = require('mongoose');

// MongoDB에 저장할 클라이언트 스키마 정의
const clientSchema = new mongoose.Schema({
  storeName: { type: String, required: true },
  roadAddress: { type: String, required: true },
  phoneNumber: { type: String, required: false },
  paymentInfo: {
    amount: { type: Number, required: true },  // 결제 금액
    paymentMethod: { type: String, required: true },  // 결제 방식
    status: { type: String, required: true },  // 결제 상태 (paid, failed 등)
    paymentDate: { type: Date, default: Date.now }  // 결제 날짜
  }
});

const Client = mongoose.model('Client', clientSchema);

module.exports = Client;
