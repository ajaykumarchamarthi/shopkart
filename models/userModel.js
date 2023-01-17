const mongoose = require("mongoose");
const validator = require("validator");

const bcrypt = require("bcrypt");
const crypto = require("crypto");

const userSchema = mongoose.Schema({
  fullName: {
    type: String,
    require: [true, "User must have a name"],
  },
  email: {
    type: String,
    unique: true,
    required: [true, "Please provide a email"],
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
  },
  passwordConfirm: {
    type: String,
    required: [true, "Please confirm your password"],
    select: false,
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: "Password are not same",
    },
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  emailVerificationToken: String,
  emailVerificationTokenExpires: Date,
});

// Instance method available to all the user document

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimeStamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimeStamp < changedTimeStamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 10 * 60 * 60 * 1000;
  return resetToken;
};

userSchema.methods.createEmailVerificationToken = function () {
  const verificationToken = crypto.randomBytes(32).toString("hex");

  this.emailVerificationToken = crypto.createHash("256").toString("hex");

  this.emailVerificationExpires = Date.now() + 10 * 60 * 60 * 1000;
  return verificationToken;
};

const User = mongoose.model("User", userSchema);
module.exports = User;
