import nodemailer from "nodemailer"
import dotenv from "dotenv"

import { AppError } from "@/middlewares/error";

dotenv.config()

export interface IEmail {
    email: string;
    subject: string;
    text: string
}

export const sendEmail = async ({ email, subject, text }: IEmail) => {
    try {
        const transporter = nodemailer.createTransport({
            service: process.env.MAIL_HOST,
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: process.env.MAIL_USERNAME,
                pass: process.env.MAIL_PASSWORD,
            }
        })

        const mailOptions = {
            from: process.env.MAIL_USERNAME,
            to: email,
            subject: subject,
            text: text,
        }

        const info = await transporter.sendMail(mailOptions)

        return info
    } catch (error) {
        console.log(error)
        return error
        throw new AppError('Failed to send Email', 500)
    }
}