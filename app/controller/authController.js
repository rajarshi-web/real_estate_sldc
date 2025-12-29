const User = require('../model/userModel');
const { hashedPassword, comparePassword } = require('../helper/hashedPassword');
const jwt = require('jsonwebtoken');
const sendEmailVerivicationOTP = require('../helper/sendEmail');
const EmailVerifyModel=require('../model/otpModel')
class AuthController {
    async Register(req, res) {
        //console.log(req.body);

        try {
            const { name, email, password, phone } = req.body;
            if (!name || !email || !password || !phone) {
                return res.status(400).json({ message: "All fields are required" })
            }
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ message: "User already exists" })
            }
            const hashpassword = await hashedPassword(password)
            const userdata = new User({
                name,
                email,
                password: hashpassword,
                phone
            })
            const user = await userdata.save();
            sendEmailVerivicationOTP(req,user)
            return res.status(201).json({
                message: "User registered successfully and send otp please verify your email",
                data: user
            })

        } catch (error) {
            console.log('error', error.message);

            return res.status(500).json({ message: "Internal server error" })

        }
    }


    async VerifyEmail(req, res) {
        try {
            const { email, otp } = req.body;
            // Check if all required fields are provided
            if (!email || !otp) {
                return res.status(400).json({ status: false, message: "All fields are required" });
            }
            const existingUser = await User.findOne({ email });

            // Check if email doesn't exists
            if (!existingUser) {
                return res.status(404).json({ status: "failed", message: "Email doesn't exists" });
            }

            // Check if email is already verified
            if (existingUser.is_verified) {
                return res.status(400).json({ status: false, message: "Email is already verified" });
            }
            // Check if there is a matching email verification OTP
            const emailVerification = await EmailVerifyModel.findOne({ userId: existingUser._id, otp });
            if (!emailVerification) {
                if (!existingUser.is_verified) {
                    // console.log(existingUser);
                    await sendEmailVerivicationOTP(req, existingUser);
                    return res.status(400).json({ status: false, message: "Invalid OTP, new OTP sent to your email" });
                }
                return res.status(400).json({ status: false, message: "Invalid OTP" });
            }
            // Check if OTP is expired
            const currentTime = new Date();
            // 15 * 60 * 1000 calculates the expiration period in milliseconds(15 minutes).
            const expirationTime = new Date(emailVerification.createdAt.getTime() + 15 * 60 * 1000);
            if (currentTime > expirationTime) {
                // OTP expired, send new OTP
                await sendEmailVerivicationOTP(req, existingUser);
                return res.status(400).json({ status: "failed", message: "OTP expired, new OTP sent to your email" });
            }
            // OTP is valid and not expired, mark email as verified
            existingUser.is_verified = true;
            await existingUser.save();

            // Delete email verification document
            await EmailVerifyModel.deleteMany({ userId: existingUser._id });
            return res.status(200).json({ status: true, message: "Email verified successfully" });


        } catch (error) {
            console.error(error);
            res.status(500).json({ status: false, message: "Unable to verify email, please try again later" });
        }


    }

    async Login(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ message: "All fields are required" })
            }
            const existingUser = await User.findOne({ email });
            console.log('existingUser', existingUser);
            if (!existingUser) {
                return res.status(400).json({ message: "Email doesn`t exist" })
            }
            if(!existingUser.is_verified){
                return res.status(400).json({ message: "Please verify your email to login" })
            }

            const isMatch = await comparePassword(password, existingUser.password)
            if (!isMatch) {
                return res.status(400).json({ message: "Invalid credentials" })
            }
            const token = jwt.sign({
                _id: existingUser._id,
                name: existingUser.name,
                email: existingUser.email,
                phone: existingUser.phone,
            }, process.env.JWT_SECRET, { expiresIn: '1h' })

            return res.status(200).json({
                message: "User logged in successfully",
                token: token,
                user: {
                    name: existingUser.name,
                    email: existingUser.email,
                    phone: existingUser.phone,
                }
            })

        } catch (error) {
            console.log('error', error.message);
            return res.status(500).json({ message: "Internal server error" })
        }
    }

    async Dashboard(req, res) {
        return res.status(200).json({ message: "Welcome to the dashboard",data:req.user })
    }
}

module.exports = new AuthController();