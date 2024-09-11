// 기본 설정 및 패키지 불러오기
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');  // CORS 미들웨어 추가
const Client = require('./models/Client');
const dotenv = require('dotenv');
const Iamport = require('iamport');  // PortOne 모듈 추가


//.env 파일의 환경 변수를 불러올 수 있음.
dotenv.config();

//Express 어플리케이션 생성 및 포트 설정
const app = express();
const port = process.env.PORT || 5001;

//CORS 및 JSON 미들웨어 설정
app.use(cors());
app.use(express.json());


//MongoDB 연결 설정 
//MongoDB와 연결 및 메시지 출력 구문
//useNewUrlParser, useUnifiedTopology: MongoDB의 최신 연결 방식을 사용하도록 옵션 설정
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/paymentDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB에 연결되었습니다.'))
  .catch((err) => console.error('MongoDB 연결 오류:', err));


//포트원 결제 시스템과의 연동을 위해 API 키와 시크릿 키의 서정
const iamport = new Iamport({
  impKey: process.env.IMP_KEY,
  impSecret: process.env.IMP_SECRET
});


//결제 처리 API 엔드포인트
//클라이언트가 /api/payment 경로로 요청을 보내면, 클라이언트가 보낸 데이터를 추출한다.
app.post('/api/payment', async(req, res) =>  {
  //req.body에서 클라이언트가 보낸 데이터를 추출.
  try{
    const {storeName, roadAddress, phoneNumber, paymentMethod, imp_uid, merchant_uid} = req.body;

    //PortOne 결제 내역 검증 
    //imp_uid를 바탕으로 결제 내역을 조회
    console.log(imp_uid);
    const paymentData = await iamport.payment.getByImpUid({imp_uid});
    console.log(paymentData);
    
    //결제 상태 확인
    if (paymentData.status !== 'paid') {
      return res.status(400).json({ success: false, message: '결제가 완료되지 않았습니다.' });
    }

    //나중에 오류가 있을 것 같으면, "paid" 상태일 때만, 인스턴스 생성하고 저장하자.
    //MongoDB에 정보를 저장하기 위한 인스턴스 생성
    const newClient = new Client({
      storeName,
      roadAddress,
      phoneNumber,
      paymentInfo: {
        amount: paymentData.amount,
        paymentMethod: paymentData.pay_method,
        status: paymentData.status,
      }
    });

    //MongoDB에 결제 정보를 저장
    await newClient.save();

    //결제 성공 시, 응답
    res.status(201).json({ success: true, message: '결제가 완료되었습니다.' });
    
  }catch(error) {
  console.error('결제 처리 오류:', error);
  res.status(500).json({ success: false, message: '결제 처리 중 오류가 발생했습니다.' });
  }
}
);

app.listen(port, () => {
  console.log('서버가 http://localhost:${port} 에서 실행 중입니다.');
});