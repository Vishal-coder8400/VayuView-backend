const generateOTP = (length) => {
    const digits = '0123456789'; // Define the characters allowed in the OTP
    let otp = '';
  
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * digits.length);
      otp += digits.charAt(randomIndex);
    }
  
    return otp;
  }

module.exports.generateOTP = generateOTP;