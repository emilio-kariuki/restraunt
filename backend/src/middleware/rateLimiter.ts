// import rateLimit from 'express-rate-limit';

// export const generalLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // limit each IP to 100 requests per windowMs
//   message: 'Too many requests from this IP, please try again later.',
//   standardHeaders: true,
//   legacyHeaders: false
// });

// export const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 5, // limit each IP to 5 login requests per windowMs
//   message: 'Too many login attempts, please try again later.',
//   standardHeaders: true,
//   legacyHeaders: false
// });

// export const orderLimiter = rateLimit({
//   windowMs: 1 * 60 * 1000, // 1 minute
//   max: 10, // limit each IP to 10 orders per minute
//   message: 'Too many orders, please slow down.',
//   standardHeaders: true,
//   legacyHeaders: false
// });
