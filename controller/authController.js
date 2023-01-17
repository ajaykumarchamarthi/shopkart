const jwt = require("jsonwebtoken");
const { promisfy } = require("util");
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const crypto = require("crypto");
const Email = require("./../utils/email");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  // if(process.env.NODE_ENV === "production"){
  //    cookieOptions.secure = true;
  // }

  // res.cookie("jwt", token, cookieOptions);

  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    fullName: req.body.fullName,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  const user = await User.findOne({ email: req.body.email });

  const verificationToken = user.createEmailVerificationToken();

  await user.save({ validateBeforeSave: false });

  try {
    const emailVerificationEmail = `https://shopkart.com/emailVerification/${verificationToken}`;

    await new Email(user, emailVerificationEmail).sendWelcome();

    res.status(200).json({
      status: "success",
      message: "Token sent to the email...Please Verify the email",
    });
  } catch (err) {
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError("There was an error sending this email.Try again later", 500)
    );
  }
});

exports.emailVerification = catchAsync(async (req, res, next) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.verificationToken)
    .digest("hex");

  const verifiedUser = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { gt: Date.now() },
  });

  if (!verifiedUser) {
    return next(
      new AppError(
        "Email Verification Token is Expired or Invalid Email Verification Token",
        401
      )
    );
  }

  verifiedUser.emailVerificationToken = undefined;

  verifiedUser.emailVerificationExpires = undefined;

  verifiedUser.isVerified = true;

  await verifiedUser.save({ validateBeforeSave: false });

  await new Email(verifiedUser, url).sendWelcome();

  res.status(200).json({
    status: "success",
    message: "Email is verified successfully...Please Login to your Account.",
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("Please provide a email and password", 400));
  }

  const user = await User.findOne({ email }).select("+password");

  const correct = await user.correctPassword(password, user.password);

  if (!user || !correct) {
    return next(new AppError("Incorrect email or password", 401));
  }

  if (!user.isVerified) {
    return next(
      new AppError(
        "Email is not verified...Please verify Email to login successfully",
        400
      )
    );
  }

  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Checking and Getting token

  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(
      new AppError("Your'e not logged in! Please login to get access", 401)
    );
  }

  // 2) Verifying token
  const decoded = await promisfy(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exist
  const freshUser = await User.findById(decoded.id);

  if (!freshUser) {
    next(new AppError("The token belonging to user doesn't longer exist", 401));
  }

  //4) Check if user changed password after the token was issued
  if (freshUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError("user recently changed password! Please login again", 401)
    );
  }

  //5) Grant access to protected data
  req.user = freshUser;
  next();
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the email
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return new AppError("There is no user with this email address", 404);
  }

  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  user.passwordResetToken = resetToken;
  await user.save({ validateBeforeSave: false });

  try {
    // 3) Send it to user's email
    const resetURL = `URL/${resetToken}`;

    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: "success",
      message: "Token sent to the email",
    });
  } catch (err) {
    user.createPasswordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError("There was an error sending this email.Try again later", 500)
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get the user based on the token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) Token has expired or no user
  if (!user) {
    return next(new AppError("Token is invalid or has expired", 400));
  }

  // 3) If Token has not expired and there is user
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save({ validateBeforeSave: false });
});
