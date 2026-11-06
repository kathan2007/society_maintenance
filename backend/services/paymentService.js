import razorpay from "../config/razorpay.js";

export const createRazorpayOrder = async (amount) => {
  const options = {
    amount: Math.round(amount * 100), // convert to paise
    currency: "INR",
    receipt: `rcpt_${Math.floor(Date.now() / 1000)}`,
  };

  try {
    const order = await razorpay.orders.create(options);
    return order;
  } catch (err) {
    throw new Error(`Razorpay Order Error: ${err.message}`);
  }
};

export const generateUpiIntent = (amount, rzpOrderId) => {
  const upiId = process.env.VPA_ID || "9898216064@axl"; 
  const name = encodeURIComponent("SHREE HARI GIFT CITY");
  return `upi://pay?pa=${upiId}&pn=${name}&am=${amount}&cu=INR&tr=${rzpOrderId}`;
};
